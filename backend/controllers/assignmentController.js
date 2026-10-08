// ============================================================
// NAGAR CONNECT - SHARED ASSIGNMENT CONTROLLER
// (Contract for Member 3 Officer & Member 4 Field Staff)
// ============================================================

const assignmentService = require('../services/assignmentService');

exports.getAssignments = async (req, res, next) => {
  try {
    const filters = {
      department_id: req.user.role === 'OFFICER' ? req.user.department_id : req.query.department_id,
      assigned_to_user_id: req.query.assigned_to_user_id,
      status: req.query.status
    };
    const assignments = assignmentService.getAssignments(filters);
    res.json({
      success: true,
      data: assignments
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyTasks = async (req, res, next) => {
  try {
    const tasks = assignmentService.getFieldStaffTasks(req.user.id);
    res.json({
      success: true,
      data: tasks
    });
  } catch (err) {
    next(err);
  }
};

exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { status, workDescription, fieldNotes, evidenceUrl } = req.body;
    const task = assignmentService.updateFieldTaskStatus(req.user, req.params.taskId, {
      status,
      workDescription,
      fieldNotes,
      evidenceUrl
    });
    res.json({
      success: true,
      message: `Field task marked ${status}.`,
      data: task
    });
  } catch (err) {
    next(err);
  }
};
