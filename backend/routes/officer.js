const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query, queryOne, run } = require('../../database/db');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');

// All officer routes require OFFICER, MUNICIPAL_ADMIN, or COMMISSIONER role
router.use(authenticateToken);
router.use(requireRoles('OFFICER', 'MUNICIPAL_ADMIN', 'COMMISSIONER', 'SUPER_ADMIN'));

// GET /api/officer/queue - Officer Complaint Queue with SLA, priority, and assignment status
router.get('/queue', async (req, res) => {
  try {
    const { status, priority, department_id, overdue_only } = req.query;
    const user = req.user;

    let sql = `
      SELECT 
        c.id, c.tracking_id, c.title, c.description, c.location_address,
        c.landmark, c.ward_number, c.priority, c.status, c.sla_deadline,
        c.is_escalated, c.created_at,
        cat.name as category_name,
        d.name as department_name, d.id as department_id,
        u_cit.full_name as citizen_name, u_cit.phone as citizen_phone,
        u_staff.full_name as assigned_staff_name,
        ft.state as field_task_state
      FROM complaints c
      JOIN complaint_categories cat ON c.category_id = cat.id
      JOIN departments d ON c.department_id = d.id
      JOIN users u_cit ON c.citizen_id = u_cit.id
      LEFT JOIN complaint_assignments ca ON ca.complaint_id = c.id AND ca.status = 'ACTIVE'
      LEFT JOIN users u_staff ON ca.assigned_to_user_id = u_staff.id
      LEFT JOIN field_tasks ft ON ft.assignment_id = ca.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by officer's department unless Admin / Commissioner
    if (user.role_name === 'OFFICER' && user.department_id) {
      sql += ` AND c.department_id = ?`;
      params.push(user.department_id);
    } else if (department_id && department_id !== 'ALL') {
      sql += ` AND c.department_id = ?`;
      params.push(department_id);
    }

    if (status && status !== 'ALL') {
      sql += ` AND c.status = ?`;
      params.push(status);
    }

    if (priority && priority !== 'ALL') {
      sql += ` AND c.priority = ?`;
      params.push(priority);
    }

    sql += ` ORDER BY c.priority = 'CRITICAL' DESC, c.priority = 'HIGH' DESC, c.created_at ASC`;

    const complaints = await query(sql, params);
    const now = Date.now();

    const queue = complaints.map(c => {
      const deadline = new Date(c.sla_deadline).getTime();
      const remainingMs = deadline - now;
      const remainingHours = Math.round(remainingMs / (1000 * 3600));
      const isOverdue = c.status !== 'RESOLVED' && c.status !== 'CLOSED' && remainingMs < 0;

      return {
        ...c,
        remaining_hours: remainingHours,
        is_overdue: isOverdue
      };
    });

    const filteredQueue = overdue_only === 'true' 
      ? queue.filter(item => item.is_overdue) 
      : queue;

    res.json({
      success: true,
      queue: filteredQueue,
      metrics: {
        total: queue.length,
        newComplaints: queue.filter(q => q.status === 'SUBMITTED').length,
        inProgress: queue.filter(q => ['ASSIGNED', 'IN_PROGRESS', 'FIELD_VERIFICATION'].includes(q.status)).length,
        resolutionSubmitted: queue.filter(q => q.status === 'RESOLUTION_SUBMITTED').length,
        overdueCount: queue.filter(q => q.is_overdue).length,
        criticalCount: queue.filter(q => q.priority === 'CRITICAL').length
      }
    });
  } catch (err) {
    console.error('Officer queue error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve officer queue.' });
  }
});

// POST /api/officer/complaints/:id/action - Review, Accept, Reject, Priority Change, Notes, Escalate
router.post('/complaints/:id/action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks, new_priority, escalation_reason } = req.body;

    const complaint = await queryOne(`SELECT * FROM complaints WHERE id = ?`, [id]);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    let targetStatus = complaint.status;

    switch (action) {
      case 'ACCEPT':
        targetStatus = 'UNDER_REVIEW';
        break;
      case 'REJECT':
        targetStatus = 'REJECTED';
        break;
      case 'CHANGE_PRIORITY':
        if (new_priority) {
          await run(`UPDATE complaints SET priority = ? WHERE id = ?`, [new_priority, complaint.id]);
        }
        break;
      case 'ESCALATE':
        await run(`UPDATE complaints SET is_escalated = 1, escalation_level = escalation_level + 1 WHERE id = ?`, [complaint.id]);
        await run(`
          INSERT INTO escalations (id, complaint_id, escalation_level, escalated_to_user_id, reason)
          VALUES (?, ?, 1, NULL, ?)
        `, [`esc_${Date.now()}`, complaint.id, escalation_reason || 'Officer manually escalated to executive tier']);
        break;
      case 'ADD_INTERNAL_NOTE':
        await run(`
          INSERT INTO complaint_comments (id, complaint_id, author_id, comment_type, content)
          VALUES (?, ?, ?, 'INTERNAL_OFFICER_NOTE', ?)
        `, [`cm_${Date.now()}`, complaint.id, req.user.id, remarks]);
        return res.json({ success: true, message: 'Internal note recorded.' });
      default:
        break;
    }

    if (targetStatus !== complaint.status) {
      await run(`UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [targetStatus, complaint.id]);
      await run(`
        INSERT INTO complaint_status_history (id, complaint_id, from_status, to_status, changed_by_user_id, remarks)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [`hist_${Date.now()}`, complaint.id, complaint.status, targetStatus, req.user.id, remarks || `Officer performed action: ${action}`]);
    }

    res.json({
      success: true,
      message: `Action '${action}' applied successfully.`,
      status: targetStatus
    });
  } catch (err) {
    console.error('Officer action error:', err);
    res.status(500).json({ success: false, message: 'Failed to process officer action.' });
  }
});

// POST /api/officer/complaints/:id/assign - Assign to Field Staff (creates Field Task)
router.post('/complaints/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { field_staff_id, instructions, target_completion_date } = req.body;

    if (!field_staff_id) {
      return res.status(400).json({ success: false, message: 'Please select a field technician.' });
    }

    const complaint = await queryOne(`SELECT * FROM complaints WHERE id = ?`, [id]);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const staff = await queryOne(`SELECT * FROM users WHERE id = ?`, [field_staff_id]);
    if (!staff) {
      return res.status(400).json({ success: false, message: 'Field technician not found.' });
    }

    const assignmentId = `asgn_${crypto.randomUUID()}`;
    const fieldTaskId = `task_${crypto.randomUUID()}`;

    // Deactivate previous active assignments
    await run(`UPDATE complaint_assignments SET status = 'REASSIGNED' WHERE complaint_id = ? AND status = 'ACTIVE'`, [complaint.id]);

    // Create new Assignment
    await run(`
      INSERT INTO complaint_assignments (
        id, complaint_id, assigned_by_user_id, assigned_to_user_id,
        assigned_role, instructions, target_completion_date, status
      ) VALUES (?, ?, ?, ?, 'FIELD_STAFF', ?, ?, 'ACTIVE')
    `, [
      assignmentId,
      complaint.id,
      req.user.id,
      field_staff_id,
      instructions || 'Inspect site and execute resolution as per standard operating procedure.',
      target_completion_date || complaint.sla_deadline
    ]);

    // Create corresponding Field Task for Member 4 module
    await run(`
      INSERT INTO field_tasks (
        id, complaint_id, assignment_id, field_staff_id,
        task_title, task_description, state
      ) VALUES (?, ?, ?, ?, ?, ?, 'ASSIGNED')
    `, [
      fieldTaskId,
      complaint.id,
      assignmentId,
      field_staff_id,
      complaint.title,
      instructions || complaint.description
    ]);

    // Update Complaint Status to ASSIGNED
    await run(`UPDATE complaints SET status = 'ASSIGNED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [complaint.id]);

    // Timeline Record
    await run(`
      INSERT INTO complaint_status_history (id, complaint_id, from_status, to_status, changed_by_user_id, remarks)
      VALUES (?, ?, ?, 'ASSIGNED', ?, ?)
    `, [
      `hist_${Date.now()}`,
      complaint.id,
      complaint.status,
      req.user.id,
      `Assigned to Field Engineer ${staff.full_name}. Instructions: ${instructions || 'Standard resolution'}`
    ]);

    // Notification to Field Staff
    await run(`
      INSERT INTO notifications (id, user_id, title, message, type, related_entity_type, related_entity_id)
      VALUES (?, ?, 'New Field Task Assigned', ?, 'ASSIGNMENT', 'TASK', ?)
    `, [
      `notif_${Date.now()}`,
      field_staff_id,
      `You have been assigned to complaint ${complaint.tracking_id}: ${complaint.title}`,
      fieldTaskId
    ]);

    res.json({
      success: true,
      message: `Assigned successfully to ${staff.full_name}.`,
      assignment_id: assignmentId,
      field_task_id: fieldTaskId
    });
  } catch (err) {
    console.error('Assignment error:', err);
    res.status(500).json({ success: false, message: 'Failed to assign field staff.' });
  }
});

// POST /api/officer/complaints/:id/approve - Approve resolution and close
router.post('/complaints/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_summary, officer_remarks } = req.body;

    const complaint = await queryOne(`SELECT * FROM complaints WHERE id = ?`, [id]);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const resolvedTime = new Date().toISOString();

    await run(`
      UPDATE complaints 
      SET status = 'RESOLVED',
          resolved_at = ?,
          resolution_summary = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [resolvedTime, resolution_summary || 'Work verified and approved by Department Nodal Officer.', complaint.id]);

    await run(`
      INSERT INTO complaint_status_history (id, complaint_id, from_status, to_status, changed_by_user_id, remarks)
      VALUES (?, ?, ?, 'RESOLVED', ?, ?)
    `, [
      `hist_${Date.now()}`,
      complaint.id,
      complaint.status,
      req.user.id,
      officer_remarks || `Resolution verified & officially signed off by ${req.user.full_name}.`
    ]);

    // Notify citizen for feedback
    await run(`
      INSERT INTO notifications (id, user_id, title, message, type, related_entity_type, related_entity_id)
      VALUES (?, ?, 'Complaint Resolved - Feedback Requested', ?, 'SUCCESS', 'COMPLAINT', ?)
    `, [
      `notif_${Date.now()}`,
      complaint.citizen_id,
      `Your complaint ${complaint.tracking_id} has been marked as RESOLVED. Please inspect and rate your satisfaction.`,
      complaint.id
    ]);

    res.json({
      success: true,
      message: 'Resolution approved. Complaint status marked as RESOLVED.'
    });
  } catch (err) {
    console.error('Approve resolution error:', err);
    res.status(500).json({ success: false, message: 'Failed to approve resolution.' });
  }
});

module.exports = router;
