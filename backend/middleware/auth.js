/**
 * Nagar Connect - Authentication & RBAC Middleware
 */
const jwt = require('jsonwebtoken');
const { get: dbGet } = require('../../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'nagar_connect_municipal_jwt_secret_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If no token, check if user payload is sent via custom headers for development or guest
    const devUserId = req.headers['x-dev-user-id'];
    if (devUserId) {
      dbGet('SELECT * FROM users WHERE id = ?', [devUserId])
        .then(user => {
          if (user) {
            req.user = {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              department_id: user.department_id,
              ward_number: user.ward_number
            };
            return next();
          }
          return res.status(401).json({ error: 'Unauthorized: User not found' });
        })
        .catch(() => res.status(401).json({ error: 'Unauthorized' }));
      return;
    }

    return res.status(401).json({ error: 'Unauthorized: Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden: Invalid or expired session token' });
    }
    req.user = user;
    next();
  });
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = { role: 'CITIZEN', id: 'ANONYMOUS_CITIZEN', name: 'Citizen Visitor' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = { role: 'CITIZEN', id: 'ANONYMOUS_CITIZEN', name: 'Citizen Visitor' };
    } else {
      req.user = user;
    }
    next();
  });
}

function requireRole(allowedRoles) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = (req.user.role || '').toUpperCase();
    if (userRole === 'SUPER_ADMIN' || rolesArray.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      error: `Access denied. Requires one of roles: [${rolesArray.join(', ')}]. Current role: ${userRole}`
    });
  };
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  optionalAuth,
  requireRole
};
