// ============================================================
// NAGAR CONNECT - CITIZEN CONTROLLER
// ============================================================

const complaintService = require('../services/complaintService');

exports.createComplaint = async (req, res, next) => {
  try {
    const complaint = complaintService.createComplaint(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Complaint successfully registered in municipal records.',
      data: complaint
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyComplaints = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const result = complaintService.getCitizenComplaints(req.user.id, { status, search });
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

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

exports.submitFeedback = async (req, res, next) => {
  try {
    const updated = complaintService.submitFeedback(req.user.id, req.params.id, req.body);
    res.json({
      success: true,
      message: req.body.reopen ? 'Complaint reopened for investigation.' : 'Thank you for your feedback.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.getDepartments = async (req, res, next) => {
  try {
    const departments = complaintService.getDepartments();
    res.json({
      success: true,
      data: departments
    });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = complaintService.getCategories(req.query.department_id);
    res.json({
      success: true,
      data: categories
    });
  } catch (err) {
    next(err);
  }
};
