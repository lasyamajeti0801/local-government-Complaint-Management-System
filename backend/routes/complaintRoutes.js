/**
 * Nagar Connect - Complaint Management Routes (Member 2 Foundation & Lifecycle)
 */
const express = require('express');
const router = express.Router();
const { query: dbQuery, get: dbGet, run: dbRun } = require('../../database/db');
const { authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// GET /api/complaints/departments
router.get('/departments', async (req, res) => {
  try {
    const depts = await dbQuery('SELECT * FROM departments ORDER BY name ASC');
    res.json({ departments: depts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/complaints/categories
router.get('/categories', async (req, res) => {
  try {
    const { department_id } = req.query;
    let sql = `
      SELECT c.*, d.name as department_name, d.code as department_code
      FROM complaint_categories c
      JOIN departments d ON c.department_id = d.id
    `;
    const params = [];
    if (department_id) {
      sql += ' WHERE c.department_id = ?';
      params.push(department_id);
    }
    sql += ' ORDER BY d.name, c.name ASC';
    const categories = await dbQuery(sql, params);
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/complaints - List complaints with role-based filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, id: userId, department_id } = req.user;
    const { status, priority, department, search, page = 1, limit = 20 } = req.query;

    let sql = `
      SELECT 
        c.*,
        d.name as department_name, d.code as department_code, d.icon as department_icon,
        cat.name as category_name,
        u.name as citizen_name, u.phone as citizen_phone, u.email as citizen_email,
        ft.id as field_task_id, ft.task_state as field_task_state,
        fs.name as assigned_staff_name
      FROM complaints c
      JOIN departments d ON c.department_id = d.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      JOIN users u ON c.citizen_id = u.id
      LEFT JOIN field_tasks ft ON c.id = ft.complaint_id
      LEFT JOIN users fs ON ft.assigned_field_staff_id = fs.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based visibility
    if (role === 'CITIZEN') {
      sql += ' AND c.citizen_id = ?';
      params.push(userId);
    } else if (role === 'OFFICER' && department_id) {
      sql += ' AND c.department_id = ?';
      params.push(department_id);
    } else if (role === 'FIELD_STAFF') {
      sql += ' AND ft.assigned_field_staff_id = ?';
      params.push(userId);
    }

    // Query Filters
    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }
    if (priority) {
      sql += ' AND c.priority = ?';
      params.push(priority);
    }
    if (department) {
      sql += ' AND c.department_id = ?';
      params.push(department);
    }
    if (search) {
      sql += ' AND (c.title LIKE ? OR c.complaint_id LIKE ? OR c.location_address LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY c.created_at DESC';

    const complaints = await dbQuery(sql, params);

    // Summary counts
    const total = complaints.length;
    const openCount = complaints.filter(c => ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'FIELD_VERIFICATION', 'IN_PROGRESS'].includes(c.status)).length;
    const resolvedCount = complaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length;
    const pendingVerification = complaints.filter(c => c.status === 'RESOLUTION_SUBMITTED' || c.status === 'CITIZEN_VERIFICATION').length;

    res.json({
      complaints,
      meta: {
        total,
        openCount,
        resolvedCount,
        pendingVerification
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/complaints/:id - Full details with timeline, evidence, and feedback
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await dbGet(`
      SELECT 
        c.*,
        d.name as department_name, d.code as department_code, d.icon as department_icon,
        d.contact_phone as dept_phone, d.contact_email as dept_email,
        cat.name as category_name, cat.standard_sla_hours,
        u.name as citizen_name, u.phone as citizen_phone, u.email as citizen_email,
        ft.id as field_task_id, ft.task_state as field_task_state, ft.before_photo_url,
        ft.after_photo_url, ft.resolution_description, ft.resolved_at as field_resolved_at,
        fs.name as assigned_field_staff_name, fs.phone as assigned_field_staff_phone
      FROM complaints c
      JOIN departments d ON c.department_id = d.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      JOIN users u ON c.citizen_id = u.id
      LEFT JOIN field_tasks ft ON c.id = ft.complaint_id
      LEFT JOIN users fs ON ft.assigned_field_staff_id = fs.id
      WHERE c.id = ? OR c.complaint_id = ?
    `, [id, id]);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Check citizen permission: only owner or officer/staff/admin can see
    if (req.user.role === 'CITIZEN' && complaint.citizen_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You can only view your own complaints.' });
    }

    // Timeline history
    const timeline = await dbQuery(`
      SELECT h.*, u.name as changed_by_name, u.role as changed_by_role
      FROM complaint_status_history h
      JOIN users u ON h.changed_by_user_id = u.id
      WHERE h.complaint_id = ?
      ORDER BY h.created_at ASC
    `, [complaint.id]);

    // Evidence
    const evidence = await dbQuery(`
      SELECT e.*, u.name as uploaded_by_name, u.role as uploaded_by_role
      FROM complaint_evidence e
      JOIN users u ON e.uploaded_by_user_id = u.id
      WHERE e.complaint_id = ?
      ORDER BY e.created_at ASC
    `, [complaint.id]);

    // Comments
    let commentSql = `
      SELECT c.*, u.name as author_name, u.role as author_role, u.avatar as author_avatar
      FROM complaint_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.complaint_id = ?
    `;
    if (req.user.role === 'CITIZEN') {
      commentSql += ' AND c.is_internal = 0'; // Hide internal notes from citizen
    }
    commentSql += ' ORDER BY c.created_at ASC';
    const comments = await dbQuery(commentSql, [complaint.id]);

    // Feedback
    const feedback = await dbGet('SELECT * FROM complaint_feedback WHERE complaint_id = ?', [complaint.id]);

    res.json({
      complaint,
      timeline,
      evidence,
      comments,
      feedback: feedback || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/complaints - Create new complaint (NGC-2026-XXXXXX)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      department_id,
      category_id,
      location_address,
      landmark,
      ward_number = 'Ward 42',
      latitude = 17.43,
      longitude = 78.40,
      priority = 'MEDIUM',
      evidence_photo_url = null
    } = req.body;

    if (!title || !description || !department_id || !category_id || !location_address) {
      return res.status(400).json({ error: 'Title, description, department, category, and location address are required' });
    }

    // Generate unique complaint ID: NGC-2026-XXXXXX
    const countRes = await dbGet('SELECT COUNT(*) as count FROM complaints');
    const seq = (countRes?.count || 0) + 1;
    const complaintIdFormatted = `NGC-2026-${String(seq).padStart(6, '0')}`;
    const id = `CMP_${Date.now()}`;

    // Get category standard SLA hours
    const cat = await dbGet('SELECT standard_sla_hours FROM complaint_categories WHERE id = ?', [category_id]);
    const slaHours = cat?.standard_sla_hours || 48;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

    await dbRun(`
      INSERT INTO complaints (
        id, complaint_id, citizen_id, department_id, category_id, title, description,
        location_address, landmark, ward_number, latitude, longitude, priority,
        status, sla_deadline, is_escalated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, 0)
    `, [
      id,
      complaintIdFormatted,
      req.user.id,
      department_id,
      category_id,
      title,
      description,
      location_address,
      landmark || '',
      ward_number,
      latitude,
      longitude,
      priority,
      slaDeadline
    ]);

    // Initial Status History
    await dbRun(`
      INSERT INTO complaint_status_history (id, complaint_id, previous_status, new_status, changed_by_user_id, remarks)
      VALUES (?, ?, NULL, 'SUBMITTED', ?, 'Grievance submitted by citizen through Nagar Connect portal')
    `, [`HIST_${id}_01`, id, req.user.id]);

    // Initial Evidence if provided
    if (evidence_photo_url) {
      await dbRun(`
        INSERT INTO complaint_evidence (id, complaint_id, uploaded_by_user_id, evidence_type, file_path, file_url, caption)
        VALUES (?, ?, ?, 'CITIZEN_INITIAL', ?, ?, 'Citizen spot evidence photo')
      `, [`EVID_${id}_01`, id, req.user.id, evidence_photo_url, evidence_photo_url]);
    }

    // Notify citizen
    await dbRun(`
      INSERT INTO notifications (id, user_id, title, message, type, link_url)
      VALUES (?, ?, ?, ?, 'COMPLAINT_CREATED', ?)
    `, [
      `NOTIF_${Date.now()}`,
      req.user.id,
      'Grievance Registered Successfully',
      `Your grievance ${complaintIdFormatted} has been logged under ${title}. Official SLA: ${slaHours} hours.`,
      `/citizen/complaints/${id}`
    ]);

    await logAudit(req.user.id, req.user.role, 'COMPLAINT_CREATE', 'COMPLAINT', id, { complaintId: complaintIdFormatted, title }, req.ip);

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: {
        id,
        complaint_id: complaintIdFormatted,
        status: 'SUBMITTED',
        sla_deadline: slaDeadline
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/complaints/:id/feedback - Citizen Feedback
router.post('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comments, reopen_requested = false } = req.body;

    const complaint = await dbGet('SELECT * FROM complaints WHERE id = ?', [id]);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    if (complaint.citizen_id !== req.user.id && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to submit feedback for this complaint' });
    }

    await dbRun(`
      INSERT OR REPLACE INTO complaint_feedback (id, complaint_id, citizen_id, rating, comments, reopen_requested)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [`FDBK_${id}`, id, req.user.id, rating, comments || '', reopen_requested ? 1 : 0]);

    if (reopen_requested) {
      await dbRun("UPDATE complaints SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
      await dbRun(`
        INSERT INTO complaint_status_history (id, complaint_id, previous_status, new_status, changed_by_user_id, remarks)
        VALUES (?, ?, 'RESOLVED', 'IN_PROGRESS', ?, ?)
      `, [`HIST_${id}_${Date.now()}`, id, req.user.id, `Reopened by citizen: ${comments || 'Dissatisfied with work'}`]);
    } else {
      await dbRun("UPDATE complaints SET status = 'CLOSED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
      await dbRun(`
        INSERT INTO complaint_status_history (id, complaint_id, previous_status, new_status, changed_by_user_id, remarks)
        VALUES (?, ?, 'RESOLVED', 'CLOSED', ?, 'Citizen satisfied. Complaint officially closed.')
      `, [`HIST_${id}_${Date.now()}`, id, req.user.id]);
    }

    await logAudit(req.user.id, req.user.role, 'SUBMIT_FEEDBACK', 'COMPLAINT', id, { rating, reopen: reopen_requested }, req.ip);

    res.json({ message: 'Feedback recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/complaints/:id/comments - Add comment or citizen note
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment_text, is_internal = false } = req.body;

    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const cid = `COMM_${Date.now()}`;
    await dbRun(`
      INSERT INTO complaint_comments (id, complaint_id, user_id, comment_text, is_internal)
      VALUES (?, ?, ?, ?, ?)
    `, [cid, id, req.user.id, comment_text.trim(), is_internal ? 1 : 0]);

    res.status(201).json({ message: 'Comment added', commentId: cid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
