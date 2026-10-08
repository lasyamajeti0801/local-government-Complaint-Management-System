/**
 * Nagar Connect - Field Operations & Resolution Routes (Member 4)
 */
const express = require('express');
const router = express.Router();
const { query: dbQuery, get: dbGet, run: dbRun } = require('../../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.use(authenticateToken);
router.use(requireRole(['FIELD_STAFF', 'OFFICER', 'MUNICIPAL_ADMIN', 'SUPER_ADMIN']));

// GET /api/field/tasks - List tasks for field staff
router.get('/tasks', async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { state } = req.query;

    let sql = `
      SELECT 
        ft.*,
        c.complaint_id, c.title as complaint_title, c.description as complaint_desc,
        c.location_address, c.landmark, c.ward_number, c.latitude, c.longitude,
        c.status as complaint_status, c.priority as complaint_priority,
        c.sla_deadline,
        d.name as department_name, d.code as department_code,
        cat.name as category_name,
        u.name as citizen_name, u.phone as citizen_phone,
        off.name as assigned_by_officer_name
      FROM field_tasks ft
      JOIN complaints c ON ft.complaint_id = c.id
      JOIN departments d ON c.department_id = d.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      JOIN users u ON c.citizen_id = u.id
      JOIN users off ON ft.assigned_by_officer_id = off.id
      WHERE 1=1
    `;
    const params = [];

    if (role === 'FIELD_STAFF') {
      sql += ' AND ft.assigned_field_staff_id = ?';
      params.push(userId);
    }

    if (state) {
      sql += ' AND ft.task_state = ?';
      params.push(state);
    }

    sql += ' ORDER BY ft.updated_at DESC';

    const tasks = await dbQuery(sql, params);

    const stats = {
      total: tasks.length,
      todayTasks: tasks.filter(t => ['ASSIGNED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(t.task_state)).length,
      completed: tasks.filter(t => t.task_state === 'WORK_COMPLETED' || t.task_state === 'RESOLUTION_SUBMITTED').length,
      highPriority: tasks.filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL').length
    };

    res.json({ tasks, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/field/tasks/:id - Single task details
router.get('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await dbGet(`
      SELECT 
        ft.*,
        c.complaint_id, c.title as complaint_title, c.description as complaint_desc,
        c.location_address, c.landmark, c.ward_number, c.latitude, c.longitude,
        c.status as complaint_status, c.priority as complaint_priority,
        c.sla_deadline,
        d.name as department_name,
        cat.name as category_name,
        u.name as citizen_name, u.phone as citizen_phone,
        off.name as assigned_by_officer_name, off.email as officer_email
      FROM field_tasks ft
      JOIN complaints c ON ft.complaint_id = c.id
      JOIN departments d ON c.department_id = d.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      JOIN users u ON c.citizen_id = u.id
      JOIN users off ON ft.assigned_by_officer_id = off.id
      WHERE ft.id = ?
    `, [id]);

    if (!task) return res.status(404).json({ error: 'Field task not found' });

    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/field/tasks/:id/state - Update task progression state
router.patch('/tasks/:id/state', async (req, res) => {
  try {
    const { id } = req.params;
    const { newState, cannotResolveReason, notes } = req.body;

    const validStates = [
      'ASSIGNED',
      'ACCEPTED',
      'ARRIVED',
      'IN_PROGRESS',
      'WORK_COMPLETED',
      'RESOLUTION_SUBMITTED',
      'CANNOT_RESOLVE',
      'NEEDS_ESCALATION'
    ];

    if (!validStates.includes(newState)) {
      return res.status(400).json({ error: `Invalid task state. Must be one of: ${validStates.join(', ')}` });
    }

    const task = await dbGet('SELECT * FROM field_tasks WHERE id = ?', [id]);
    if (!task) return res.status(404).json({ error: 'Field task not found' });

    // Update field task
    await dbRun(`
      UPDATE field_tasks 
      SET task_state = ?, cannot_resolve_reason = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newState, cannotResolveReason || null, notes, id]);

    // Map field state to complaint lifecycle state
    let mappedComplaintStatus = null;
    if (newState === 'ACCEPTED') mappedComplaintStatus = 'FIELD_VERIFICATION';
    else if (newState === 'ARRIVED' || newState === 'IN_PROGRESS') mappedComplaintStatus = 'IN_PROGRESS';
    else if (newState === 'RESOLUTION_SUBMITTED' || newState === 'WORK_COMPLETED') mappedComplaintStatus = 'RESOLUTION_SUBMITTED';

    if (mappedComplaintStatus) {
      await dbRun("UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [mappedComplaintStatus, task.complaint_id]);
      
      await dbRun(`
        INSERT INTO complaint_status_history (id, complaint_id, previous_status, new_status, changed_by_user_id, remarks)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        `HIST_${task.complaint_id}_${Date.now()}`,
        task.complaint_id,
        task.task_state,
        mappedComplaintStatus,
        req.user.id,
        `Field staff updated operational status to [${newState}]. ${notes || ''}`
      ]);
    }

    await logAudit(req.user.id, req.user.role, 'FIELD_STATE_UPDATE', 'FIELD_TASK', id, { previous: task.task_state, current: newState }, req.ip);

    res.json({ message: `Field task state updated to ${newState}`, task_state: newState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/field/tasks/:id/submit-resolution - Submit on-ground resolution with before/after evidence
router.post('/tasks/:id/submit-resolution', async (req, res) => {
  try {
    const { id } = req.params;
    const { before_photo_url, after_photo_url, resolution_description, field_notes } = req.body;

    if (!resolution_description) {
      return res.status(400).json({ error: 'Resolution description is mandatory.' });
    }

    const task = await dbGet('SELECT * FROM field_tasks WHERE id = ?', [id]);
    if (!task) return res.status(404).json({ error: 'Field task not found' });

    // Update field task
    await dbRun(`
      UPDATE field_tasks
      SET task_state = 'RESOLUTION_SUBMITTED',
          before_photo_url = ?,
          after_photo_url = ?,
          resolution_description = ?,
          notes = COALESCE(?, notes),
          resolved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [before_photo_url || null, after_photo_url || null, resolution_description, field_notes, id]);

    // Update complaint status to RESOLUTION_SUBMITTED
    await dbRun("UPDATE complaints SET status = 'RESOLUTION_SUBMITTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [task.complaint_id]);

    // Save evidence records
    if (before_photo_url) {
      await dbRun(`
        INSERT INTO complaint_evidence (id, complaint_id, field_task_id, uploaded_by_user_id, evidence_type, file_path, file_url, caption)
        VALUES (?, ?, ?, ?, 'FIELD_BEFORE', ?, ?, 'Field initial site condition photo')
      `, [`EVID_B_${Date.now()}`, task.complaint_id, id, req.user.id, before_photo_url, before_photo_url]);
    }

    if (after_photo_url) {
      await dbRun(`
        INSERT INTO complaint_evidence (id, complaint_id, field_task_id, uploaded_by_user_id, evidence_type, file_path, file_url, caption)
        VALUES (?, ?, ?, ?, 'FIELD_AFTER', ?, ?, 'Field completed repair photo')
      `, [`EVID_A_${Date.now()}`, task.complaint_id, id, req.user.id, after_photo_url, after_photo_url]);
    }

    // Append to timeline
    await dbRun(`
      INSERT INTO complaint_status_history (id, complaint_id, previous_status, new_status, changed_by_user_id, remarks)
      VALUES (?, ?, 'IN_PROGRESS', 'RESOLUTION_SUBMITTED', ?, ?)
    `, [
      `HIST_${task.complaint_id}_${Date.now()}`,
      task.complaint_id,
      req.user.id,
      `Field resolution submitted: ${resolution_description}. Evidence photos attached.`
    ]);

    // Notify Officer
    await dbRun(`
      INSERT INTO notifications (id, user_id, title, message, type, link_url)
      VALUES (?, ?, ?, ?, 'RESOLUTION_SUBMITTED', ?)
    `, [
      `NOTIF_${Date.now()}`,
      task.assigned_by_officer_id,
      'Field Resolution Submitted for Verification',
      `Field staff has completed work for complaint ID ${task.complaint_id}. Please review evidence and approve resolution.`,
      `/officer/complaints/${task.complaint_id}`
    ]);

    await logAudit(req.user.id, req.user.role, 'FIELD_RESOLUTION_SUBMIT', 'FIELD_TASK', id, { resolution_description }, req.ip);

    res.json({ message: 'Resolution submitted successfully for officer review!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
