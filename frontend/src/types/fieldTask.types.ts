// =============================================================
// NAGAR CONNECT — MEMBER 4
// frontend/src/types/fieldTask.types.ts
// TypeScript types for Field Operations — extends existing types.
// =============================================================

// ─────────────────────────────────────────
// Enums — match backend constants exactly
// ─────────────────────────────────────────
export type FieldTaskStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'WORK_COMPLETED'
  | 'RESOLUTION_SUBMITTED'
  | 'CANNOT_RESOLVE'
  | 'NEEDS_ESCALATION';

export type EvidenceCategory =
  | 'BEFORE_PHOTO'
  | 'AFTER_PHOTO'
  | 'FIELD_DOCUMENT'
  | 'FIELD_NOTES'
  | 'OTHER';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'FIELD_VERIFICATION'
  | 'IN_PROGRESS'
  | 'RESOLUTION_SUBMITTED'
  | 'CITIZEN_VERIFICATION'
  | 'RESOLVED'
  | 'CLOSED'
  | 'ESCALATED';

// ─────────────────────────────────────────
// Core FieldTask entity
// ─────────────────────────────────────────
export interface FieldTask {
  id:                     string;
  complaint_id:           string;
  assignment_id:          string | null;
  field_staff_id:         string;
  assigned_by:            string;
  status:                 FieldTaskStatus;

  // Timestamps
  assigned_at:            string; // ISO 8601
  accepted_at:            string | null;
  arrived_at:             string | null;
  started_at:             string | null;
  completed_at:           string | null;
  resolution_submitted_at: string | null;
  sla_deadline:           string | null;

  // Work content
  work_notes:             string | null;
  work_description:       string | null;
  resolution_notes:       string | null;
  cannot_resolve_reason:  string | null;
  escalation_reason:      string | null;
  escalation_notes:       string | null;

  // Joined from complaints
  complaint_number:       string;
  complaint_title:        string;
  complaint_description:  string | null;
  complaint_priority:     ComplaintPriority;
  complaint_status:       ComplaintStatus;
  location_address:       string | null;
  location_landmark:      string | null;
  category_name:          string | null;
  department_name:        string | null;

  // Joined from users
  citizen_name:           string | null;
  citizen_phone:          string | null;
  staff_name:             string | null;
  staff_phone:            string | null;
  staff_employee_code:    string | null;
  officer_name:           string | null;

  created_at:             string;
  updated_at:             string;
}

// ─────────────────────────────────────────
// Field Task Status History (timeline event)
// ─────────────────────────────────────────
export interface FieldTaskStatusHistory {
  id:               string;
  field_task_id:    string;
  from_status:      FieldTaskStatus | null;
  to_status:        FieldTaskStatus;
  changed_by:       string;
  changed_by_name:  string;
  changed_by_role:  string;
  reason:           string | null;
  notes:            string | null;
  changed_at:       string;
}

// ─────────────────────────────────────────
// Evidence item
// ─────────────────────────────────────────
export interface EvidenceItem {
  id:               string;
  evidence_type:    string;
  evidence_category: EvidenceCategory | string;
  file_url:         string;
  file_name:        string;
  file_size:        number;
  mime_type:        string;
  uploaded_by:      string;
  created_at:       string;
  description:      string | null;
}

// ─────────────────────────────────────────
// Dashboard counts
// ─────────────────────────────────────────
export interface FieldDashboardCounts {
  today_count:         string; // Postgres bigint comes as string
  pending_count:       string;
  high_priority_count: string;
  in_progress_count:   string;
  completed_count:     string;
  overdue_count:       string;
  escalated_count:     string;
}

// ─────────────────────────────────────────
// Dashboard response
// ─────────────────────────────────────────
export interface FieldDashboardData {
  counts:          FieldDashboardCounts;
  todayTasks:      FieldTask[];
  pendingTasks:    FieldTask[];
  overdueTasks:    FieldTask[];
  inProgressTasks: FieldTask[];
}

// ─────────────────────────────────────────
// API payload shapes
// ─────────────────────────────────────────
export interface CompleteWorkPayload {
  workDescription: string;
  workNotes?:      string;
}

export interface SubmitResolutionPayload {
  resolutionNotes: string;
  workDescription?: string;
}

export interface CannotResolvePayload {
  cannotResolveReason: string;
}

export interface EscalatePayload {
  escalationReason: string;
  escalationNotes?: string;
}

export interface AssignFieldStaffPayload {
  fieldStaffId:  string;
  assignmentId?: string;
  slaDeadline?:  string;
}

export interface VerifyResolutionPayload {
  approved: boolean;
  remarks?: string;
}

// ─────────────────────────────────────────
// API generic response wrapper
// ─────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?:   T;
}
