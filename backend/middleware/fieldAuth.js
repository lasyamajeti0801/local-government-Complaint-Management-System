// =============================================================
// NAGAR CONNECT — MEMBER 4
// backend/middleware/fieldAuth.js
// Role-based authorization middleware for Field Operations.
// Extends M1 authentication middleware — does NOT replace it.
//
// Usage:
//   router.get('/tasks', authenticate, requireFieldStaff, handler)
//   router.post('/assign', authenticate, requireOfficerOrAbove, handler)
// =============================================================

const { ROLES } = require('../utils/constants'); // M1 shared constants

// ─────────────────────────────────────────
// requireFieldStaff
// Only FIELD_STAFF role can access this endpoint
// ─────────────────────────────────────────
function requireFieldStaff(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (req.user.role !== ROLES.FIELD_STAFF) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Field Staff role required.',
    });
  }
  next();
}

// ─────────────────────────────────────────
// requireOfficerOrAbove
// OFFICER, MUNICIPAL_ADMIN, COMMISSIONER, SUPER_ADMIN
// ─────────────────────────────────────────
function requireOfficerOrAbove(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  const allowed = [
    ROLES.OFFICER,
    ROLES.MUNICIPAL_ADMIN,
    ROLES.COMMISSIONER,
    ROLES.SUPER_ADMIN,
  ];
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Officer or above required.',
    });
  }
  next();
}

// ─────────────────────────────────────────
// requireFieldOrOfficer
// Used for endpoints that both field staff and officers need to read
// e.g. task details, evidence
// ─────────────────────────────────────────
function requireFieldOrOfficer(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  const allowed = [
    ROLES.FIELD_STAFF,
    ROLES.OFFICER,
    ROLES.MUNICIPAL_ADMIN,
    ROLES.COMMISSIONER,
    ROLES.SUPER_ADMIN,
  ];
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied.',
    });
  }
  next();
}

// ─────────────────────────────────────────
// requireAdminOrAbove
// MUNICIPAL_ADMIN, COMMISSIONER, SUPER_ADMIN
// ─────────────────────────────────────────
function requireAdminOrAbove(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  const allowed = [ROLES.MUNICIPAL_ADMIN, ROLES.COMMISSIONER, ROLES.SUPER_ADMIN];
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  next();
}

module.exports = {
  requireFieldStaff,
  requireOfficerOrAbove,
  requireFieldOrOfficer,
  requireAdminOrAbove,
};
