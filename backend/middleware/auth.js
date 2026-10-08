const jwt = require('jsonwebtoken');
const { queryOne } = require('../../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'nagar_connect_secure_jwt_secret_key_2026';

/**
 * Authentication Middleware:
 * Extracts JWT token from Authorization header or session cookie,
 * verifies signature, and attaches user record to request object.
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : (req.query.token || req.headers['x-access-token']);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required. Please sign in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await queryOne(`
      SELECT 
        u.id, u.full_name, u.email, u.phone, u.role_id,
        r.name as role_name, u.department_id, d.name as department_name,
        u.designation, u.employee_id, u.ward_number, u.is_active
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ? AND u.is_active = 1
    `, [decoded.id || decoded.userId]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session or user account deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Session expired or invalid authentication token.'
    });
  }
}

/**
 * Optional Authentication: Attaches user if token present, but does not block guests.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await queryOne(`
        SELECT u.id, u.full_name, u.email, u.role_id, r.name as role_name, u.department_id
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ? AND u.is_active = 1
      `, [decoded.id || decoded.userId]);
      if (user) req.user = user;
    } catch (e) {
      // Ignore invalid optional token
    }
  }

  next();
}

module.exports = {
  authenticateToken,
  optionalAuth,
  JWT_SECRET
};
