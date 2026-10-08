// ============================================================
// NAGAR CONNECT - SHARED ASSIGNMENT & FIELD ROUTES
// ============================================================

const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateToken);

// List assignments (Officer, Admin, Commissioner)
router.get('/', requireRoles(ROLES.OFFICER, ROLES.FIELD_STAFF, ROLES.MUNICIPAL_ADMIN, ROLES.COMMISSIONER, ROLES.SUPER_ADMIN), assignmentController.getAssignments);

// My Field Tasks (Field Staff)
router.get('/my-tasks', requireRoles(ROLES.FIELD_STAFF, ROLES.SUPER_ADMIN), assignmentController.getMyTasks);

// Update Field Task Status (Field Staff)
router.post('/tasks/:taskId/status', requireRoles(ROLES.FIELD_STAFF, ROLES.SUPER_ADMIN), assignmentController.updateTaskStatus);

module.exports = router;
