// ============================================================
// NAGAR CONNECT - AUTHENTICATION & RBAC MIDDLEWARE
// ============================================================

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const db = require('../config/db');

// Verify Bearer JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : (req.query.token || null);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in with municipal credentials.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch fresh user state from database
    const user = db.get(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.department_id, u.employee_id,
             u.designation, u.ward_number, u.is_active, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ? AND u.is_active = 1
    `, [decoded.id]);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User session is invalid or account has been deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Session expired or token is invalid. Please log in again.'
    });
  }
}

// Require one of allowed roles
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    // SUPER_ADMIN has access to all routes
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Your role (${req.user.role}) is not authorized to access this municipal endpoint. Required: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRoles
};
