-- ====================================================================
-- NAGAR CONNECT - CENTRALIZED MUNICIPAL DATABASE SCHEMA
-- Version: 1.5.0 (Sequential Development up to Member 5 Central RAG)
-- ====================================================================

-- 1. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  module TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 2. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  head_officer_id TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  sla_hours_default INTEGER DEFAULT 48,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  role_id TEXT NOT NULL,
  department_id TEXT,
  designation TEXT,
  employee_id TEXT,
  ward_number TEXT,
  address TEXT,
  avatar_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 4. COMPLAINT CATEGORIES
CREATE TABLE IF NOT EXISTS complaint_categories (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  default_priority TEXT DEFAULT 'MEDIUM',
  sla_hours INTEGER DEFAULT 48,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 5. COMPLAINTS (CENTRALIZED ENTITY)
CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  tracking_id TEXT UNIQUE NOT NULL, -- e.g. NGC-2026-000001
  citizen_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  department_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_address TEXT NOT NULL,
  landmark TEXT,
  ward_number TEXT,
  latitude REAL,
  longitude REAL,
  priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'MEDIUM',
  status TEXT CHECK(status IN (
    'SUBMITTED',
    'UNDER_REVIEW',
    'ASSIGNED',
    'FIELD_VERIFICATION',
    'IN_PROGRESS',
    'RESOLUTION_SUBMITTED',
    'CITIZEN_VERIFICATION',
    'RESOLVED',
    'CLOSED',
    'REJECTED'
  )) DEFAULT 'SUBMITTED',
  sla_deadline DATETIME,
  is_escalated INTEGER DEFAULT 0,
  escalation_level INTEGER DEFAULT 0,
  resolution_summary TEXT,
  resolved_at DATETIME,
  closed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (citizen_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES complaint_categories(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 6. COMPLAINT STATUS HISTORY (AUDITABLE TIMELINE)
CREATE TABLE IF NOT EXISTS complaint_status_history (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by_user_id TEXT NOT NULL,
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
);

-- 7. COMPLAINT ASSIGNMENTS
CREATE TABLE IF NOT EXISTS complaint_assignments (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  assigned_by_user_id TEXT NOT NULL,
  assigned_to_user_id TEXT NOT NULL,
  assigned_role TEXT NOT NULL,
  instructions TEXT,
  target_completion_date DATETIME,
  status TEXT CHECK(status IN ('ACTIVE', 'COMPLETED', 'REASSIGNED', 'CANCELLED')) DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by_user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
);

-- 8. FIELD TASKS
CREATE TABLE IF NOT EXISTS field_tasks (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  assignment_id TEXT NOT NULL,
  field_staff_id TEXT NOT NULL,
  task_title TEXT NOT NULL,
  task_description TEXT,
  state TEXT CHECK(state IN (
    'ASSIGNED',
    'ACCEPTED',
    'ARRIVED',
    'IN_PROGRESS',
    'WORK_COMPLETED',
    'RESOLUTION_SUBMITTED',
    'CANNOT_RESOLVE',
    'NEEDS_ESCALATION'
  )) DEFAULT 'ASSIGNED',
  arrived_at DATETIME,
  started_at DATETIME,
  completed_at DATETIME,
  resolution_notes TEXT,
  cannot_resolve_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES complaint_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (field_staff_id) REFERENCES users(id)
);

-- 9. COMPLAINT EVIDENCE
CREATE TABLE IF NOT EXISTS complaint_evidence (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  field_task_id TEXT,
  uploaded_by_user_id TEXT NOT NULL,
  evidence_type TEXT CHECK(evidence_type IN ('INITIAL_PROOF', 'BEFORE_WORK', 'AFTER_WORK', 'OFFICER_INSPECTION', 'DOCUMENT')) NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  caption TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (field_task_id) REFERENCES field_tasks(id),
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);

-- 10. COMPLAINT COMMENTS / INTERNAL NOTES
CREATE TABLE IF NOT EXISTS complaint_comments (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  comment_type TEXT CHECK(comment_type IN ('PUBLIC_UPDATE', 'INTERNAL_OFFICER_NOTE', 'CITIZEN_REPLY', 'SYSTEM_NOTE')) DEFAULT 'PUBLIC_UPDATE',
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- 11. COMPLAINT FEEDBACK
CREATE TABLE IF NOT EXISTS complaint_feedback (
  id TEXT PRIMARY KEY,
  complaint_id TEXT UNIQUE NOT NULL,
  citizen_id TEXT NOT NULL,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  is_satisfied INTEGER DEFAULT 1,
  reopen_requested INTEGER DEFAULT 0,
  reopen_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (citizen_id) REFERENCES users(id)
);

-- 12. SLA RULES & ESCALATIONS
CREATE TABLE IF NOT EXISTS sla_rules (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL,
  category_id TEXT,
  priority TEXT NOT NULL,
  response_time_hours INTEGER NOT NULL,
  resolution_time_hours INTEGER NOT NULL,
  escalation_level_1_hours INTEGER NOT NULL,
  escalation_level_2_hours INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (category_id) REFERENCES complaint_categories(id)
);

CREATE TABLE IF NOT EXISTS escalations (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  escalation_level INTEGER NOT NULL,
  escalated_to_user_id TEXT,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (escalated_to_user_id) REFERENCES users(id)
);

-- 13. DOCUMENTS (MEMBER 5 CENTRAL RAG)
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT CHECK(file_type IN ('PDF', 'DOCX', 'TXT', 'MD')) NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  department_id TEXT,
  document_type TEXT NOT NULL, -- SOP, BYLAW, SLA_POLICY, CITIZEN_CHARTER, CIRCULAR, MANUAL, FAQ
  version TEXT DEFAULT '1.0',
  effective_date DATE,
  language TEXT DEFAULT 'en', -- en, te
  uploaded_by_user_id TEXT NOT NULL,
  page_count INTEGER DEFAULT 1,
  visibility TEXT CHECK(visibility IN (
    'PUBLIC',
    'INTERNAL_OFFICER',
    'FIELD_STAFF',
    'ADMIN_ONLY',
    'CONFIDENTIAL'
  )) DEFAULT 'PUBLIC',
  status TEXT CHECK(status IN ('INDEXING', 'ACTIVE', 'ARCHIVED', 'FAILED')) DEFAULT 'INDEXING',
  checksum TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);

-- 14. DOCUMENT CHUNKS (VECTOR / TEXT CHUNKS)
CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  section_title TEXT,
  page_number INTEGER DEFAULT 1,
  content TEXT NOT NULL,
  token_count INTEGER,
  visibility TEXT NOT NULL,
  department_id TEXT,
  embedding_json TEXT, -- Serialized dense vector embedding
  metadata_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 15. DOCUMENT VERSIONS
CREATE TABLE IF NOT EXISTS document_versions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  version_number TEXT NOT NULL,
  change_summary TEXT,
  file_path TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- 16. RAG QUERIES & RESPONSES (AUDITABLE QUERY LOGS)
CREATE TABLE IF NOT EXISTS rag_queries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_role TEXT NOT NULL,
  query_text TEXT NOT NULL,
  assistant_context TEXT, -- 'CITIZEN_SERVICE', 'OFFICER_OPERATIONS', 'FIELD_WORK', 'KNOWLEDGE_ADMIN', 'MUNICIPAL_INTEL'
  department_filter TEXT,
  visibility_scope TEXT NOT NULL,
  retrieved_chunk_count INTEGER DEFAULT 0,
  latency_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS rag_responses (
  id TEXT PRIMARY KEY,
  query_id TEXT NOT NULL,
  generated_answer TEXT NOT NULL,
  sources_json TEXT NOT NULL, -- [{ document_id, title, section, page, relevance }]
  provider_used TEXT NOT NULL, -- 'LocalProvider', 'DemoProvider', 'ExternalProvider'
  confidence_score REAL,
  was_fallback_refusal INTEGER DEFAULT 0,
  user_feedback_rating INTEGER, -- 1-5 stars if citizen/officer rates answer
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (query_id) REFERENCES rag_queries(id) ON DELETE CASCADE
);

-- 17. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK(type IN ('INFO', 'WARNING', 'SUCCESS', 'CRITICAL', 'ASSIGNMENT', 'SLA_ALERT')) DEFAULT 'INFO',
  related_entity_type TEXT, -- COMPLAINT, TASK, DOCUMENT, SLA
  related_entity_id TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 18. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL, -- LOGIN, COMPLAINT_CREATED, ASSIGNMENT, STATUS_CHANGE, EVIDENCE_UPLOAD, DOCUMENT_UPLOAD, RAG_QUERY, etc.
  entity_type TEXT,
  entity_id TEXT,
  details_json TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 19. MUNICIPAL NOTICES
CREATE TABLE IF NOT EXISTS municipal_notices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  department_id TEXT,
  priority TEXT DEFAULT 'NORMAL',
  is_active INTEGER DEFAULT 1,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 20. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  category TEXT DEFAULT 'GENERAL',
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR MAXIMUM QUERY EFFICIENCY
CREATE INDEX IF NOT EXISTS idx_complaints_citizen ON complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_dept ON complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_tracking ON complaints(tracking_id);
CREATE INDEX IF NOT EXISTS idx_field_tasks_staff ON field_tasks(field_staff_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_vis ON document_chunks(visibility);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at);
