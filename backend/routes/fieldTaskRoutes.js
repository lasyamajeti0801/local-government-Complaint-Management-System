// =============================================================
// NAGAR CONNECT — MEMBER 4
// backend/routes/fieldTaskRoutes.js
// Registers all Member 4 API endpoints.
// Plugs into the existing Express app via:
//   app.use('/api', fieldTaskRoutes);
// =============================================================

const express    = require('express');
const router     = express.Router();

// M1 authentication middleware (reused, not replaced)
const { authenticate } = require('../middleware/auth');

// M4 authorization middleware
const {
  requireFieldStaff,
  requireOfficerOrAbove,
  requireFieldOrOfficer,
} = require('../middleware/fieldAuth');

// M4 file upload middleware
const { uploadEvidence } = require('../middleware/fileUpload');

// M4 controller
const ctrl = require('../controllers/fieldTaskController');

// ─────────────────────────────────────────
// FIELD STAFF ROUTES  (FIELD_STAFF only)
// Prefix: /api/field
// ─────────────────────────────────────────

/** Dashboard summary counts + task lists */
router.get(
  '/field/dashboard',
  authenticate,
  requireFieldStaff,
  ctrl.getDashboard
);

/** List tasks with filters (status, priority, search, todayOnly, overdueOnly) */
router.get(
  '/field/tasks',
  authenticate,
  requireFieldStaff,
  ctrl.listTasks
);

/** Full task details */
router.get(
  '/field/tasks/:taskId',
  authenticate,
  requireFieldOrOfficer,      // officer also needs to read task
  ctrl.getTaskDetail
);

/** Status history / timeline for a task */
router.get(
  '/field/tasks/:taskId/history',
  authenticate,
  requireFieldOrOfficer,
  ctrl.getTaskHistory
);

/** Evidence list for a task */
router.get(
  '/field/tasks/:taskId/evidence',
  authenticate,
  requireFieldOrOfficer,
  ctrl.getEvidence
);

// ─── Lifecycle actions (Field Staff only) ────────────────────

/** Accept an assigned task */
router.post(
  '/field/tasks/:taskId/accept',
  authenticate,
  requireFieldStaff,
  ctrl.acceptTask
);

/** Mark arrived at location */
router.post(
  '/field/tasks/:taskId/arrive',
  authenticate,
  requireFieldStaff,
  ctrl.markArrived
);

/** Start field work */
router.post(
  '/field/tasks/:taskId/start',
  authenticate,
  requireFieldStaff,
  ctrl.startWork
);

/** Add work notes (no status change) */
router.post(
  '/field/tasks/:taskId/notes',
  authenticate,
  requireFieldStaff,
  ctrl.addWorkNotes
);

/** Mark work completed (requires work description) */
router.post(
  '/field/tasks/:taskId/complete',
  authenticate,
  requireFieldStaff,
  ctrl.completeWork
);

/** Upload evidence (before/after photo, document, field notes) */
router.post(
  '/field/tasks/:taskId/evidence',
  authenticate,
  requireFieldStaff,
  uploadEvidence,              // multer middleware
  ctrl.uploadEvidence
);

/** Submit resolution for officer review */
router.post(
  '/field/tasks/:taskId/submit-resolution',
  authenticate,
  requireFieldStaff,
  ctrl.submitResolution
);

/** Cannot resolve */
router.post(
  '/field/tasks/:taskId/cannot-resolve',
  authenticate,
  requireFieldStaff,
  ctrl.cannotResolve
);

/** Request escalation */
router.post(
  '/field/tasks/:taskId/escalate',
  authenticate,
  requireFieldStaff,
  ctrl.escalateTask
);

// ─────────────────────────────────────────
// OFFICER ROUTES — extend M3 complaint routes
// Prefix: /api/officer
// ─────────────────────────────────────────

/** Assign field staff to a complaint (creates field task) */
router.post(
  '/officer/complaints/:complaintId/assign-field-staff',
  authenticate,
  requireOfficerOrAbove,
  ctrl.assignFieldStaff
);

/** See all field tasks for a complaint */
router.get(
  '/officer/complaints/:complaintId/field-tasks',
  authenticate,
  requireOfficerOrAbove,
  ctrl.getComplaintFieldTasks
);

/** Officer verifies or rejects a field resolution */
router.post(
  '/officer/tasks/:taskId/verify-resolution',
  authenticate,
  requireOfficerOrAbove,
  ctrl.verifyResolution
);

module.exports = router;
