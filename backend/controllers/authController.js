// ============================================================
// NAGAR CONNECT - AUTH CONTROLLER
// ============================================================

const authService = require('../services/authService');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({
      success: true,
      message: 'Login successful.',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

exports.registerCitizen = async (req, res, next) => {
  try {
    const result = await authService.registerCitizen(req.body);
    res.status(201).json({
      success: true,
      message: 'Citizen account registered successfully.',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
};
