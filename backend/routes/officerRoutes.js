// ============================================================
// NAGAR CONNECT - DEPARTMENT OFFICER ROUTES (Member 3 Core)
// ============================================================

const express = require('express');
const router = express.Router();
const officerController = require('../controllers/officerController');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// Apply authentication & role protection:
// Accessible to OFFICER, MUNICIPAL_ADMIN, COMMISSIONER, SUPER_ADMIN
router.use(authenticateToken);
router.use(requireRoles(ROLES.OFFICER, ROLES.MUNICIPAL_ADMIN, ROLES.COMMISSIONER, ROLES.SUPER_ADMIN));

// Officer Dashboard Stats
router.get('/dashboard', officerController.getDashboard);

// Officer Complaint Queue (Table with filters, search, sorting)
router.get('/queue', officerController.getQueue);

// View Complaint Detail
router.get('/complaints/:id', officerController.getComplaintById);

// Officer Actions
router.post('/complaints/:id/status', officerController.updateStatus);
router.post('/complaints/:id/assign', officerController.assignFieldStaff);
router.post('/complaints/:id/reassign', officerController.reassignFieldStaff);
router.post('/complaints/:id/priority', officerController.changePriority);
router.post('/complaints/:id/notes', officerController.addComment);
router.post('/complaints/:id/escalate', officerController.escalate);
router.post('/complaints/:id/approve', officerController.approveResolution);

// Field Personnel Management
router.get('/field-staff', officerController.getFieldStaff);

module.exports = router;
