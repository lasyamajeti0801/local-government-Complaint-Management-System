// ============================================================
// NAGAR CONNECT - CITIZEN ROUTES
// ============================================================

const express = require('express');
const router = express.Router();
const citizenController = require('../controllers/citizenController');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// Public metadata endpoints
router.get('/departments', citizenController.getDepartments);
router.get('/categories', citizenController.getCategories);

// Citizen protected endpoints (Accessible to all authenticated users as municipal citizens)
router.use(authenticateToken);
router.get('/complaints', requireRoles(ROLES.CITIZEN, ROLES.OFFICER, ROLES.COMMISSIONER, ROLES.FIELD_STAFF, ROLES.MUNICIPAL_ADMIN, ROLES.SUPER_ADMIN), citizenController.getMyComplaints);
router.post('/complaints', requireRoles(ROLES.CITIZEN, ROLES.OFFICER, ROLES.COMMISSIONER, ROLES.FIELD_STAFF, ROLES.MUNICIPAL_ADMIN, ROLES.SUPER_ADMIN), citizenController.createComplaint);
router.get('/complaints/:id', citizenController.getComplaintById);
router.post('/complaints/:id/feedback', requireRoles(ROLES.CITIZEN, ROLES.OFFICER, ROLES.COMMISSIONER, ROLES.FIELD_STAFF, ROLES.MUNICIPAL_ADMIN, ROLES.SUPER_ADMIN), citizenController.submitFeedback);

module.exports = router;
