/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route access to authorized municipal roles.
 */
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for this resource.'
      });
    }

    const userRole = (req.user.role_name || req.user.role_id || '').replace('ROLE_', '').toUpperCase();
    const normalizedAllowed = allowedRoles.map(r => r.replace('ROLE_', '').toUpperCase());

    // Super Admin has universal access
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${userRole}`
      });
    }

    next();
  };
}

module.exports = { requireRoles };
