// ============================================================
// NAGAR CONNECT - OFFICER CONTROLLER (Member 3 Core)
// ============================================================

const officerService = require('../services/officerService');
const complaintService = require('../services/complaintService');

// Officer Dashboard KPIs
exports.getDashboard = async (req, res, next) => {
  try {
    const stats = officerService.getDashboardStats(req.user);
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
};

// Officer Complaint Queue with Filters & Sorting
exports.getQueue = async (req, res, next) => {
  try {
    const complaints = officerService.getQueue(req.user, req.query);
    res.json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (err) {
    next(err);
  }
};

// Officer View Complaint Detail
exports.getComplaintById = async (req, res, next) => {
  try {
    const complaint = complaintService.getComplaintById(req.params.id, req.user);
    res.json({
      success: true,
      data: complaint
    });
  } catch (err) {
    next(err);
  }
};

// Review / Accept / Reject / Close Complaint
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required.' });
    }
    const updated = officerService.updateStatus(req.user, req.params.id, status, remarks);
    res.json({
      success: true,
      message: `Complaint status updated to ${status}.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// Assign Field Staff
exports.assignFieldStaff = async (req, res, next) => {
  try {
    const { fieldStaffId, assignmentType, instructions, priority, deadlineHours } = req.body;
    if (!fieldStaffId) {
      return res.status(400).json({ success: false, error: 'Field staff selection is required.' });
    }
    const updated = officerService.assignFieldStaff(req.user, req.params.id, {
      fieldStaffId,
      assignmentType,
      instructions,
      priority,
      deadlineHours
    });
    res.json({
      success: true,
      message: 'Field staff successfully assigned.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// Reassign Field Staff
exports.reassignFieldStaff = async (req, res, next) => {
  try {
    const { newFieldStaffId, instructions, reason } = req.body;
    if (!newFieldStaffId) {
      return res.status(400).json({ success: false, error: 'New field staff selection is required.' });
    }
    const updated = officerService.reassignFieldStaff(req.user, req.params.id, {
      newFieldStaffId,
      instructions,
      reason
    });
    res.json({
      success: true,
      message: 'Complaint successfully reassigned to new field staff.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// Change Priority & Recalculate SLA
exports.changePriority = async (req, res, next) => {
  try {
    const { priority, reason } = req.body;
    if (!priority) {
      return res.status(400).json({ success: false, error: 'Priority is required.' });
    }
    const updated = officerService.changePriority(req.user, req.params.id, priority, reason);
    res.json({
      success: true,
      message: `Priority changed to ${priority} and SLA deadline recalculated.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// Add Internal Note or Citizen Query
exports.addComment = async (req, res, next) => {
  try {
    const { message, commentType, isInternal } = req.body;
    const comments = officerService.addComment(req.user, req.params.id, {
      message,
      commentType: commentType || 'INTERNAL_NOTE',
      isInternal: isInternal !== undefined ? isInternal : 1
    });
    res.json({
      success: true,
      message: 'Note added successfully.',
      data: comments
    });
  } catch (err) {
    next(err);
  }
};

// Escalate Complaint
exports.escalate = async (req, res, next) => {
  try {
    const { escalationLevel, reason, notes } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, error: 'Escalation reason is required.' });
    }
    const updated = officerService.escalate(req.user, req.params.id, {
      escalationLevel: escalationLevel || 'L1_OFFICER',
      reason,
      notes
    });
    res.json({
      success: true,
      message: 'Complaint successfully escalated.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// Approve Resolution
exports.approveResolution = async (req, res, next) => {
  try {
    const { remarks, directClose } = req.body;
    const updated = officerService.approveResolution(req.user, req.params.id, {
      remarks,
      directClose: directClose === true
    });
    res.json({
      success: true,
      message: 'Resolution approved by department officer.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// List Department Field Staff with active workload count
exports.getFieldStaff = async (req, res, next) => {
  try {
    const deptId = req.user.department_id || req.query.department_id;
    if (!deptId) {
      const allStaff = officerService.getAllFieldStaff();
      return res.json({ success: true, data: allStaff });
    }
    const staff = officerService.getFieldStaffWorkload(deptId);
    res.json({
      success: true,
      data: staff
    });
  } catch (err) {
    next(err);
  }
};
