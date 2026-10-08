// ============================================================
// NAGAR CONNECT - COMPLAINT SERVICE (Citizen Core & Shared)
// ============================================================

const db = require('../config/db');
const slaService = require('./slaService');

class ComplaintService {
  // Generate realistic sequential municipal complaint ID
  generateComplaintNumber() {
    const year = new Date().getFullYear();
    const countRow = db.get('SELECT COUNT(*) as total FROM complaints');
    const nextSeq = (countRow ? countRow.total : 0) + 101;
    const padded = String(nextSeq).padStart(6, '0');
    return `NGC-${year}-${padded}`;
  }

  // Create a new complaint from Citizen portal
  createComplaint(citizenId, data) {
    const {
      title,
      description,
      department_id,
      category_id,
      location_address,
      landmark,
      ward_number,
      latitude,
      longitude,
      priority = 'MEDIUM'
    } = data;

    if (!title || !description || !department_id || !category_id || !location_address) {
      throw { statusCode: 400, message: 'Missing required complaint fields (title, description, department, category, location).' };
    }

    const complaintId = `cmp-${Date.now()}`;
    const complaintNumber = this.generateComplaintNumber();
    
    // Calculate SLA deadline
    const sla = slaService.calculateSlaDeadline(department_id, category_id, priority);

    db.transaction(() => {
      // 1. Insert complaint
      db.run(`
        INSERT INTO complaints (
          id, complaint_number, citizen_id, department_id, category_id,
          title, description, location_address, landmark, ward_number,
          latitude, longitude, priority, status, sla_deadline, sla_status,
          is_escalated, escalation_level, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, 'ON_TRACK', 0, 'NONE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        complaintId,
        complaintNumber,
        citizenId,
        department_id,
        category_id,
        title.trim(),
        description.trim(),
        location_address.trim(),
        landmark ? landmark.trim() : null,
        ward_number ? ward_number.trim() : null,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        priority,
        sla.deadlineIso
      ]);

      // 2. Insert initial status history
      db.run(`
        INSERT INTO complaint_status_history (
          id, complaint_id, previous_status, new_status, changed_by_user_id, action, remarks, created_at
        ) VALUES (?, ?, NULL, 'SUBMITTED', ?, 'SUBMITTED', 'Grievance lodged by citizen with priority ' || ?, CURRENT_TIMESTAMP)
      `, [`his-${Date.now()}`, complaintId, citizenId, priority]);

      // 3. Notify Department Officer
      const deptOfficers = db.all(`
        SELECT id FROM users WHERE department_id = ? AND role = 'OFFICER' AND is_active = 1
      `, [department_id]);

      deptOfficers.forEach(off => {
        db.run(`
          INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id, is_read)
          VALUES (?, ?, 'New Civic Complaint Lodged', ?, 'WARNING', 'COMPLAINT', ?, 0)
        `, [`not-${Date.now()}-${off.id}`, off.id, `New complaint ${complaintNumber} lodged: ${title.substring(0, 45)}...`, complaintId]);
      });

      // 4. Audit Log
      db.run(`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
        VALUES (?, ?, 'COMPLAINT_CREATED', 'COMPLAINT', ?, ?)
      `, [`aud-${Date.now()}`, citizenId, complaintId, JSON.stringify({ complaintNumber, department_id, priority })]);
    });

    return this.getComplaintById(complaintId);
  }

  // Retrieve complete complaint detail with RBAC checks
  getComplaintById(complaintId, requestingUser = null) {
    const complaint = db.get(`
      SELECT c.*,
             u.name as citizen_name, u.email as citizen_email, u.phone as citizen_phone, u.ward_number as citizen_ward,
             d.name as department_name, d.code as department_code, d.helpline as department_helpline,
             cat.name as category_name, cat.default_sla_hours
      FROM complaints c
      JOIN users u ON c.citizen_id = u.id
      JOIN departments d ON c.department_id = d.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      WHERE c.id = ? OR c.complaint_number = ?
    `, [complaintId, complaintId]);

    if (!complaint) {
      throw { statusCode: 404, message: 'Complaint not found.' };
    }

    // Role-based privacy check:
    // Citizens can only view their own complaints
    if (requestingUser && requestingUser.role === 'CITIZEN' && requestingUser.id !== complaint.citizen_id) {
      throw { statusCode: 403, message: 'Access denied: You can only view your own complaints.' };
    }

    // Officers can view complaints for their department (or all if Admin/Commissioner)
    if (requestingUser && requestingUser.role === 'OFFICER' && requestingUser.department_id && requestingUser.department_id !== complaint.department_id) {
      // Allow viewing but flag outside department
      complaint.is_cross_department = true;
    }

    // Compute live SLA metrics
    complaint.sla_metrics = slaService.computeSlaMetrics(complaint.sla_deadline, complaint.status);

    // Fetch Status History Timeline
    complaint.timeline = db.all(`
      SELECT h.*, u.name as actor_name, u.role as actor_role, u.designation as actor_designation
      FROM complaint_status_history h
      LEFT JOIN users u ON h.changed_by_user_id = u.id
      WHERE h.complaint_id = ?
      ORDER BY h.created_at ASC
    `, [complaint.id]);

    // Fetch Assignments
    complaint.assignments = db.all(`
      SELECT a.*,
             assigner.name as assigned_by_name,
             assignee.name as assigned_to_name, assignee.role as assigned_to_role,
             assignee.designation as assigned_to_designation, assignee.phone as assigned_to_phone
      FROM complaint_assignments a
      LEFT JOIN users assigner ON a.assigned_by_user_id = assigner.id
      LEFT JOIN users assignee ON a.assigned_to_user_id = assignee.id
      WHERE a.complaint_id = ?
      ORDER BY a.created_at DESC
    `, [complaint.id]);

    // Fetch Comments (filter internal notes if citizen)
    let commentsSql = `
      SELECT cm.*, u.name as author_name, u.role as author_role, u.designation as author_designation
      FROM complaint_comments cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.complaint_id = ?
    `;
    if (requestingUser && requestingUser.role === 'CITIZEN') {
      commentsSql += ' AND cm.is_internal = 0';
    }
    commentsSql += ' ORDER BY cm.created_at ASC';
    complaint.comments = db.all(commentsSql, [complaint.id]);

    // Fetch Evidence
    complaint.evidence = db.all(`
      SELECT e.*, u.name as uploader_name, u.role as uploader_role
      FROM complaint_evidence e
      LEFT JOIN users u ON e.uploaded_by_user_id = u.id
      WHERE e.complaint_id = ?
      ORDER BY e.created_at ASC
    `, [complaint.id]);

    // Fetch Feedback
    complaint.feedback = db.get(`
      SELECT * FROM complaint_feedback WHERE complaint_id = ?
    `, [complaint.id]) || null;

    // Fetch Escalations if any
    complaint.escalations = db.all(`
      SELECT esc.*, u.name as escalated_by_name
      FROM escalations esc
      LEFT JOIN users u ON esc.escalated_by_user_id = u.id
      WHERE esc.complaint_id = ?
      ORDER BY esc.created_at DESC
    `, [complaint.id]);

    return complaint;
  }

  // Citizen Dashboard Complaints
  getCitizenComplaints(citizenId, filters = {}) {
    let sql = `
      SELECT c.*,
             d.name as department_name, d.code as department_code,
             cat.name as category_name
      FROM complaints c
      JOIN departments d ON c.department_id = d.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      WHERE c.citizen_id = ?
    `;
    const params = [citizenId];

    if (filters.status) {
      sql += ' AND c.status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      sql += ' AND (c.complaint_number LIKE ? OR c.title LIKE ? OR c.location_address LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY c.created_at DESC';

    const complaints = db.all(sql, params);
    
    // Attach SLA metrics
    complaints.forEach(c => {
      c.sla_metrics = slaService.computeSlaMetrics(c.sla_deadline, c.status);
    });

    // Calculate Summary Stats
    const stats = {
      total: complaints.length,
      open: complaints.filter(c => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(c.status)).length,
      resolved: complaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length,
      pendingAction: complaints.filter(c => ['CITIZEN_VERIFICATION', 'RESOLUTION_SUBMITTED'].includes(c.status)).length
    };

    return { complaints, stats };
  }

  // Citizen Feedback Submission & Reopen
  submitFeedback(citizenId, complaintId, { rating, comment, reopen = false, reopen_reason = null }) {
    const complaint = this.getComplaintById(complaintId);
    if (complaint.citizen_id !== citizenId) {
      throw { statusCode: 403, message: 'You can only submit feedback for your own complaints.' };
    }

    db.transaction(() => {
      // Insert/update feedback
      db.run(`
        INSERT OR REPLACE INTO complaint_feedback (id, complaint_id, citizen_id, rating, comment, reopened, reopen_reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [`fb-${Date.now()}`, complaintId, citizenId, rating, comment || null, reopen ? 1 : 0, reopen_reason || null]);

      if (reopen) {
        // Reopen complaint and put under officer review
        db.run(`
          UPDATE complaints
          SET status = 'UNDER_REVIEW', is_escalated = 1, escalation_level = 'L1_OFFICER', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [complaintId]);

        db.run(`
          INSERT INTO complaint_status_history (id, complaint_id, previous_status, new_status, changed_by_user_id, action, remarks, created_at)
          VALUES (?, ?, ?, 'UNDER_REVIEW', ?, 'STATUS_UPDATED', ?, CURRENT_TIMESTAMP)
        `, [`his-${Date.now()}`, complaintId, complaint.status, citizenId, `Citizen reopened complaint: ${reopen_reason || 'Unsatisfied with resolution'}`]);
      } else if (complaint.status === 'CITIZEN_VERIFICATION' || complaint.status === 'RESOLVED') {
        // Close complaint formally
        db.run(`
          UPDATE complaints
          SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [complaintId]);

        db.run(`
          INSERT INTO complaint_status_history (id, complaint_id, previous_status, new_status, changed_by_user_id, action, remarks, created_at)
          VALUES (?, ?, ?, 'CLOSED', ?, 'CLOSED', 'Citizen verified resolution and closed ticket with rating ' || ? || '/5.', CURRENT_TIMESTAMP)
        `, [`his-${Date.now()}`, complaintId, complaint.status, citizenId, rating]);
      }
    });

    return this.getComplaintById(complaintId);
  }

  // Get all departments
  getDepartments() {
    return db.all('SELECT * FROM departments ORDER BY name ASC');
  }

  // Get categories (optionally by department)
  getCategories(departmentId = null) {
    if (departmentId) {
      return db.all('SELECT * FROM complaint_categories WHERE department_id = ? ORDER BY name ASC', [departmentId]);
    }
    return db.all('SELECT * FROM complaint_categories ORDER BY name ASC');
  }
}

module.exports = new ComplaintService();
