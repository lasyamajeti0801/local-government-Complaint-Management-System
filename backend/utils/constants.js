// =============================================================
// NAGAR CONNECT — MEMBER 4
// backend/utils/constants.js
// Shared constants — extends M1 constants file if it already exists.
// If M1 has a constants file, MERGE these exports into it instead.
// =============================================================

// ─────────────────────────────────────────
// ROLES  (defined by Member 1 — listed here for reference)
// ─────────────────────────────────────────
const ROLES = {
  CITIZEN:         'CITIZEN',
  OFFICER:         'OFFICER',
  FIELD_STAFF:     'FIELD_STAFF',
  MUNICIPAL_ADMIN: 'MUNICIPAL_ADMIN',
  COMMISSIONER:    'COMMISSIONER',
  KNOWLEDGE_ADMIN: 'KNOWLEDGE_ADMIN',
  SUPER_ADMIN:     'SUPER_ADMIN',
};

// ─────────────────────────────────────────
// FIELD TASK STATUSES  (Member 4)
// ─────────────────────────────────────────
const FIELD_TASK_STATUS = {
  ASSIGNED:             'ASSIGNED',
  ACCEPTED:             'ACCEPTED',
  ARRIVED:              'ARRIVED',
  IN_PROGRESS:          'IN_PROGRESS',
  WORK_COMPLETED:       'WORK_COMPLETED',
  RESOLUTION_SUBMITTED: 'RESOLUTION_SUBMITTED',
  CANNOT_RESOLVE:       'CANNOT_RESOLVE',
  NEEDS_ESCALATION:     'NEEDS_ESCALATION',
};

// ─────────────────────────────────────────
// COMPLAINT STATUSES  (shared lifecycle)
// ─────────────────────────────────────────
const COMPLAINT_STATUS = {
  SUBMITTED:            'SUBMITTED',
  UNDER_REVIEW:         'UNDER_REVIEW',
  ASSIGNED:             'ASSIGNED',
  FIELD_VERIFICATION:   'FIELD_VERIFICATION',
  IN_PROGRESS:          'IN_PROGRESS',
  RESOLUTION_SUBMITTED: 'RESOLUTION_SUBMITTED',
  CITIZEN_VERIFICATION: 'CITIZEN_VERIFICATION',
  RESOLVED:             'RESOLVED',
  CLOSED:               'CLOSED',
  ESCALATED:            'ESCALATED',
  REOPENED:             'REOPENED',
};

// ─────────────────────────────────────────
// EVIDENCE CATEGORIES  (Member 4)
// ─────────────────────────────────────────
const EVIDENCE_CATEGORY = {
  GENERAL:        'GENERAL',
  BEFORE_PHOTO:   'BEFORE_PHOTO',
  AFTER_PHOTO:    'AFTER_PHOTO',
  FIELD_DOCUMENT: 'FIELD_DOCUMENT',
  FIELD_NOTES:    'FIELD_NOTES',
  CITIZEN_UPLOAD: 'CITIZEN_UPLOAD',
  OTHER:          'OTHER',
};

// ─────────────────────────────────────────
// PRIORITIES  (from M2/M3 — referenced here)
// ─────────────────────────────────────────
const COMPLAINT_PRIORITY = {
  LOW:      'LOW',
  MEDIUM:   'MEDIUM',
  HIGH:     'HIGH',
  CRITICAL: 'CRITICAL',
};

// ─────────────────────────────────────────
// NOTIFICATION TYPES  (Member 4 additions)
// ─────────────────────────────────────────
const NOTIFICATION_TYPE = {
  FIELD_TASK_ASSIGNED:  'FIELD_TASK_ASSIGNED',
  FIELD_TASK_ACCEPTED:  'FIELD_TASK_ACCEPTED',
  FIELD_TASK_STARTED:   'FIELD_TASK_STARTED',
  RESOLUTION_SUBMITTED: 'RESOLUTION_SUBMITTED',
  RESOLUTION_APPROVED:  'RESOLUTION_APPROVED',
  RESOLUTION_REJECTED:  'RESOLUTION_REJECTED',
  ESCALATION_CREATED:   'ESCALATION_CREATED',
  CANNOT_RESOLVE:       'CANNOT_RESOLVE',
};

module.exports = {
  ROLES,
  FIELD_TASK_STATUS,
  COMPLAINT_STATUS,
  EVIDENCE_CATEGORY,
  COMPLAINT_PRIORITY,
  NOTIFICATION_TYPE,
};
