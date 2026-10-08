// ============================================================
// NAGAR CONNECT - SHARED ASSIGNMENT & FIELD TASK SERVICE
// (Shared contract for Member 3 Officer & Member 4 Field Staff)
// ============================================================

const db = require('../config/db');
const complaintService = require('./complaintService');

class AssignmentService {
  // Get all assignments with filter
  getAssignments(filters = {}) {
    let sql = `
      SELECT a.*,
             c.complaint_number, c.title as complaint_title, c.location_address, c.landmark, c.status as complaint_status,
             cit.name as citizen_name, cit.phone as citizen_phone,
             assigner.name as assigned_by_name,
             assignee.name as assigned_to_name, assignee.phone as assigned_to_phone, assignee.designation as assigned_to_designation,
             d.name as department_name, d.code as department_code,
             t.id as field_task_id, t.status as task_status
      FROM complaint_assignments a
      JOIN complaints c ON a.complaint_id = c.id
      JOIN users cit ON c.citizen_id = cit.id
      JOIN users assigner ON a.assigned_by_user_id = assigner.id
      JOIN users assignee ON a.assigned_to_user_id = assignee.id
      JOIN departments d ON a.department_id = d.id
      LEFT JOIN field_tasks t ON a.id = t.assignment_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.department_id) {
      sql += ' AND a.department_id = ?';
      params.push(filters.department_id);
    }

    if (filters.assigned_to_user_id) {
      sql += ' AND a.assigned_to_user_id = ?';
      params.push(filters.assigned_to_user_id);
    }

    if (filters.status) {
      sql += ' AND a.status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY a.created_at DESC';
    return db.all(sql, params);
  }

  // Get field staff tasks (Member 4 consumption)
  getFieldStaffTasks(fieldStaffId) {
    return db.all(`
      SELECT t.*,
             a.instructions, a.priority as assignment_priority, a.deadline as assignment_deadline,
             c.id as complaint_id, c.complaint_number, c.title as complaint_title, c.description as complaint_desc,
             c.location_address, c.landmark, c.latitude, c.longitude, c.status as complaint_status,
             cit.name as citizen_name, cit.phone as citizen_phone,
             d.name as department_name,
             cat.name as category_name
      FROM field_tasks t
      JOIN complaint_assignments a ON t.assignment_id = a.id
      JOIN complaints c ON t.complaint_id = c.id
      JOIN users cit ON c.citizen_id = cit.id
      JOIN departments d ON c.department_id = d.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      WHERE t.field_staff_id = ?
      ORDER BY 
        CASE t.status 
          WHEN 'IN_PROGRESS' THEN 1 
          WHEN 'ARRIVED' THEN 2 
          WHEN 'ACCEPTED' THEN 3 
          WHEN 'ASSIGNED' THEN 4 
          ELSE 5 
        END,
        t.created_at DESC
    `, [fieldStaffId]);
  }

  // Update Field Task Status (Member 4 field staff workflow)
  updateFieldTaskStatus(fieldStaffUser, taskId, { status, workDescription, fieldNotes, evidenceUrl }) {
    const task = db.get('SELECT * FROM field_tasks WHERE id = ?', [taskId]);
    if (!task) throw { statusCode: 404, message: 'Field task not found.' };

    if (fieldStaffUser.role === 'FIELD_STAFF' && task.field_staff_id !== fieldStaffUser.id) {
      throw { statusCode: 403, message: 'You can only update your own assigned field tasks.' };
    }

    const complaint = db.get('SELECT * FROM complaints WHERE id = ?', [task.complaint_id]);
    const nowIso = new Date().toISOString();

    db.transaction(() => {
      let arrivedAt = task.arrived_at;
      let completedAt = task.completed_at;

      if (status === 'ARRIVED' && !arrivedAt) arrivedAt = nowIso;
      if (['WORK_COMPLETED', 'RESOLUTION_SUBMITTED'].includes(status) && !completedAt) completedAt = nowIso;

      db.run(`
        UPDATE field_tasks
        SET status = ?, arrived_at = ?, completed_at = ?,
            work_description = COALESCE(?, work_description),
            field_notes = COALESCE(?, field_notes),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [status, arrivedAt, completedAt, workDescription || null, fieldNotes || null, taskId]);

      // Map field task status to complaint status
      let complaintStatus = complaint.status;
      if (status === 'ACCEPTED') complaintStatus = 'ASSIGNED';
      if (status === 'ARRIVED') complaintStatus = 'FIELD_VERIFICATION';
      if (status === 'IN_PROGRESS') complaintStatus = 'IN_PROGRESS';
      if (status === 'WORK_COMPLETED' || status === 'RESOLUTION_SUBMITTED') complaintStatus = 'RESOLUTION_SUBMITTED';

      db.run(`
        UPDATE complaints
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [complaintStatus, task.complaint_id]);

      // Add status history
      db.run(`
        INSERT INTO complaint_status_history (
          id, complaint_id, previous_status, new_status, changed_by_user_id, action, remarks, created_at
        ) VALUES (?, ?, ?, ?, ?, 'STATUS_UPDATED', ?, CURRENT_TIMESTAMP)
      `, [
        `his-${Date.now()}`,
        task.complaint_id,
        complaint.status,
        complaintStatus,
        fieldStaffUser.id,
        `Field Staff ${fieldStaffUser.name} marked status: ${status}. ${fieldNotes ? 'Notes: ' + fieldNotes : ''}`
      ]);

      // If resolution submitted, notify officer
      if (status === 'RESOLUTION_SUBMITTED' || status === 'WORK_COMPLETED') {
        const assignment = db.get('SELECT assigned_by_user_id FROM complaint_assignments WHERE id = ?', [task.assignment_id]);
        if (assignment) {
          db.run(`
            INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id, is_read)
            VALUES (?, ?, 'Resolution Submitted by Field Staff', ?, 'SUCCESS', 'COMPLAINT', ?, 0)
          `, [
            `not-${Date.now()}-${assignment.assigned_by_user_id}`,
            assignment.assigned_by_user_id,
            `Field staff ${fieldStaffUser.name} completed work on ${complaint.complaint_number}. Verification required.`,
            task.complaint_id
          ]);
        }
      }
    });

    return db.get('SELECT * FROM field_tasks WHERE id = ?', [taskId]);
  }
}

module.exports = new AssignmentService();
