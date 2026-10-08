// =============================================================
// NAGAR CONNECT — MEMBER 4
// backend/models/FieldTask.js
// Raw SQL model layer — extends existing DB conventions from M1
// =============================================================

const { pool } = require('../utils/db'); // Reuse M1 database pool

// ─────────────────────────────────────────
// Valid status transitions for field tasks
// Server-side enforcement only
// ─────────────────────────────────────────
const VALID_TRANSITIONS = {
  ASSIGNED:             ['ACCEPTED', 'CANNOT_RESOLVE', 'NEEDS_ESCALATION'],
  ACCEPTED:             ['ARRIVED',  'CANNOT_RESOLVE', 'NEEDS_ESCALATION'],
  ARRIVED:              ['IN_PROGRESS', 'CANNOT_RESOLVE', 'NEEDS_ESCALATION'],
  IN_PROGRESS:          ['WORK_COMPLETED', 'CANNOT_RESOLVE', 'NEEDS_ESCALATION'],
  WORK_COMPLETED:       ['RESOLUTION_SUBMITTED', 'IN_PROGRESS'], // allow back to fix issues
  RESOLUTION_SUBMITTED: [],  // terminal — only officer can move complaint forward
  CANNOT_RESOLVE:       [],  // terminal from field side
  NEEDS_ESCALATION:     [],  // terminal from field side — officer handles
};

const TIMESTAMP_MAP = {
  ACCEPTED:             'accepted_at',
  ARRIVED:              'arrived_at',
  IN_PROGRESS:          'started_at',
  WORK_COMPLETED:       'completed_at',
  RESOLUTION_SUBMITTED: 'resolution_submitted_at',
};

// ─────────────────────────────────────────
// isValidTransition
// ─────────────────────────────────────────
function isValidTransition(from, to) {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

// ─────────────────────────────────────────
// findById
// ─────────────────────────────────────────
async function findById(taskId) {
  const result = await pool.query(
    `SELECT
       ft.*,
       c.title              AS complaint_title,
       c.description        AS complaint_description,
       c.category_id,
       cat.name             AS category_name,
       c.priority           AS complaint_priority,
       c.status             AS complaint_status,
       c.location_address,
       c.location_landmark,
       c.location_lat,
       c.location_lng,
       c.complaint_number,
       c.department_id,
       dep.name             AS department_name,
       citizen.id           AS citizen_id,
       citizen.full_name    AS citizen_name,
       citizen.phone        AS citizen_phone,
       fs.id                AS staff_id,
       fs.full_name         AS staff_name,
       fs.phone             AS staff_phone,
       fs.employee_code     AS staff_employee_code,
       officer.id           AS officer_id,
       officer.full_name    AS officer_name
     FROM field_tasks ft
     INNER JOIN complaints c         ON c.id = ft.complaint_id
     INNER JOIN users citizen        ON citizen.id = c.citizen_id
     INNER JOIN users fs             ON fs.id = ft.field_staff_id
     INNER JOIN users officer        ON officer.id = ft.assigned_by
     LEFT  JOIN complaint_categories cat ON cat.id = c.category_id
     LEFT  JOIN departments dep      ON dep.id = c.department_id
     WHERE ft.id = $1 AND ft.is_active = TRUE`,
    [taskId]
  );
  return result.rows[0] || null;
}

// ─────────────────────────────────────────
// findByFieldStaff  (with filters)
// ─────────────────────────────────────────
async function findByFieldStaff(fieldStaffId, filters = {}) {
  const conditions = ['ft.field_staff_id = $1', 'ft.is_active = TRUE'];
  const values = [fieldStaffId];
  let idx = 2;

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      conditions.push(`ft.status = ANY($${idx})`);
      values.push(filters.status);
    } else {
      conditions.push(`ft.status = $${idx}`);
      values.push(filters.status);
    }
    idx++;
  }

  if (filters.priority) {
    conditions.push(`c.priority = $${idx}`);
    values.push(filters.priority);
    idx++;
  }

  if (filters.todayOnly) {
    conditions.push(`ft.assigned_at >= CURRENT_DATE`);
  }

  if (filters.overdueOnly) {
    conditions.push(`ft.sla_deadline < NOW() AND ft.status NOT IN ('RESOLUTION_SUBMITTED','CANNOT_RESOLVE','NEEDS_ESCALATION')`);
  }

  if (filters.search) {
    conditions.push(
      `(c.title ILIKE $${idx} OR c.complaint_number ILIKE $${idx} OR c.location_address ILIKE $${idx})`
    );
    values.push(`%${filters.search}%`);
    idx++;
  }

  const where = conditions.join(' AND ');
  const order = filters.sortBy === 'priority'
    ? `CASE c.priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, ft.assigned_at DESC`
    : `ft.assigned_at DESC`;

  const result = await pool.query(
    `SELECT
       ft.id, ft.complaint_id, ft.status, ft.assigned_at, ft.accepted_at,
       ft.arrived_at, ft.started_at, ft.completed_at, ft.resolution_submitted_at,
       ft.sla_deadline, ft.work_notes, ft.work_description, ft.resolution_notes,
       ft.cannot_resolve_reason, ft.escalation_reason,
       c.complaint_number, c.title AS complaint_title, c.priority AS complaint_priority,
       c.status AS complaint_status, c.location_address, c.location_landmark,
       cat.name AS category_name,
       dep.name AS department_name
     FROM field_tasks ft
     INNER JOIN complaints c         ON c.id = ft.complaint_id
     LEFT  JOIN complaint_categories cat ON cat.id = c.category_id
     LEFT  JOIN departments dep      ON dep.id = c.department_id
     WHERE ${where}
     ORDER BY ${order}
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, filters.limit || 50, filters.offset || 0]
  );
  return result.rows;
}

// ─────────────────────────────────────────
// getDashboardCounts  (for Field Staff dashboard)
// ─────────────────────────────────────────
async function getDashboardCounts(fieldStaffId) {
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE ft.assigned_at >= CURRENT_DATE)                          AS today_count,
       COUNT(*) FILTER (WHERE ft.status IN ('ASSIGNED','ACCEPTED','ARRIVED','IN_PROGRESS','WORK_COMPLETED')) AS pending_count,
       COUNT(*) FILTER (WHERE c.priority IN ('HIGH','CRITICAL') AND ft.status NOT IN ('RESOLUTION_SUBMITTED','CANNOT_RESOLVE','NEEDS_ESCALATION')) AS high_priority_count,
       COUNT(*) FILTER (WHERE ft.status = 'IN_PROGRESS')                               AS in_progress_count,
       COUNT(*) FILTER (WHERE ft.status IN ('RESOLUTION_SUBMITTED','CANNOT_RESOLVE'))   AS completed_count,
       COUNT(*) FILTER (WHERE ft.sla_deadline < NOW() AND ft.status NOT IN ('RESOLUTION_SUBMITTED','CANNOT_RESOLVE','NEEDS_ESCALATION')) AS overdue_count,
       COUNT(*) FILTER (WHERE ft.status = 'NEEDS_ESCALATION')                          AS escalated_count
     FROM field_tasks ft
     INNER JOIN complaints c ON c.id = ft.complaint_id
     WHERE ft.field_staff_id = $1 AND ft.is_active = TRUE`,
    [fieldStaffId]
  );
  return result.rows[0];
}

// ─────────────────────────────────────────
// create  (called when Officer assigns)
// ─────────────────────────────────────────
async function create({ complaintId, assignmentId, fieldStaffId, assignedBy, slaDeadline }, client) {
  const db = client || pool;
  const result = await db.query(
    `INSERT INTO field_tasks
       (complaint_id, assignment_id, field_staff_id, assigned_by, status, sla_deadline)
     VALUES ($1, $2, $3, $4, 'ASSIGNED', $5)
     RETURNING *`,
    [complaintId, assignmentId, fieldStaffId, assignedBy, slaDeadline]
  );
  return result.rows[0];
}

// ─────────────────────────────────────────
// updateStatus  (validates transition server-side)
// ─────────────────────────────────────────
async function updateStatus(taskId, fieldStaffId, newStatus, extraFields = {}, client) {
  const db = client || pool;

  // 1. Fetch current task
  const current = await db.query(
    `SELECT id, status, field_staff_id FROM field_tasks WHERE id = $1 AND is_active = TRUE`,
    [taskId]
  );
  if (current.rows.length === 0) {
    throw Object.assign(new Error('Field task not found.'), { statusCode: 404 });
  }

  const task = current.rows[0];

  // 2. Ownership check
  if (task.field_staff_id !== fieldStaffId) {
    throw Object.assign(new Error('You are not authorized to update this task.'), { statusCode: 403 });
  }

  // 3. Transition validation
  if (!isValidTransition(task.status, newStatus)) {
    throw Object.assign(
      new Error(`Invalid status transition: ${task.status} → ${newStatus}`),
      { statusCode: 422 }
    );
  }

  // 4. Build SET clause
  const setClauses = ['status = $2', 'updated_at = NOW()'];
  const values = [taskId, newStatus];
  let paramIdx = 3;

  // Auto-set timestamp for the lifecycle stage
  const tsColumn = TIMESTAMP_MAP[newStatus];
  if (tsColumn) {
    setClauses.push(`${tsColumn} = NOW()`);
  }

  // Extra fields (work_notes, work_description, resolution_notes, cannot_resolve_reason, etc.)
  const allowedExtra = [
    'work_notes', 'work_description', 'resolution_notes',
    'cannot_resolve_reason', 'escalation_reason', 'escalation_notes',
  ];
  for (const key of allowedExtra) {
    if (extraFields[key] !== undefined) {
      setClauses.push(`${key} = $${paramIdx}`);
      values.push(extraFields[key]);
      paramIdx++;
    }
  }

  const result = await db.query(
    `UPDATE field_tasks SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );

  return { task: result.rows[0], fromStatus: task.status };
}

// ─────────────────────────────────────────
// recordStatusHistory
// ─────────────────────────────────────────
async function recordStatusHistory({ fieldTaskId, fromStatus, toStatus, changedBy, reason, notes }, client) {
  const db = client || pool;
  await db.query(
    `INSERT INTO field_task_status_history
       (field_task_id, from_status, to_status, changed_by, reason, notes)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [fieldTaskId, fromStatus, toStatus, changedBy, reason || null, notes || null]
  );
}

// ─────────────────────────────────────────
// getStatusHistory
// ─────────────────────────────────────────
async function getStatusHistory(fieldTaskId) {
  const result = await pool.query(
    `SELECT
       fsh.*,
       u.full_name AS changed_by_name,
       u.role      AS changed_by_role
     FROM field_task_status_history fsh
     INNER JOIN users u ON u.id = fsh.changed_by
     WHERE fsh.field_task_id = $1
     ORDER BY fsh.changed_at ASC`,
    [fieldTaskId]
  );
  return result.rows;
}

// ─────────────────────────────────────────
// findByComplaint  (for officer view)
// ─────────────────────────────────────────
async function findByComplaint(complaintId) {
  const result = await pool.query(
    `SELECT
       ft.*,
       fs.full_name     AS staff_name,
       fs.phone         AS staff_phone,
       fs.employee_code AS staff_employee_code,
       officer.full_name AS officer_name
     FROM field_tasks ft
     INNER JOIN users fs      ON fs.id = ft.field_staff_id
     INNER JOIN users officer ON officer.id = ft.assigned_by
     WHERE ft.complaint_id = $1 AND ft.is_active = TRUE
     ORDER BY ft.created_at DESC`,
    [complaintId]
  );
  return result.rows;
}

module.exports = {
  findById,
  findByFieldStaff,
  getDashboardCounts,
  create,
  updateStatus,
  recordStatusHistory,
  getStatusHistory,
  findByComplaint,
  isValidTransition,
  VALID_TRANSITIONS,
};
