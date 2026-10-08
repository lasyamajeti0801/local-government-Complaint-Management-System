const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query, queryOne, run } = require('../../database/db');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');

router.use(authenticateToken);
router.use(requireRoles('FIELD_STAFF', 'OFFICER', 'MUNICIPAL_ADMIN', 'SUPER_ADMIN'));

// GET /api/field/tasks - List tasks for field staff
router.get('/tasks', async (req, res) => {
  try {
    const user = req.user;
    let sql = `
      SELECT 
        ft.*,
        c.tracking_id, c.title as complaint_title, c.description as complaint_desc,
        c.location_address, c.landmark, c.ward_number, c.priority, c.sla_deadline,
        cat.name as category_name,
        d.name as department_name,
        u_cit.full_name as citizen_name, u_cit.phone as citizen_phone,
        ca.instructions as assignment_instructions, ca.target_completion_date
      FROM field_tasks ft
      JOIN complaints c ON ft.complaint_id = c.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      JOIN departments d ON c.department_id = d.id
      JOIN users u_cit ON c.citizen_id = u_cit.id
      JOIN complaint_assignments ca ON ft.assignment_id = ca.id
      WHERE 1=1
    `;
    const params = [];

    if (user.role_name === 'FIELD_STAFF') {
      sql += ` AND ft.field_staff_id = ?`;
      params.push(user.id);
    }

    sql += ` ORDER BY c.priority = 'CRITICAL' DESC, c.priority = 'HIGH' DESC, ft.created_at DESC`;

    const tasks = await query(sql, params);

    // Compute SLA metrics
    const now = Date.now();
    const enriched = tasks.map(t => {
      const deadline = new Date(t.sla_deadline).getTime();
      const remainingHours = Math.round((deadline - now) / (1000 * 3600));
      return {
        ...t,
        remaining_hours: remainingHours,
        is_overdue: t.state !== 'WORK_COMPLETED' && t.state !== 'RESOLUTION_SUBMITTED' && deadline < now
      };
    });

    res.json({
      success: true,
      tasks: enriched,
      metrics: {
        total: enriched.length,
        todayTasks: enriched.filter(t => ['ASSIGNED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(t.state)).length,
        pending: enriched.filter(t => t.state === 'ASSIGNED').length,
        inProgress: enriched.filter(t => ['ARRIVED', 'IN_PROGRESS'].includes(t.state)).length,
        completed: enriched.filter(t => ['WORK_COMPLETED', 'RESOLUTION_SUBMITTED'].includes(t.state)).length,
        overdue: enriched.filter(t => t.is_overdue).length
      }
    });
  } catch (err) {
    console.error('Fetch field tasks error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve field tasks.' });
  }
});

// PATCH /api/field/tasks/:id/state - Update task state
router.patch('/tasks/:id/state', async (req, res) => {
  try {
    const { id } = req.params;
    const { state, notes, cannot_resolve_reason } = req.body;

    const task = await queryOne(`SELECT * FROM field_tasks WHERE id = ?`, [id]);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Field task not found.' });
    }

    const complaint = await queryOne(`SELECT * FROM complaints WHERE id = ?`, [task.complaint_id]);

    let updateTaskSql = `UPDATE field_tasks SET state = ?, updated_at = CURRENT_TIMESTAMP`;
    const params = [state];

    if (state === 'ARRIVED') {
      updateTaskSql += `, arrived_at = CURRENT_TIMESTAMP`;
    } else if (state === 'IN_PROGRESS') {
      updateTaskSql += `, started_at = CURRENT_TIMESTAMP`;
    } else if (state === 'WORK_COMPLETED' || state === 'RESOLUTION_SUBMITTED') {
      updateTaskSql += `, completed_at = CURRENT_TIMESTAMP, resolution_notes = ?`;
      params.push(notes || 'Field work executed successfully.');
    } else if (state === 'CANNOT_RESOLVE') {
      updateTaskSql += `, cannot_resolve_reason = ?`;
      params.push(cannot_resolve_reason || 'Obstacle on site prevented resolution.');
    }

    updateTaskSql += ` WHERE id = ?`;
    params.push(task.id);
    await run(updateTaskSql, params);

    // Sync master complaint status
    let complaintStatus = complaint.status;
    if (state === 'ARRIVED') complaintStatus = 'FIELD_VERIFICATION';
    if (state === 'IN_PROGRESS') complaintStatus = 'IN_PROGRESS';
    if (state === 'RESOLUTION_SUBMITTED' || state === 'WORK_COMPLETED') complaintStatus = 'RESOLUTION_SUBMITTED';
    if (state === 'NEEDS_ESCALATION') {
      await run(`UPDATE complaints SET is_escalated = 1 WHERE id = ?`, [complaint.id]);
    }

    if (complaintStatus !== complaint.status) {
      await run(`UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [complaintStatus, complaint.id]);
    }

    // Record auditable status history
    await run(`
      INSERT INTO complaint_status_history (id, complaint_id, from_status, to_status, changed_by_user_id, remarks)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      `hist_${Date.now()}`,
      complaint.id,
      complaint.status,
      complaintStatus,
      req.user.id,
      `Field Staff ${req.user.full_name} transitioned task to '${state}'. ${notes || ''}`
    ]);

    res.json({
      success: true,
      message: `Task state updated to ${state}.`,
      state,
      complaint_status: complaintStatus
    });
  } catch (err) {
    console.error('Update task state error:', err);
    res.status(500).json({ success: false, message: 'Failed to update task state.' });
  }
});

// POST /api/field/tasks/:id/evidence - Upload evidence photos
router.post('/tasks/:id/evidence', async (req, res) => {
  try {
    const { id } = req.params;
    const { evidence_type, file_name, file_url, caption } = req.body;

    const task = await queryOne(`SELECT * FROM field_tasks WHERE id = ?`, [id]);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Field task not found.' });
    }

    const evidenceId = `evd_${crypto.randomUUID()}`;
    await run(`
      INSERT INTO complaint_evidence (
        id, complaint_id, field_task_id, uploaded_by_user_id,
        evidence_type, file_name, file_url, caption
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      evidenceId,
      task.complaint_id,
      task.id,
      req.user.id,
      evidence_type || 'AFTER_WORK',
      file_name || 'field_evidence.jpg',
      file_url || '/uploads/sample_field_photo.jpg',
      caption || 'Field evidence submitted by crew'
    ]);

    res.json({
      success: true,
      message: 'Evidence attached successfully.',
      evidence_id: evidenceId
    });
  } catch (err) {
    console.error('Evidence upload error:', err);
    res.status(500).json({ success: false, message: 'Failed to attach evidence.' });
  }
});

module.exports = router;
