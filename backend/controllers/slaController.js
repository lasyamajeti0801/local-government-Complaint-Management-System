// ============================================================
// NAGAR CONNECT - SLA CONTROLLER
// ============================================================

const slaService = require('../services/slaService');

exports.getRules = async (req, res, next) => {
  try {
    const deptId = req.query.department_id || (req.user && req.user.department_id ? req.user.department_id : null);
    const rules = slaService.getRules(deptId);
    res.json({
      success: true,
      data: rules
    });
  } catch (err) {
    next(err);
  }
};

exports.refreshSla = async (req, res, next) => {
  try {
    const count = slaService.refreshActiveComplaintsSla();
    res.json({
      success: true,
      message: `Refreshed SLA status for ${count} active complaints.`
    });
  } catch (err) {
    next(err);
  }
};
