// ============================================================
// NAGAR CONNECT - DEPARTMENT OFFICER SERVICE (Member 3 Core)
// ============================================================

const db = require('../config/db');
const slaService = require('./slaService');
const complaintService = require('./complaintService');

class OfficerService {
  // Get department scope helper (Officer sees own department; Admin/Commissioner can view all)
  getDeptScope(officerUser) {
    if (['SUPER_ADMIN', 'COMMISSIONER', 'MUNICIPAL_ADMIN'].includes(officerUser.role)) {
      return null; // All departments
    }
    return officerUser.department_id || null;
  }

  // 1. Officer Dashboard KPIs & Metrics
  getDashboardStats(officerUser) {
    // Refresh live SLA statuses
    slaService.refreshActiveComplaintsSla();

    const deptId = this.getDeptScope(officerUser);
    const whereDept = deptId ? 'WHERE department_id = ?' : 'WHERE 1=1';
    const params = deptId ? [deptId] : [];

    const statsRow = db.get(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'SUBMITTED' THEN 1 ELSE 0 END) as new_complaints,
        SUM(CASE WHEN status IN ('ASSIGNED', 'FIELD_VERIFICATION', 'IN_PROGRESS') THEN 1 ELSE 0 END) as assigned_complaints,
        SUM(CASE WHEN status IN ('UNDER_REVIEW', 'CITIZEN_VERIFICATION', 'RESOLUTION_SUBMITTED') THEN 1 ELSE 0 END) as pending_complaints,
        SUM(CASE WHEN priority IN ('HIGH', 'CRITICAL') AND status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED') THEN 1 ELSE 0 END) as high_priority,
        SUM(CASE WHEN sla_status = 'OVERDUE' AND status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED') THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN is_escalated = 1 AND status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED') THEN 1 ELSE 0 END) as escalated,
        SUM(CASE WHEN status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) as resolved
      FROM complaints
      ${whereDept}
    `, params);

    // Category distribution
    const categoryStats = db.all(`
      SELECT cat.name as category_name, COUNT(c.id) as count
      FROM complaints c
      JOIN complaint_categories cat ON c.category_id = cat.id
      ${deptId ? 'WHERE c.department_id = ?' : ''}
      GROUP BY c.category_id
      ORDER BY count DESC
      LIMIT 6
    `, params);

    // Recent department status history / activity stream
    const recentActivitySql = `
      SELECT h.*, c.complaint_number, c.title as complaint_title,
             u.name as actor_name, u.role as actor_role, u.designation as actor_designation
      FROM complaint_status_history h
      JOIN complaints c ON h.complaint_id = c.id
      LEFT JOIN users u ON h.changed_by_user_id = u.id
      ${deptId ? 'WHERE c.department_id = ?' : ''}
      ORDER BY h.created_at DESC
      LIMIT 10
    `;
    const recentActivity = db.all(recentActivitySql, params);

    // Active field staff workload overview
    const staffWorkload = deptId ? this.getFieldStaffWorkload(deptId) : [];

    return {
      kpis: {
        total: statsRow ? statsRow.total : 0,
        newComplaints: statsRow ? (statsRow.new_complaints || 0) : 0,
        assignedComplaints: statsRow ? (statsRow.assigned_complaints || 0) : 0,
        pendingComplaints: statsRow ? (statsRow.pending_complaints || 0) : 0,
        highPriority: statsRow ? (statsRow.high_priority || 0) : 0,
        overdue: statsRow ? (statsRow.overdue || 0) : 0,
        escalated: statsRow ? (statsRow.escalated || 0) : 0,
        resolved: statsRow ? (statsRow.resolved || 0) : 0
      },
      categoryStats,
      recentActivity,
      staffWorkload
    };
  }

  // 2. Officer Complaint Queue
  getQueue(officerUser, filters = {}) {
    slaService.refreshActiveComplaintsSla();

    const deptId = this.getDeptScope(officerUser);
    let sql = `
      SELECT c.*,
             cit.name as citizen_name, cit.phone as citizen_phone, cit.email as citizen_email,
             d.name as department_name, d.code as department_code,
             cat.name as category_name,
             latest_asg.assigned_to_id,
             staff.name as assigned_staff_name, staff.designation as assigned_staff_designation
      FROM complaints c
      JOIN users cit ON c.citizen_id = cit.id
      JOIN departments d ON c.department_id = d.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      LEFT JOIN (
        SELECT complaint_id, assigned_to_user_id as assigned_to_id, MAX(created_at)
        FROM complaint_assignments
        WHERE status NOT IN ('CANCELLED', 'REASSIGNED')
        GROUP BY complaint_id
      ) latest_asg ON c.id = latest_asg.complaint_id
      LEFT JOIN users staff ON latest_asg.assigned_to_id = staff.id
      WHERE 1=1
    `;
    const params = [];

    // Department filtering
    if (deptId) {
      sql += ' AND c.department_id = ?';
      params.push(deptId);
    } else if (filters.department_id) {
      sql += ' AND c.department_id = ?';
      params.push(filters.department_id);
    }

    // Status filtering
    if (filters.status && filters.status !== 'ALL') {
      sql += ' AND c.status = ?';
      params.push(filters.status);
    }

    // Priority filtering
    if (filters.priority && filters.priority !== 'ALL') {
      sql += ' AND c.priority = ?';
      params.push(filters.priority);
    }

    // SLA filter: 'OVERDUE', 'APPROACHING_DEADLINE', 'ON_TRACK'
    if (filters.sla_status && filters.sla_status !== 'ALL') {
      sql += ' AND c.sla_status = ?';
      params.push(filters.sla_status);
    }

    // Category filter
    if (filters.category_id && filters.category_id !== 'ALL') {
      sql += ' AND c.category_id = ?';
      params.push(filters.category_id);
    }

    // Assigned staff filter
    if (filters.assigned_to_id) {
      sql += ' AND latest_asg.assigned_to_id = ?';
      params.push(filters.assigned_to_id);
    }

    // Escalated filter
    if (filters.is_escalated === '1' || filters.is_escalated === true) {
      sql += ' AND c.is_escalated = 1';
    }

    // Search query: complaint number, title, description, citizen name, location
    if (filters.search) {
      sql += ' AND (c.complaint_number LIKE ? OR c.title LIKE ? OR cit.name LIKE ? OR c.location_address LIKE ? OR c.landmark LIKE ?)';
      const s = `%${filters.search.trim()}%`;
      params.push(s, s, s, s, s);
    }

    // Sorting
    let orderBy = 'c.created_at DESC';
    if (filters.sortBy === 'SLA_URGENCY') {
      orderBy = "CASE WHEN c.sla_status = 'OVERDUE' THEN 1 WHEN c.sla_status = 'APPROACHING_DEADLINE' THEN 2 ELSE 3 END, c.sla_deadline ASC";
    } else if (filters.sortBy === 'PRIORITY') {
      orderBy = "CASE c.priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, c.created_at DESC";
    } else if (filters.sortBy === 'OLDEST') {
      orderBy = 'c.created_at ASC';
    }

    sql += ` ORDER BY ${orderBy}`;

    const rows = db.all(sql, params);

    // Attach live SLA metrics to each complaint in queue
    rows.forEach(r => {
      r.sla_metrics = slaService.computeSlaMetrics(r.sla_deadline, r.status);
    });

    return rows;
  }

  // 3. Officer Status Update (Review, Accept, Reject, Close)
  updateStatus(officerUser, complaintId, newStatus, remarks) {
    const complaint = db.get('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!complaint) {
      throw { statusCode: 404, message: 'Complaint not found.' };
    }

    // Permission check
    if (officerUser.role === 'OFFICER' && officerUser.department_id !== complaint.department_id) {
      throw { statusCode: 403, message: 'Access denied: You can only update complaints within your department.' };
    }

    const previousStatus = complaint.status;
    const nowIso = new Date().toISOString();

    db.transaction(() => {
      let resolvedAt = complaint.resolved_at;
      let closedAt = complaint.closed_at;

      if (newStatus === 'RESOLVED') {
        resolvedAt = nowIso;
      } else if (newStatus === 'CLOSED') {
        closedAt = nowIso;
      }

      db.run(`
        UPDATE complaints
        SET status = ?, resolved_at = ?, closed_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newStatus, resolvedAt, closedAt, complaintId]);

      // Add to status history
      const actionMap = {
        UNDER_REVIEW: 'REVIEWED',
        ASSIGNED: 'ASSIGNED',
        REJECTED: 'REJECTED',
        RESOLVED: 'RESOLVED',
        CLOSED: 'CLOSED',
        IN_PROGRESS: 'STATUS_UPDATED',
        CITIZEN_VERIFICATION: 'RESOLUTION_SUBMITTED'
      };
      const action = actionMap[newStatus] || 'STATUS_UPDATED';

      db.run(`
        INSERT INTO complaint_status_history (
          id, complaint_id, previous_status, new_status, changed_by_user_id, action, remarks, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [`his-${Date.now()}`, complaintId, previousStatus, newStatus, officerUser.id, action, remarks || `Status changed to ${newStatus}`]);

      // Notify citizen of official status change
      db.run(`
        INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id, is_read)
        VALUES (?, ?, 'Complaint Status Updated', ?, 'INFO', 'COMPLAINT', ?, 0)
      `, [
        `not-${Date.now()}-${complaint.citizen_id}`,
        complaint.citizen_id,
        `Your complaint ${complaint.complaint_number} is now ${newStatus.replace(/_/g, ' ')}. ${remarks ? 'Note: ' + remarks : ''}`,
        complaintId
      ]);

      // Audit Log
      db.run(`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
        VALUES (?, ?, 'STATUS_CHANGE', 'COMPLAINT', ?, ?)
      `, [`aud-${Date.now()}`, officerUser.id, complaintId, JSON.stringify({ previousStatus, newStatus, remarks })]);
    });

    return complaintService.getComplaintById(complaintId, officerUser);
  }

  // 4. Assign Field Staff (Member 3 to Member 4 integration)
  assignFieldStaff(officerUser, complaintId, { fieldStaffId, assignmentType = 'FIELD_WORK', instructions, priority, deadlineHours }) {
    const complaint = db.get('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!complaint) {
      throw { statusCode: 404, message: 'Complaint not found.' };
    }

    if (officerUser.role === 'OFFICER' && officerUser.department_id !== complaint.department_id) {
      throw { statusCode: 403, message: 'Access denied: You can only assign complaints within your department.' };
    }

    // Verify assigned field staff
    const fieldStaff = db.get("SELECT * FROM users WHERE id = ? AND role = 'FIELD_STAFF' AND is_active = 1", [fieldStaffId]);
    if (!fieldStaff) {
      throw { statusCode: 400, message: 'Selected field staff member is invalid or inactive.' };
    }

    const assignmentId = `asg-${Date.now()}`;
    const taskId = `tsk-${Date.now()}`;
    const assignPriority = priority || complaint.priority;
    const hours = deadlineHours ? parseInt(deadlineHours) : 24;
    const deadline = new Date(Date.now() + hours * 3600 * 1000).toISOString();

    db.transaction(() => {
      // 1. Insert into complaint_assignments
      db.run(`
        INSERT INTO complaint_assignments (
          id, complaint_id, assigned_by_user_id, assigned_to_user_id,
          department_id, assignment_type, status, instructions, priority, deadline, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [assignmentId, complaintId, officerUser.id, fieldStaffId, complaint.department_id, assignmentType, instructions || null, assignPriority, deadline]);

      // 2. Insert into field_tasks (Contract ready for Member 4 Field Staff)
      db.run(`
        INSERT INTO field_tasks (
          id, complaint_id, assignment_id, field_staff_id, status, work_description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'ASSIGNED', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [taskId, complaintId, assignmentId, fieldStaffId, instructions || 'Execute required field repairs and upload resolution proof.']);

      // 3. Update complaint status to ASSIGNED
      db.run(`
        UPDATE complaints
        SET status = 'ASSIGNED', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [complaintId]);

      // 4. Status History
      db.run(`
        INSERT INTO complaint_status_history (
          id, complaint_id, previous_status, new_status, changed_by_user_id, action, remarks, created_at
        ) VALUES (?, ?, ?, 'ASSIGNED', ?, 'ASSIGNED', ?, CURRENT_TIMESTAMP)
      `, [
        `his-${Date.now()}`,
        complaintId,
        complaint.status,
        officerUser.id,
        `Assigned to ${fieldStaff.name} (${fieldStaff.designation || 'Field Staff'}). Instructions: ${instructions || 'Field inspection'}`
      ]);

      // 5. Notify Field Staff
      db.run(`
        INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id, is_read)
        VALUES (?, ?, 'New Field Task Assigned', ?, 'ASSIGNMENT', 'TASK', ?, 0)
      `, [
        `not-${Date.now()}-${fieldStaffId}`,
        fieldStaffId,
        `Officer ${officerUser.name} assigned you complaint ${complaint.complaint_number}: ${complaint.title.substring(0, 40)}`,
        taskId
      ]);

      // 6. Notify Citizen
      db.run(`
        INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id, is_read)
        VALUES (?, ?, 'Field Staff Assigned to Complaint', ?, 'INFO', 'COMPLAINT', ?, 0)
      `, [
        `not-${Date.now()}-${complaint.citizen_id}`,
        complaint.citizen_id,
        `Field personnel ${fieldStaff.name} has been assigned to address your grievance ${complaint.complaint_number}.`,
        complaintId
      ]);

      // 7. Audit Log
      db.run(`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
        VALUES (?, ?, 'ASSIGNMENT', 'COMPLAINT', ?, ?)
      `, [`aud-${Date.now()}`, officerUser.id, complaintId, JSON.stringify({ fieldStaffId, assignmentId, taskId, instructions })]);
    });

    return complaintService.getComplaintById(complaintId, officerUser);
  }

  // 5. Reassign Field Staff
  reassignFieldStaff(officerUser, complaintId, { newFieldStaffId, instructions, reason }) {
    const complaint = db.get('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!complaint) throw { statusCode: 404, message: 'Complaint not found.' };

    const newStaff = db.get("SELECT * FROM users WHERE id = ? AND role = 'FIELD_STAFF' AND is_active = 1", [newFieldStaffId]);
    if (!newStaff) throw { statusCode: 400, message: 'Selected replacement field staff member is invalid.' };

    db.transaction(() => {
      // Mark current assignment as REASSIGNED
      db.run(`
        UPDATE complaint_assignments
        SET status = 'REASSIGNED', updated_at = CURRENT_TIMESTAMP
        WHERE complaint_id = ? AND status IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS')
      `, [complaintId]);

      // Cancel previous pending field task
      db.run(`
        UPDATE field_tasks
        SET status = 'REASSIGNED', updated_at = CURRENT_TIMESTAMP
        WHERE complaint_id = ? AND status IN ('ASSIGNED', 'ACCEPTED')
      `, [complaintId]);

      // Create new assignment
      const newAsgId = `asg-${Date.now()}`;
      const newTaskId = `tsk-${Date.now()}`;
      const deadline = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

      db.run(`
        INSERT INTO complaint_assignments (
          id, complaint_id, assigned_by_user_id, assigned_to_user_id,
          department_id, assignment_type, status, instructions, priority, deadline, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'FIELD_WORK', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [newAsgId, complaintId, officerUser.id, newFieldStaffId, complaint.department_id, 'PENDING', instructions || null, complaint.priority, deadline]);

      db.run(`
        INSERT INTO field_tasks (
          id, complaint_id, assignment_id, field_staff_id, status, work_description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'ASSIGNED', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [newTaskId, complaintId, newAsgId, newFieldStaffId, instructions || 'Reassigned field duty.']);

      // Log status history
      db.run(`
        INSERT INTO complaint_status_history (
          id, complaint_id, previous_status, new_status, changed_by_user_id, action, remarks, created_at
        ) VALUES (?, ?, ?, ?, ?, 'ASSIGNED', ?, CURRENT_TIMESTAMP)
      `, [
        `his-${Date.now()}`,
        complaintId,
        complaint.status,
        complaint.status,
        officerUser.id,
        `Reassigned to ${newStaff.name}. Reason: ${reason || 'Workload adjustment'}`
      ]);

      // Internal Note
      db.run(`
        INSERT INTO complaint_comments (id, complaint_id, user_id, comment_type, message, is_internal, created_at)
        VALUES (?, ?, ?, 'INTERNAL_NOTE', ?, 1, CURRENT_TIMESTAMP)
      `, [`cmt-${Date.now()}`, complaintId, officerUser.id, `Reassigned to ${newStaff.name}: ${reason || 'Operational re-assignment'}`]);
    });

    return complaintService.getComplaintById(complaintId, officerUser);
  }

  // 6. Change Priority & Recalculate SLA
  changePriority(officerUser, complaintId, newPriority, reason) {
    const complaint = db.get('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!complaint) throw { statusCode: 404, message: 'Complaint not found.' };

    const oldPriority = complaint.priority;
    const sla = slaService.calculateSlaDeadline(complaint.department_id, complaint.category_id, newPriority);

    db.transaction(() => {
      db.run(`
        UPDATE complaints
        SET priority = ?, sla_deadline = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newPriority, sla.deadlineIso, complaintId]);

      db.run(`
        INSERT INTO complaint_status_history (
          id, complaint_id, previous_status, new_status, changed_by_user_id, action, remarks, created_at
        ) VALUES (?, ?, ?, ?, ?, 'STATUS_UPDATED', ?, CURRENT_TIMESTAMP)
      `, [
        `his-${Date.now()}`,
        complaintId,
        complaint.status,
        complaint.status,
        officerUser.id,
        `Priority modified from ${oldPriority} to ${newPriority}. Reason: ${reason || 'Officer assessment'}`
      ]);

      // Internal Note
      db.run(`
        INSERT INTO complaint_comments (id, complaint_id, user_id, comment_type, message, is_internal, created_at)
        VALUES (?, ?, ?, 'INTERNAL_NOTE', ?, 1, CURRENT_TIMESTAMP)
      `, [`cmt-${Date.now()}`, complaintId, officerUser.id, `Priority revised to ${newPriority}. New SLA deadline set to ${sla.resolutionHours}h.`]);
    });

    return complaintService.getComplaintById(complaintId, officerUser);
  }

  // 7. Add Comment / Internal Note / Request Citizen Info
  addComment(user, complaintId, { message, commentType = 'INTERNAL_NOTE', isInternal = 1 }) {
    if (!message || !message.trim()) {
      throw { statusCode: 400, message: 'Comment message cannot be empty.' };
    }

    const complaint = db.get('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!complaint) throw { statusCode: 404, message: 'Complaint not found.' };

    const commentId = `cmt-${Date.now()}`;
    const isInt = isInternal ? 1 : 0;

    db.transaction(() => {
      db.run(`
        INSERT INTO complaint_comments (id, complaint_id, user_id, comment_type, message, is_internal, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [commentId, complaintId, user.id, commentType, message.trim(), isInt]);

      // If officer requesting info or sending public communication, notify citizen
      if (!isInt && user.role !== 'CITIZEN') {
        db.run(`
          INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id, is_read)
          VALUES (?, ?, 'Department Update on Your Grievance', ?, 'INFO', 'COMPLAINT', ?, 0)
        `, [
          `not-${Date.now()}-${complaint.citizen_id}`,
          complaint.citizen_id,
          `Officer ${user.name} sent an update regarding ${complaint.complaint_number}: "${message.substring(0, 50)}..."`,
          complaintId
        ]);
      }
    });

    return db.all(`
      SELECT cm.*, u.name as author_name, u.role as author_role, u.designation as author_designation
      FROM complaint_comments cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.complaint_id = ?
      ORDER BY cm.created_at ASC
    `, [complaintId]);
  }

  // 8. Escalate Complaint
  escalate(officerUser, complaintId, { escalationLevel = 'L1_OFFICER', reason = 'SLA_BREACH', notes }) {
    const complaint = db.get('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!complaint) throw { statusCode: 404, message: 'Complaint not found.' };

    const escId = `esc-${Date.now()}`;

    db.transaction(() => {
      // 1. Insert into escalations
      db.run(`
        INSERT INTO escalations (id, complaint_id, escalated_by_user_id, escalation_level, reason, notes, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'OPEN', CURRENT_TIMESTAMP)
      `, [escId, complaintId, officerUser.id, escalationLevel, reason, notes || null]);

      // 2. Mark complaint as escalated
      db.run(`
        UPDATE complaints
        SET is_escalated = 1, escalation_level = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [escalationLevel, complaintId]);

      // 3. Status History
      db.run(`
        INSERT INTO complaint_status_history (
          id, complaint_id, previous_status, new_status, changed_by_user_id, action, remarks, created_at
        ) VALUES (?, ?, ?, ?, ?, 'ESCALATED', ?, CURRENT_TIMESTAMP)
      `, [
        `his-${Date.now()}`,
        complaintId,
        complaint.status,
        complaint.status,
        officerUser.id,
        `Escalated to ${escalationLevel}. Reason: ${reason}. Notes: ${notes || 'Immediate intervention required'}`
      ]);

      // 4. Notify Municipal Commissioner and Admin
      const higherUps = db.all("SELECT id FROM users WHERE role IN ('COMMISSIONER', 'MUNICIPAL_ADMIN') AND is_active = 1");
      higherUps.forEach(adm => {
        db.run(`
          INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id, is_read)
          VALUES (?, ?, 'High Priority Escalation Alert', ?, 'ESCALATION', 'COMPLAINT', ?, 0)
        `, [
          `not-${Date.now()}-${adm.id}`,
          adm.id,
          `Complaint ${complaint.complaint_number} escalated to ${escalationLevel} by ${officerUser.name}: ${reason}`,
          complaintId
        ]);
      });
    });

    return complaintService.getComplaintById(complaintId, officerUser);
  }

  // 9. Approve Resolution
  approveResolution(officerUser, complaintId, { remarks, directClose = false }) {
    const complaint = db.get('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!complaint) throw { statusCode: 404, message: 'Complaint not found.' };

    const targetStatus = directClose ? 'RESOLVED' : 'CITIZEN_VERIFICATION';
    const nowIso = new Date().toISOString();

    db.transaction(() => {
      db.run(`
        UPDATE complaints
        SET status = ?, resolution_summary = ?, resolved_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [targetStatus, remarks || 'Work verified and approved by Department Officer.', nowIso, complaintId]);

      db.run(`
        INSERT INTO complaint_status_history (
          id, complaint_id, previous_status, new_status, changed_by_user_id, action, remarks, created_at
        ) VALUES (?, ?, ?, ?, ?, 'RESOLVED', ?, CURRENT_TIMESTAMP)
      `, [
        `his-${Date.now()}`,
        complaintId,
        complaint.status,
        targetStatus,
        officerUser.id,
        `Officer verified and approved resolution. ${remarks ? 'Remarks: ' + remarks : ''}`
      ]);

      // Notify citizen for feedback and verification
      db.run(`
        INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id, is_read)
        VALUES (?, ?, 'Resolution Submitted for Verification', ?, 'SUCCESS', 'COMPLAINT', ?, 0)
      `, [
        `not-${Date.now()}-${complaint.citizen_id}`,
        complaint.citizen_id,
        `Civic work for complaint ${complaint.complaint_number} has been completed and verified. Please rate the service.`,
        complaintId
      ]);
    });

    return complaintService.getComplaintById(complaintId, officerUser);
  }

  // 10. List Department Field Staff with current workload
  getFieldStaffWorkload(departmentId) {
    return db.all(`
      SELECT u.id, u.name, u.email, u.phone, u.designation, u.ward_number,
             COUNT(CASE WHEN t.status IN ('ASSIGNED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS') THEN 1 ELSE NULL END) as active_tasks_count,
             COUNT(CASE WHEN t.status IN ('WORK_COMPLETED', 'RESOLUTION_SUBMITTED') THEN 1 ELSE NULL END) as completed_tasks_count
      FROM users u
      LEFT JOIN field_tasks t ON u.id = t.field_staff_id
      WHERE u.role = 'FIELD_STAFF' AND u.department_id = ? AND u.is_active = 1
      GROUP BY u.id
      ORDER BY active_tasks_count ASC, u.name ASC
    `, [departmentId]);
  }

  // 11. List All Active Field Staff across all departments (for Admin/Cross-dept)
  getAllFieldStaff() {
    return db.all(`
      SELECT u.id, u.name, u.email, u.phone, u.designation, u.ward_number, u.department_id,
             d.name as department_name, d.code as department_code,
             COUNT(CASE WHEN t.status IN ('ASSIGNED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS') THEN 1 ELSE NULL END) as active_tasks_count
      FROM users u
      JOIN departments d ON u.department_id = d.id
      LEFT JOIN field_tasks t ON u.id = t.field_staff_id
      WHERE u.role = 'FIELD_STAFF' AND u.is_active = 1
      GROUP BY u.id
      ORDER BY d.name ASC, active_tasks_count ASC
    `);
  }
}

module.exports = new OfficerService();
