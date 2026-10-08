// =============================================================
// NAGAR CONNECT — MEMBER 4
// backend/controllers/fieldTaskController.js
// HTTP handlers — thin layer; delegates to fieldTaskService.js
// Follows M1/M2/M3 API response conventions exactly.
// =============================================================

const fieldTaskService = require('../services/fieldTaskService');
const FieldTask        = require('../models/FieldTask');
const path             = require('path');
const fs               = require('fs');

// ─────────────────────────────────────────
// Shared API response format (matches M1 convention)
// ─────────────────────────────────────────
const ok  = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const err = (res, error, statusCode = 500) => {
  const code = error.statusCode || statusCode;
  console.error(`[FieldTask] ${error.message}`, error.stack || '');
  res.status(code).json({ success: false, message: error.message || 'Internal server error.' });
};

// ─────────────────────────────────────────
// GET /api/field/dashboard
// Field Staff dashboard summary
// ─────────────────────────────────────────
async function getDashboard(req, res) {
  try {
    const data = await fieldTaskService.getDashboard(req.user.id);
    return ok(res, data, 'Dashboard loaded.');
  } catch (e) { return err(res, e); }
}

// ─────────────────────────────────────────
// GET /api/field/tasks
// List field tasks with filters
// ─────────────────────────────────────────
async function listTasks(req, res) {
  try {
    const {
      status, priority, search,
      todayOnly, overdueOnly, sortBy,
      limit = 20, offset = 0,
    } = req.query;

    const tasks = await FieldTask.findByFieldStaff(req.user.id, {
      status:      status ? status.split(',') : undefined,
      priority,
      search,
      todayOnly:   todayOnly === 'true',
      overdueOnly: overdueOnly === 'true',
      sortBy,
      limit:       parseInt(limit, 10),
      offset:      parseInt(offset, 10),
    });

    return ok(res, { tasks, total: tasks.length });
  } catch (e) { return err(res, e); }
}

// ─────────────────────────────────────────
// GET /api/field/tasks/:taskId
// Full task detail (field staff or officer)
// ─────────────────────────────────────────
async function getTaskDetail(req, res) {
  try {
    const { taskId } = req.params;
    const data = await fieldTaskService.getTaskDetail(
      taskId, req.user.id, req.user.role
    );
    return ok(res, data);
  } catch (e) { return err(res, e); }
}

// ─────────────────────────────────────────
// POST /api/field/tasks/:taskId/accept
// ─────────────────────────────────────────
async function acceptTask(req, res) {
  try {
    const task = await fieldTaskService.updateTaskStatus(
      req.params.taskId, req.user.id, 'ACCEPTED', {}
    );
    return ok(res, { task }, 'Task accepted successfully.');
  } catch (e) { return err(res, e); }
}

// ─────────────────────────────────────────
// POST /api/field/tasks/:taskId/arrive
// ─────────────────────────────────────────
async function markArrived(req, res) {
  try {
    const task = await fieldTaskService.updateTaskStatus(
      req.params.taskId, req.user.id, 'ARRIVED', {}
    );
    return ok(res, { task }, 'Arrival recorded.');
  } catch (e) { return err(res, e); }
}

// ─────────────────────────────────────────
// POST /api/field/tasks/:taskId/start
// ─────────────────────────────────────────
async function startWork(req, res) {
  try {
    const { workNotes } = req.body;
    const task = await fieldTaskService.updateTaskStatus(
      req.params.taskId, req.user.id, 'IN_PROGRESS', { workNotes }
    );
    return ok(res, { task }, 'Work started.');
  } catch (e) { return err(res, e); }
}

// ─────────────────────────────────────────
// POST /api/field/tasks/:taskId/complete
// ─────────────────────────────────────────
async function completeWork(req, res) {
  try {
    const { workDescription, workNotes } = req.body;

    if (!workDescription || workDescription.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Work description is required (minimum 10 characters).',
      });
    }

    const task = await fieldTaskService.updateTaskStatus(
      req.params.taskId, req.user.id, 'WORK_COMPLETED',
      { workDescription: workDescription.trim(), workNotes }
    );
    return ok(res, { task }, 'Work marked as completed.');
  } catch (e) { return err(res, e); }
}

// ─────────────────────────────────────────
// POST /api/field/tasks/:taskId/submit-resolution
// ─────────────────────────────────────────
async function submitResolution(req, res) {
  try {
    const { resolutionNotes, workDescription } = req.body;

    if (!resolutionNotes || resolutionNotes.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Resolution notes are required (minimum 10 characters).',
      });
    }

    const task = await fieldTaskService.updateTaskStatus(
      req.params.taskId, req.user.id, 'RESOLUTION_SUBMITTED',
      { resolutionNotes: resolutionNotes.trim(), workDescription }
    );
    return ok(res, { task }, 'Resolution submitted for officer review.');
  } catch (e) { return err(res, e); }
}

// ─────────────────────────────────────────
// POST /api/field/tasks/:taskId/cannot-resolve
// ─────────────────────────────────────────
async function cannotResolve(req, res) {
  try {
    const { cannotResolveReason } = req.body;

    if (!cannotResolveReason || cannotResolveReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'A reason is required for cannot-resolve (minimum 10 characters).',
      });
    }

    const task = await fieldTaskService.updateTaskStatus(
      req.params.taskId, req.user.id, 'CANNOT_RESOLVE',
      { cannotResolveReason: cannotResolveReason.trim() }
    );
    return ok(res, { task }, 'Recorded as cannot resolve. Officer notified.');
  } catch (e) { return err(res, e); }
}

// ─────────────────────────────────────────
// POST /api/field/tasks/:taskId/escalate
// ─────────────────────────────────────────
async function escalateTask(req, res) {
  try {
    const { escalationReason, escalationNotes } = req.body;

    if (!escalationReason || escalationReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Escalation reason is required (minimum 10 characters).',
      });
    }

    const task = await fieldTaskService.updateTaskStatus(
      req.params.taskId, req.user.id, 'NEEDS_ESCALATION',
      {
        escalationReason: escalationReason.trim(),
        escalationNotes:  escalationNotes?.trim(),
      }
    );
    return ok(res, { task }, 'Escalation submitted.');
  } catch (e) { return err(res, e); }
}

// ─────────────────────────────────────────
// POST /api/field/tasks/:taskId/notes
// Add/append work notes without status change
// ─────────────────────────────────────────
async function addWorkNotes(req, res) {
  try {
    const { notes } = req.body;
    if (!notes || notes.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Notes cannot be empty.' });
    }
    const result = await fieldTaskService.addWorkNotes(
      req.params.taskId, req.user.id, notes.trim()
    );
    return ok(res, result, 'Notes added.');
  } catch (e) { return err(res, e); }
}

// ─────────────────────────────────────────
// POST /api/field/tasks/:taskId/evidence
// Upload evidence (before photo, after photo, doc, notes)
// ─────────────────────────────────────────
async function uploadEvidence(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { taskId } = req.params;
    const { evidenceCategory, description } = req.body;

    const validCategories = [
      'BEFORE_PHOTO', 'AFTER_PHOTO', 'FIELD_DOCUMENT', 'FIELD_NOTES', 'OTHER',
    ];
    if (!validCategories.includes(evidenceCategory)) {
      // Delete orphan file
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: `Invalid evidence category. Allowed: ${validCategories.join(', ')}.`,
      });
    }

    // Build accessible URL (adjust base URL per M1 static config)
    const fileUrl = `/uploads/evidence/${req.file.filename}`;

    // Fetch complaint_id from task
    const taskRow = await require('../models/FieldTask').findById(taskId);
    if (!taskRow) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const evidence = await fieldTaskService.addEvidence({
      taskId,
      complaintId:     taskRow.complaint_id,
      fieldStaffId:    req.user.id,
      fileUrl,
      fileName:        req.file.originalname,
      fileSize:        req.file.size,
      mimeType:        req.file.mimetype,
      evidenceCategory,
      description:     description?.trim(),
    });

    return ok(res, { evidence }, 'Evidence uploaded successfully.', 201);
  } catch (e) { return err(res, e); }
}

// ─────────────────────────────────────────
// GET /api/field/tasks/:taskId/evidence
// List evidence for a task (field staff or officer)
// ─────────────────────────────────────────
async function getEvidence(req, res) {
  try {
    const { pool } = require('../utils/db');
    const { taskId } = req.params;

    // Verify access
    const taskRow = await FieldTask.findById(taskId);
    if (!taskRow) return res.status(404).json({ success: false, message: 'Task not found.' });

    if (req.user.role === 'FIELD_STAFF' && taskRow.field_staff_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const result = await pool.query(
      `SELECT id, evidence_type, evidence_category, file_url, file_name,
              file_size, mime_type, uploaded_by, created_at, description
       FROM complaint_evidence
       WHERE field_task_id = $1
       ORDER BY created_at ASC`,
      [taskId]
    );

    return ok(res, { evidence: result.rows });
  } catch (e) { return err(res, e); }
}

// ─────────────────────────────────────────
// GET /api/field/tasks/:taskId/history
// Status history timeline
// ─────────────────────────────────────────
async function getTaskHistory(req, res) {
  try {
    const { taskId } = req.params;
    const taskRow = await FieldTask.findById(taskId);
    if (!taskRow) return res.status(404).json({ success: false, message: 'Task not found.' });

    if (req.user.role === 'FIELD_STAFF' && taskRow.field_staff_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const history = await FieldTask.getStatusHistory(taskId);
    return ok(res, { history });
  } catch (e) { return err(res, e); }
}

// ─────────────────────────────────────────
// POST /api/officer/tasks/:taskId/verify-resolution
// Officer verifies or rejects a field resolution
// ─────────────────────────────────────────
async function verifyResolution(req, res) {
  try {
    const { approved, remarks } = req.body;
    if (typeof approved !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: '`approved` (boolean) is required.',
      });
    }
    const result = await fieldTaskService.verifyResolution(
      req.params.taskId, req.user.id, { approved, remarks }
    );
    return ok(
      res,
      result,
      approved ? 'Resolution approved. Citizen notified for confirmation.' : 'Resolution rejected. Task returned to in-progress.'
    );
  } catch (e) { return err(res, e); }
}

// ─────────────────────────────────────────
// POST /api/officer/complaints/:complaintId/assign-field-staff
// Officer creates a field task (extends M3)
// ─────────────────────────────────────────
async function assignFieldStaff(req, res) {
  try {
    const { complaintId } = req.params;
    const { fieldStaffId, assignmentId, slaDeadline } = req.body;

    if (!fieldStaffId) {
      return res.status(400).json({ success: false, message: 'fieldStaffId is required.' });
    }

    const task = await fieldTaskService.createFieldTask({
      complaintId,
      assignmentId,
      fieldStaffId,
      assignedBy: req.user.id,
      slaDeadline,
    });

    return ok(res, { task }, 'Field staff assigned and task created.', 201);
  } catch (e) { return err(res, e); }
}

// ─────────────────────────────────────────
// GET /api/officer/complaints/:complaintId/field-tasks
// Officer sees all field tasks for a complaint
// ─────────────────────────────────────────
async function getComplaintFieldTasks(req, res) {
  try {
    const tasks = await FieldTask.findByComplaint(req.params.complaintId);
    return ok(res, { tasks });
  } catch (e) { return err(res, e); }
}

module.exports = {
  getDashboard,
  listTasks,
  getTaskDetail,
  acceptTask,
  markArrived,
  startWork,
  completeWork,
  submitResolution,
  cannotResolve,
  escalateTask,
  addWorkNotes,
  uploadEvidence,
  getEvidence,
  getTaskHistory,
  verifyResolution,
  assignFieldStaff,
  getComplaintFieldTasks,
};
