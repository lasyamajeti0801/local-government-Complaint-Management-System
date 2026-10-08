/**
 * Nagar Connect - Department Officer Management Routes (Member 3)
 */
const express = require('express');
const router = express.Router();
const { query: dbQuery, get: dbGet, run: dbRun } = require('../../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Middleware: restrict to OFFICER, MUNICIPAL_ADMIN, COMMISSIONER, SUPER_ADMIN
router.use(authenticateToken);
router.use(requireRole(['OFFICER', 'MUNICIPAL_ADMIN', 'COMMISSIONER', 'SUPER_ADMIN']));

// GET /api/officer/queue - Department officer complaint queue with SLA calculations
router.get('/queue', async (req, res) => {
  try {
    const { department_id, role } = req.user;
    const { status, priority, overdueOnly } = req.query;

    let sql = `
      SELECT 
        c.*,
        d.name as department_name, d.code as department_code,
        cat.name as category_name, cat.standard_sla_hours,
        u.name as citizen_name, u.phone as citizen_phone,
        fs.name as assigned_staff_name, fs.id as assigned_staff_id,
        ft.task_state, ft.id as field_task_id
      FROM complaints c
      JOIN departments d ON c.department_id = d.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      JOIN users u ON c.citizen_id = u.id
      LEFT JOIN field_tasks ft ON c.id = ft.complaint_id
      LEFT JOIN users fs ON ft.assigned_field_staff_id = fs.id
      WHERE 1=1
    `;
    const params = [];

    if (role === 'OFFICER' && department_id) {
      sql += ' AND c.department_id = ?';
      params.push(department_id);
    }

    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    if (priority) {
      sql += ' AND c.priority = ?';
      params.push(priority);
    }

    sql += ' ORDER BY c.created_at DESC';

    const rawComplaints = await dbQuery(sql, params);
    const now = new Date();

    const complaints = rawComplaints.map(c => {
      let isOverdue = false;
      let remainingHours = 0;
      let slaDeadlineDate = c.sla_deadline ? new Date(c.sla_deadline) : null;

      if (slaDeadlineDate) {
        const diffMs = slaDeadlineDate - now;
        remainingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(1));
        if (remainingHours <= 0 && !['RESOLVED', 'CLOSED', 'REJECTED'].includes(c.status)) {
          isOverdue = true;
        }
      }

      return {
        ...c,
        isOverdue,
        remainingHours,
        slaStatus: isOverdue ? 'BREACHED' : remainingHours < 6 ? 'CRITICAL_WARNING' : 'ON_TRACK'
      };
    });

    const finalComplaints = overdueOnly === 'true' ? complaints.filter(c => c.isOverdue) : complaints;

    // Queue summary metrics
    const stats = {
      total: complaints.length,
      newUnassigned: complaints.filter(c => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length,
      assigned: complaints.filter(c => c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS').length,
      pendingVerification: complaints.filter(c => c.status === 'RESOLUTION_SUBMITTED').length,
      overdueCount: complaints.filter(c => c.isOverdue).length,
      escalatedCount: complaints.filter(c => c.is_escalated === 1).length
    };

    res.json({
      complaints: finalComplaints,
      stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/officer/field-staff - List available field staff
router.get('/field-staff', async (req, res) => {
  try {
    const { department_id } = req.user;
    let sql = "SELECT id, name, email, phone, ward_number, department_id FROM users WHERE role = 'FIELD_STAFF' AND is_active = 1";
    const params = [];
    if (department_id) {
      sql += ' AND (department_id = ? OR department_id IS NULL)';
      params.push(department_id);
    }
    const staff = await dbQuery(sql, params);
    res.json({ fieldStaff: staff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/officer/assign - Assign complaint to field staff (Member 3 -> Member 4 Handshake)
router.post('/assign', async (req, res) => {
  try {
    const { complaint_id, field_staff_id, notes, priority } = req.body;

    if (!complaint_id || !field_staff_id) {
      return res.status(400).json({ error: 'Complaint ID and Field Staff ID are required' });
    }

    const complaint = await dbGet('SELECT * FROM complaints WHERE id = ?', [complaint_id]);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    const fieldStaff = await dbGet("SELECT * FROM users WHERE id = ? AND role = 'FIELD_STAFF'", [field_staff_id]);
    if (!fieldStaff) return res.status(404).json({ error: 'Field staff user not found' });

    // 1. Create or update assignment
    const assignId = `ASGN_${Date.now()}`;
    await dbRun(`
      INSERT INTO complaint_assignments (id, complaint_id, assigned_by_user_id, assigned_to_user_id, role, notes, status)
      VALUES (?, ?, ?, ?, 'FIELD_STAFF', ?, 'ACTIVE')
    `, [assignId, complaint_id, req.user.id, field_staff_id, notes || 'Direct dispatch for on-ground resolution']);

    // 2. Create or update field task for Member 4
    const taskId = `TASK_${Date.now()}`;
    await dbRun(`
      INSERT OR REPLACE INTO field_tasks (
        id, complaint_id, assigned_field_staff_id, assigned_by_officer_id,
        task_state, priority, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'ASSIGNED', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [taskId, complaint_id, field_staff_id, req.user.id, priority || complaint.priority, notes || '']);

    // 3. Update complaint status
    const newStatus = 'ASSIGNED';
    await dbRun("UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [newStatus, complaint_id]);

    // 4. Record status history
    await dbRun(`
      INSERT INTO complaint_status_history (id, complaint_id, previous_status, new_status, changed_by_user_id, remarks)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      `HIST_${complaint_id}_${Date.now()}`,
      complaint_id,
      complaint.status,
      newStatus,
      req.user.id,
      `Assigned to Field Lead ${fieldStaff.name}. Notes: ${notes || 'Proceed to spot for inspection'}`
    ]);

    // 5. Notify Field Staff
    await dbRun(`
      INSERT INTO notifications (id, user_id, title, message, type, link_url)
      VALUES (?, ?, ?, ?, 'FIELD_TASK_ASSIGNED', ?)
    `, [
      `NOTIF_${Date.now()}`,
      field_staff_id,
      'New Municipal Field Task Assigned',
      `You have been assigned complaint ${complaint.complaint_id} (${complaint.title}).`,
      `/field/tasks/${taskId}`
    ]);

    await logAudit(req.user.id, req.user.role, 'COMPLAINT_ASSIGN', 'COMPLAINT', complaint_id, {
      fieldStaffId: field_staff_id,
      fieldStaffName: fieldStaff.name
    }, req.ip);

    res.json({
      message: 'Complaint successfully assigned to field staff',
      taskId,
      status: newStatus,
      assignedStaff: fieldStaff.name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/officer/approve-resolution - Officer approves completed field work
router.post('/approve-resolution', async (req, res) => {
  try {
    const { complaint_id, remarks } = req.body;

    const complaint = await dbGet('SELECT * FROM complaints WHERE id = ?', [complaint_id]);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    const newStatus = 'RESOLVED';
    await dbRun("UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [newStatus, complaint_id]);

    await dbRun(`
      INSERT INTO complaint_status_history (id, complaint_id, previous_status, new_status, changed_by_user_id, remarks)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      `HIST_${complaint_id}_${Date.now()}`,
      complaint_id,
      complaint.status,
      newStatus,
      req.user.id,
      `Officer verified field evidence and approved resolution. ${remarks || 'Resolution approved.'}`
    ]);

    // Notify Citizen to provide feedback
    await dbRun(`
      INSERT INTO notifications (id, user_id, title, message, type, link_url)
      VALUES (?, ?, ?, ?, 'RESOLUTION_VERIFIED', ?)
    `, [
      `NOTIF_${Date.now()}`,
      complaint.citizen_id,
      'Grievance Resolved - Feedback Requested',
      `Your complaint ${complaint.complaint_id} has been marked as resolved by the department officer. Please verify and rate the service.`,
      `/citizen/complaints/${complaint_id}`
    ]);

    await logAudit(req.user.id, req.user.role, 'OFFICER_APPROVE_RESOLUTION', 'COMPLAINT', complaint_id, { remarks }, req.ip);

    res.json({ message: 'Resolution approved. Complaint status set to RESOLVED.', status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/officer/escalate - Escalate complaint
router.post('/escalate', async (req, res) => {
  try {
    const { complaint_id, reason, escalate_to_role = 'COMMISSIONER' } = req.body;

    await dbRun("UPDATE complaints SET is_escalated = 1, escalation_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [reason, complaint_id]);

    await dbRun(`
      INSERT INTO escalations (id, complaint_id, escalated_by_user_id, escalated_to_role, reason, status)
      VALUES (?, ?, ?, ?, ?, 'OPEN')
    `, [`ESC_${Date.now()}`, complaint_id, req.user.id, escalate_to_role, reason]);

    await dbRun(`
      INSERT INTO complaint_status_history (id, complaint_id, previous_status, new_status, changed_by_user_id, remarks)
      VALUES (?, ?, 'IN_PROGRESS', 'IN_PROGRESS', ?, ?)
    `, [`HIST_${complaint_id}_${Date.now()}`, complaint_id, req.user.id, `⚠️ ESCALATED TO ${escalate_to_role}: ${reason}`]);

    await logAudit(req.user.id, req.user.role, 'COMPLAINT_ESCALATE', 'COMPLAINT', complaint_id, { reason, escalateTo: escalate_to_role }, req.ip);

    res.json({ message: 'Complaint escalated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
