// =============================================================
// NAGAR CONNECT — MEMBER 4
// backend/services/fieldTaskService.js
// Business logic for Field Operations.
// Reuses M1/M2/M3 db pool, complaint timeline, notification system.
// =============================================================

const { pool }  = require('../utils/db');
const FieldTask = require('../models/FieldTask');

// Reuse M3's complaint status helper if exported, otherwise inline
// Pattern: add event to complaint_status_history with source='FIELD'
async function _addComplaintTimelineEvent(
  { complaintId, fromStatus, toStatus, changedBy, label, notes, fieldTaskId },
  client
) {
  const db = client || pool;
  await db.query(
    `INSERT INTO complaint_status_history
       (complaint_id, from_status, to_status, changed_by, label, notes, source, field_task_id)
     VALUES ($1, $2, $3, $4, $5, $6, 'FIELD', $7)`,
    [complaintId, fromStatus, toStatus, changedBy, label, notes || null, fieldTaskId || null]
  );
}

// Update the parent complaint's status when field work progresses
const COMPLAINT_STATUS_MAP = {
  ACCEPTED:             'ASSIGNED',
  ARRIVED:              'FIELD_VERIFICATION',
  IN_PROGRESS:          'IN_PROGRESS',
  WORK_COMPLETED:       'IN_PROGRESS',
  RESOLUTION_SUBMITTED: 'RESOLUTION_SUBMITTED',
  CANNOT_RESOLVE:       'UNDER_REVIEW',  // sends back to officer
  NEEDS_ESCALATION:     'ESCALATED',
};

// ─────────────────────────────────────────
// createFieldTask
// Called by Officer when assigning field staff
// ─────────────────────────────────────────
async function createFieldTask({ complaintId, assignmentId, fieldStaffId, assignedBy, slaDeadline }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validate complaint exists and is in correct state
    const compResult = await client.query(
      `SELECT id, status, complaint_number FROM complaints WHERE id = $1`,
      [complaintId]
    );
    if (!compResult.rows[0]) {
      throw Object.assign(new Error('Complaint not found.'), { statusCode: 404 });
    }

    // Validate field staff role
    const staffResult = await client.query(
      `SELECT id, role, full_name FROM users WHERE id = $1 AND is_active = TRUE`,
      [fieldStaffId]
    );
    const staff = staffResult.rows[0];
    if (!staff || staff.role !== 'FIELD_STAFF') {
      throw Object.assign(new Error('Invalid field staff user.'), { statusCode: 400 });
    }

    // Check no active task exists for this complaint
    const existing = await client.query(
      `SELECT id FROM field_tasks WHERE complaint_id = $1 AND is_active = TRUE
       AND status NOT IN ('RESOLUTION_SUBMITTED','CANNOT_RESOLVE','NEEDS_ESCALATION')`,
      [complaintId]
    );
    if (existing.rows.length > 0) {
      throw Object.assign(
        new Error('An active field task already exists for this complaint.'),
        { statusCode: 409 }
      );
    }

    // Create the task
    const task = await FieldTask.create(
      { complaintId, assignmentId, fieldStaffId, assignedBy, slaDeadline },
      client
    );

    // Record status history on the field task
    await FieldTask.recordStatusHistory(
      { fieldTaskId: task.id, fromStatus: null, toStatus: 'ASSIGNED', changedBy: assignedBy },
      client
    );

    // Add event to complaint timeline
    const complaint = compResult.rows[0];
    await _addComplaintTimelineEvent(
      {
        complaintId,
        fromStatus: complaint.status,
        toStatus:   'ASSIGNED',
        changedBy:  assignedBy,
        label:      `Field staff assigned: ${staff.full_name}`,
        notes:      `Task ID: ${task.id}`,
        fieldTaskId: task.id,
      },
      client
    );

    // Update complaint status to ASSIGNED
    await client.query(
      `UPDATE complaints SET status = 'ASSIGNED', updated_at = NOW() WHERE id = $1`,
      [complaintId]
    );

    // Notify field staff (extend M1 notification if available)
    await _sendNotification(
      {
        userId:   fieldStaffId,
        type:     'FIELD_TASK_ASSIGNED',
        title:    'New Field Task Assigned',
        message:  `You have been assigned to complaint ${complaint.complaint_number}.`,
        entityId: task.id,
      },
      client
    );

    await client.query('COMMIT');
    return task;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────
// updateTaskStatus (generic lifecycle handler)
// ─────────────────────────────────────────
async function updateTaskStatus(taskId, fieldStaffId, newStatus, payload = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validation + DB update (server-side transition check inside model)
    const { task: updatedTask, fromStatus } = await FieldTask.updateStatus(
      taskId, fieldStaffId, newStatus,
      {
        work_notes:            payload.workNotes,
        work_description:      payload.workDescription,
        resolution_notes:      payload.resolutionNotes,
        cannot_resolve_reason: payload.cannotResolveReason,
        escalation_reason:     payload.escalationReason,
        escalation_notes:      payload.escalationNotes,
      },
      client
    );

    // Record field task history
    await FieldTask.recordStatusHistory(
      {
        fieldTaskId: taskId,
        fromStatus,
        toStatus:   newStatus,
        changedBy:  fieldStaffId,
        reason:     payload.cannotResolveReason || payload.escalationReason,
        notes:      payload.workNotes || payload.escalationNotes,
      },
      client
    );

    // Map to complaint status
    const newComplaintStatus = COMPLAINT_STATUS_MAP[newStatus];
    if (newComplaintStatus) {
      // Get current complaint status for timeline
      const compResult = await client.query(
        `SELECT status FROM complaints WHERE id = $1`,
        [updatedTask.complaint_id]
      );
      const prevComplaintStatus = compResult.rows[0]?.status;

      await _addComplaintTimelineEvent(
        {
          complaintId:  updatedTask.complaint_id,
          fromStatus:   prevComplaintStatus,
          toStatus:     newComplaintStatus,
          changedBy:    fieldStaffId,
          label:        _eventLabel(newStatus),
          notes:        payload.workNotes || payload.resolutionNotes || payload.cannotResolveReason,
          fieldTaskId:  taskId,
        },
        client
      );

      await client.query(
        `UPDATE complaints SET status = $1, updated_at = NOW() WHERE id = $2`,
        [newComplaintStatus, updatedTask.complaint_id]
      );
    }

    // Handle escalation creation
    if (newStatus === 'NEEDS_ESCALATION') {
      await _createEscalation(
        {
          complaintId:  updatedTask.complaint_id,
          fieldTaskId:  taskId,
          raisedBy:     fieldStaffId,
          reason:       payload.escalationReason,
          notes:        payload.escalationNotes,
        },
        client
      );
    }

    await client.query('COMMIT');
    return updatedTask;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────
// addWorkNotes (without status change)
// ─────────────────────────────────────────
async function addWorkNotes(taskId, fieldStaffId, notes) {
  // Verify ownership
  const task = await FieldTask.findById(taskId);
  if (!task) throw Object.assign(new Error('Task not found.'), { statusCode: 404 });
  if (task.field_staff_id !== fieldStaffId) {
    throw Object.assign(new Error('Unauthorized.'), { statusCode: 403 });
  }
  const allowedStatuses = ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'WORK_COMPLETED'];
  if (!allowedStatuses.includes(task.status)) {
    throw Object.assign(new Error('Cannot add notes in current task status.'), { statusCode: 422 });
  }

  const appended = task.work_notes
    ? `${task.work_notes}\n\n[${new Date().toISOString()}]\n${notes}`
    : `[${new Date().toISOString()}]\n${notes}`;

  await pool.query(
    `UPDATE field_tasks SET work_notes = $1, updated_at = NOW() WHERE id = $2`,
    [appended, taskId]
  );

  // Add to complaint timeline
  await _addComplaintTimelineEvent({
    complaintId: task.complaint_id,
    fromStatus:  task.complaint_status,
    toStatus:    task.complaint_status, // no status change
    changedBy:   fieldStaffId,
    label:       'Field note added',
    notes,
    fieldTaskId: taskId,
  });

  return { success: true };
}

// ─────────────────────────────────────────
// getDashboard  (for field staff home screen)
// ─────────────────────────────────────────
async function getDashboard(fieldStaffId) {
  const [counts, todayTasks, pendingTasks, overdueTasks, inProgressTasks] = await Promise.all([
    FieldTask.getDashboardCounts(fieldStaffId),
    FieldTask.findByFieldStaff(fieldStaffId, { todayOnly: true, limit: 10 }),
    FieldTask.findByFieldStaff(fieldStaffId, {
      status: ['ASSIGNED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'WORK_COMPLETED'],
      limit: 20,
    }),
    FieldTask.findByFieldStaff(fieldStaffId, { overdueOnly: true, limit: 10 }),
    FieldTask.findByFieldStaff(fieldStaffId, { status: 'IN_PROGRESS', limit: 10 }),
  ]);

  return { counts, todayTasks, pendingTasks, overdueTasks, inProgressTasks };
}

// ─────────────────────────────────────────
// getTaskDetail  (full details for field staff)
// Verifies ownership before returning
// ─────────────────────────────────────────
async function getTaskDetail(taskId, requestingUserId, requestingRole) {
  const task = await FieldTask.findById(taskId);
  if (!task) throw Object.assign(new Error('Task not found.'), { statusCode: 404 });

  // Field staff can only see their own tasks
  if (requestingRole === 'FIELD_STAFF' && task.field_staff_id !== requestingUserId) {
    throw Object.assign(new Error('Access denied.'), { statusCode: 403 });
  }

  // Officers can see tasks in complaints they manage
  // (we allow OFFICER / MUNICIPAL_ADMIN / COMMISSIONER / SUPER_ADMIN)

  const history = await FieldTask.getStatusHistory(taskId);

  // Fetch evidence for this task
  const evidenceResult = await pool.query(
    `SELECT id, evidence_type, evidence_category, file_url, file_name,
            uploaded_by, created_at, description
     FROM complaint_evidence
     WHERE complaint_id = $1 AND (field_task_id = $2 OR field_task_id IS NULL)
     ORDER BY created_at ASC`,
    [task.complaint_id, taskId]
  );

  return { ...task, statusHistory: history, evidence: evidenceResult.rows };
}

// ─────────────────────────────────────────
// addEvidence  (before/after photo, doc, notes)
// ─────────────────────────────────────────
async function addEvidence({ taskId, complaintId, fieldStaffId, fileUrl, fileName, fileSize, mimeType, evidenceCategory, description }) {
  // Validate ownership
  const task = await pool.query(
    `SELECT id, field_staff_id, complaint_id FROM field_tasks WHERE id = $1 AND is_active = TRUE`,
    [taskId]
  );
  if (!task.rows[0]) throw Object.assign(new Error('Task not found.'), { statusCode: 404 });
  if (task.rows[0].field_staff_id !== fieldStaffId) {
    throw Object.assign(new Error('Unauthorized.'), { statusCode: 403 });
  }

  // Reuse complaint_evidence table (M2's schema)
  const result = await pool.query(
    `INSERT INTO complaint_evidence
       (complaint_id, field_task_id, uploaded_by, evidence_type,
        evidence_category, file_url, file_name, file_size, mime_type, description)
     VALUES ($1, $2, $3, 'FIELD_EVIDENCE', $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      task.rows[0].complaint_id, taskId, fieldStaffId,
      evidenceCategory, fileUrl, fileName, fileSize, mimeType, description,
    ]
  );

  // Add timeline event
  const comp = await pool.query(`SELECT status FROM complaints WHERE id = $1`, [task.rows[0].complaint_id]);
  await _addComplaintTimelineEvent({
    complaintId:  task.rows[0].complaint_id,
    fromStatus:   comp.rows[0]?.status,
    toStatus:     comp.rows[0]?.status,
    changedBy:    fieldStaffId,
    label:        `Evidence uploaded: ${evidenceCategory}`,
    notes:        fileName,
    fieldTaskId:  taskId,
  });

  return result.rows[0];
}

// ─────────────────────────────────────────
// verifyResolution  (Officer action)
// ─────────────────────────────────────────
async function verifyResolution(taskId, officerId, { approved, remarks }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const taskResult = await client.query(
      `SELECT ft.*, c.status AS complaint_status
       FROM field_tasks ft
       INNER JOIN complaints c ON c.id = ft.complaint_id
       WHERE ft.id = $1 AND ft.is_active = TRUE`,
      [taskId]
    );
    const task = taskResult.rows[0];
    if (!task) throw Object.assign(new Error('Task not found.'), { statusCode: 404 });
    if (task.status !== 'RESOLUTION_SUBMITTED') {
      throw Object.assign(
        new Error('Task must be in RESOLUTION_SUBMITTED state for officer verification.'),
        { statusCode: 422 }
      );
    }

    if (approved) {
      // Move complaint to CITIZEN_VERIFICATION (citizen confirms resolution)
      await client.query(
        `UPDATE complaints SET status = 'CITIZEN_VERIFICATION', updated_at = NOW() WHERE id = $1`,
        [task.complaint_id]
      );
      await _addComplaintTimelineEvent(
        {
          complaintId: task.complaint_id,
          fromStatus:  'RESOLUTION_SUBMITTED',
          toStatus:    'CITIZEN_VERIFICATION',
          changedBy:   officerId,
          label:       'Officer verified field resolution. Awaiting citizen confirmation.',
          notes:       remarks,
          fieldTaskId: taskId,
        },
        client
      );
    } else {
      // Rejected — send back to IN_PROGRESS
      await client.query(
        `UPDATE field_tasks SET status = 'IN_PROGRESS', updated_at = NOW() WHERE id = $1`,
        [taskId]
      );
      await client.query(
        `UPDATE complaints SET status = 'IN_PROGRESS', updated_at = NOW() WHERE id = $1`,
        [task.complaint_id]
      );
      await _addComplaintTimelineEvent(
        {
          complaintId: task.complaint_id,
          fromStatus:  'RESOLUTION_SUBMITTED',
          toStatus:    'IN_PROGRESS',
          changedBy:   officerId,
          label:       'Officer rejected resolution submission. Work required.',
          notes:       remarks,
          fieldTaskId: taskId,
        },
        client
      );
    }

    await client.query('COMMIT');
    return { success: true, approved };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────
// _createEscalation  (internal helper)
// ─────────────────────────────────────────
async function _createEscalation({ complaintId, fieldTaskId, raisedBy, reason, notes }, client) {
  const db = client || pool;
  // Use existing escalations table (M3), extend with field_task_id column
  await db.query(
    `INSERT INTO escalations (complaint_id, field_task_id, raised_by, reason, notes, origin, status)
     VALUES ($1, $2, $3, $4, $5, 'FIELD', 'PENDING')
     ON CONFLICT DO NOTHING`,
    [complaintId, fieldTaskId, raisedBy, reason, notes]
  );
}

// ─────────────────────────────────────────
// _sendNotification  (reuses M1 notifications table)
// ─────────────────────────────────────────
async function _sendNotification({ userId, type, title, message, entityId }, client) {
  const db = client || pool;
  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, entity_id, is_read)
       VALUES ($1, $2, $3, $4, $5, FALSE)`,
      [userId, type, title, message, entityId]
    );
  } catch (_) {
    // Notifications are non-critical; don't fail the main transaction
  }
}

function _eventLabel(status) {
  const labels = {
    ACCEPTED:             'Field staff accepted the task',
    ARRIVED:              'Field staff arrived at location',
    IN_PROGRESS:          'Field work started',
    WORK_COMPLETED:       'Field work completed',
    RESOLUTION_SUBMITTED: 'Resolution submitted for officer review',
    CANNOT_RESOLVE:       'Field staff could not resolve — returned to officer',
    NEEDS_ESCALATION:     'Escalation requested by field staff',
  };
  return labels[status] || status;
}

module.exports = {
  createFieldTask,
  updateTaskStatus,
  addWorkNotes,
  getDashboard,
  getTaskDetail,
  addEvidence,
  verifyResolution,
};
