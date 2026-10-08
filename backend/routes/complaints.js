const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query, queryOne, run } = require('../../database/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Helper to generate sequential tracking ID format NGC-2026-XXXXXX
async function generateTrackingId() {
  const currentYear = new Date().getFullYear();
  const countRow = await queryOne(`SELECT COUNT(*) as total FROM complaints`);
  const nextSeq = (countRow ? countRow.total : 0) + 1;
  const padded = String(nextSeq).padStart(6, '0');
  return `NGC-${currentYear}-${padded}`;
}

// GET /api/complaints - List complaints with filters
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, priority, department_id, citizen_id, search } = req.query;
    let sql = `
      SELECT 
        c.id, c.tracking_id, c.title, c.description, c.location_address,
        c.landmark, c.ward_number, c.priority, c.status, c.sla_deadline,
        c.is_escalated, c.resolution_summary, c.resolved_at, c.created_at,
        cat.name as category_name, cat.code as category_code,
        d.name as department_name, d.code as department_code,
        u.full_name as citizen_name, u.phone as citizen_phone
      FROM complaints c
      JOIN complaint_categories cat ON c.category_id = cat.id
      JOIN departments d ON c.department_id = d.id
      JOIN users u ON c.citizen_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // If user is a citizen and not querying someone else, filter by their complaints
    if (req.user && req.user.role_name === 'CITIZEN' && !citizen_id) {
      sql += ` AND c.citizen_id = ?`;
      params.push(req.user.id);
    } else if (citizen_id) {
      sql += ` AND c.citizen_id = ?`;
      params.push(citizen_id);
    }

    if (status && status !== 'ALL') {
      sql += ` AND c.status = ?`;
      params.push(status);
    }

    if (priority && priority !== 'ALL') {
      sql += ` AND c.priority = ?`;
      params.push(priority);
    }

    if (department_id && department_id !== 'ALL') {
      sql += ` AND c.department_id = ?`;
      params.push(department_id);
    }

    if (search) {
      sql += ` AND (c.tracking_id LIKE ? OR c.title LIKE ? OR c.location_address LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY c.created_at DESC`;

    const complaints = await query(sql, params);

    // Compute SLA overdue boolean and remaining hours
    const now = Date.now();
    const enriched = complaints.map(c => {
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

    res.json({
      success: true,
      complaints: enriched
    });
  } catch (err) {
    console.error('Fetch complaints error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve complaints.' });
  }
});

// GET /api/complaints/:id - Detailed complaint record with timeline and evidence
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await queryOne(`
      SELECT 
        c.*,
        cat.name as category_name, cat.sla_hours,
        d.name as department_name, d.contact_email as dept_email,
        u.full_name as citizen_name, u.phone as citizen_phone, u.email as citizen_email
      FROM complaints c
      JOIN complaint_categories cat ON c.category_id = cat.id
      JOIN departments d ON c.department_id = d.id
      JOIN users u ON c.citizen_id = u.id
      WHERE c.id = ? OR c.tracking_id = ?
    `, [id, id]);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Status Timeline History
    const history = await query(`
      SELECT 
        h.id, h.from_status, h.to_status, h.remarks, h.created_at,
        u.full_name as changed_by_name, u.role_id, r.name as role_name
      FROM complaint_status_history h
      LEFT JOIN users u ON h.changed_by_user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE h.complaint_id = ?
      ORDER BY h.created_at ASC
    `, [complaint.id]);

    // Evidence
    const evidence = await query(`
      SELECT e.*, u.full_name as uploaded_by_name
      FROM complaint_evidence e
      LEFT JOIN users u ON e.uploaded_by_user_id = u.id
      WHERE e.complaint_id = ?
      ORDER BY e.created_at DESC
    `, [complaint.id]);

    // Assignment & Field Task
    const assignment = await queryOne(`
      SELECT 
        a.id as assignment_id, a.instructions, a.status as assignment_status, a.created_at as assigned_at,
        u_staff.full_name as field_staff_name, u_staff.phone as field_staff_phone,
        t.id as task_id, t.state as task_state, t.resolution_notes
      FROM complaint_assignments a
      JOIN users u_staff ON a.assigned_to_user_id = u_staff.id
      LEFT JOIN field_tasks t ON t.assignment_id = a.id
      WHERE a.complaint_id = ?
      ORDER BY a.created_at DESC LIMIT 1
    `, [complaint.id]);

    // Citizen Feedback
    const feedback = await queryOne(`
      SELECT * FROM complaint_feedback WHERE complaint_id = ?
    `, [complaint.id]);

    // Comments / Notes
    const comments = await query(`
      SELECT c.*, u.full_name as author_name, r.name as author_role
      FROM complaint_comments c
      JOIN users u ON c.author_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE c.complaint_id = ?
      ORDER BY c.created_at ASC
    `, [complaint.id]);

    const deadline = new Date(complaint.sla_deadline).getTime();
    const remainingHours = Math.round((deadline - Date.now()) / (1000 * 3600));

    res.json({
      success: true,
      complaint: {
        ...complaint,
        remaining_hours: remainingHours,
        is_overdue: complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED' && deadline < Date.now(),
        timeline: history,
        evidence,
        assignment,
        feedback,
        comments
      }
    });
  } catch (err) {
    console.error('Fetch complaint details error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve complaint details.' });
  }
});

// POST /api/complaints - Create new complaint
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      category_id,
      location_address,
      landmark,
      ward_number,
      priority = 'MEDIUM'
    } = req.body;

    if (!title || !description || !category_id || !location_address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Title, Description, Category, and Location address.'
      });
    }

    const category = await queryOne(`SELECT * FROM complaint_categories WHERE id = ?`, [category_id]);
    if (!category) {
      return res.status(400).json({ success: false, message: 'Invalid complaint category selected.' });
    }

    const trackingId = await generateTrackingId();
    const complaintId = `cmp_${crypto.randomUUID()}`;
    const slaHours = category.sla_hours || 48;
    const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

    await run(`
      INSERT INTO complaints (
        id, tracking_id, citizen_id, category_id, department_id,
        title, description, location_address, landmark, ward_number,
        priority, status, sla_deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?)
    `, [
      complaintId,
      trackingId,
      req.user.id,
      category_id,
      category.department_id,
      title.trim(),
      description.trim(),
      location_address.trim(),
      landmark ? landmark.trim() : null,
      ward_number || req.user.ward_number || 'Ward 14',
      priority,
      slaDeadline
    ]);

    // Initial timeline record
    await run(`
      INSERT INTO complaint_status_history (id, complaint_id, from_status, to_status, changed_by_user_id, remarks)
      VALUES (?, ?, NULL, 'SUBMITTED', ?, 'Complaint lodged by citizen via Nagar Connect')
    `, [`hist_${Date.now()}`, complaintId, req.user.id]);

    // Notification
    await run(`
      INSERT INTO notifications (id, user_id, title, message, type, related_entity_type, related_entity_id)
      VALUES (?, ?, 'Complaint Lodged Successfully', ?, 'SUCCESS', 'COMPLAINT', ?)
    `, [
      `notif_${Date.now()}`,
      req.user.id,
      `Your complaint ${trackingId} has been registered and assigned to ${category.name} department. SLA: ${slaHours} hours.`,
      complaintId
    ]);

    res.status(201).json({
      success: true,
      message: 'Complaint created successfully.',
      tracking_id: trackingId,
      complaint_id: complaintId
    });
  } catch (err) {
    console.error('Complaint creation error:', err);
    res.status(500).json({ success: false, message: 'Failed to create complaint.' });
  }
});

// POST /api/complaints/:id/feedback - Citizen ratings & reopen requests
router.post('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, is_satisfied = 1, reopen_requested = 0, reopen_reason } = req.body;

    const complaint = await queryOne(`SELECT * FROM complaints WHERE id = ?`, [id]);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    await run(`
      INSERT OR REPLACE INTO complaint_feedback (
        id, complaint_id, citizen_id, rating, comment, is_satisfied, reopen_requested, reopen_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      `fb_${Date.now()}`,
      complaint.id,
      req.user.id,
      rating,
      comment || '',
      is_satisfied ? 1 : 0,
      reopen_requested ? 1 : 0,
      reopen_reason || null
    ]);

    // If citizen requested reopen, set status to UNDER_REVIEW and record escalation
    if (reopen_requested) {
      await run(`UPDATE complaints SET status = 'UNDER_REVIEW', is_escalated = 1 WHERE id = ?`, [complaint.id]);
      await run(`
        INSERT INTO complaint_status_history (id, complaint_id, from_status, to_status, changed_by_user_id, remarks)
        VALUES (?, ?, 'RESOLVED', 'UNDER_REVIEW', ?, ?)
      `, [`hist_${Date.now()}`, complaint.id, req.user.id, `Citizen reopened complaint: ${reopen_reason || 'Unsatisfied with resolution'}`]);
    }

    res.json({
      success: true,
      message: reopen_requested ? 'Complaint reopened for executive review.' : 'Thank you for your feedback!'
    });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ success: false, message: 'Failed to record feedback.' });
  }
});

module.exports = router;
