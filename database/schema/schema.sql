-- ============================================================
-- NAGAR CONNECT - Centralized Municipal Database Schema
-- Shared single database for all 7 team members
-- ============================================================

-- 1. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL,
  permission_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 2. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  sla_hours INTEGER DEFAULT 48,
  head_officer_id TEXT,
  icon TEXT DEFAULT 'building',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  department_id TEXT,
  phone TEXT,
  ward_number TEXT,
  avatar TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 4. COMPLAINT CATEGORIES
CREATE TABLE IF NOT EXISTS complaint_categories (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  standard_sla_hours INTEGER DEFAULT 48,
  default_priority TEXT DEFAULT 'MEDIUM',
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- 5. COMPLAINTS (Single unified entity used by all portals)
CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  complaint_id TEXT UNIQUE NOT NULL, -- e.g. NGC-2026-000001
  citizen_id TEXT NOT NULL,
  department_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
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
  escalation_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (citizen_id) REFERENCES users(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (category_id) REFERENCES complaint_categories(id)
);

-- 6. COMPLAINT STATUS HISTORY
CREATE TABLE IF NOT EXISTS complaint_status_history (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
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
  role TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by_user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
);

-- 8. COMPLAINT COMMENTS & INTERNAL NOTES
CREATE TABLE IF NOT EXISTS complaint_comments (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  is_internal INTEGER DEFAULT 0, -- 1 for officer/staff internal notes, 0 for public/citizen visible
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 9. COMPLAINT EVIDENCE
CREATE TABLE IF NOT EXISTS complaint_evidence (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  field_task_id TEXT,
  uploaded_by_user_id TEXT NOT NULL,
  evidence_type TEXT CHECK(evidence_type IN ('CITIZEN_INITIAL', 'FIELD_BEFORE', 'FIELD_AFTER', 'DOCUMENT', 'OTHER')) DEFAULT 'CITIZEN_INITIAL',
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  caption TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);

-- 10. COMPLAINT FEEDBACK
CREATE TABLE IF NOT EXISTS complaint_feedback (
  id TEXT PRIMARY KEY,
  complaint_id TEXT UNIQUE NOT NULL,
  citizen_id TEXT NOT NULL,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comments TEXT,
  reopen_requested INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (citizen_id) REFERENCES users(id)
);

-- 11. FIELD TASKS
CREATE TABLE IF NOT EXISTS field_tasks (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  assigned_field_staff_id TEXT NOT NULL,
  assigned_by_officer_id TEXT NOT NULL,
  task_state TEXT CHECK(task_state IN (
    'ASSIGNED',
    'ACCEPTED',
    'ARRIVED',
    'IN_PROGRESS',
    'WORK_COMPLETED',
    'RESOLUTION_SUBMITTED',
    'CANNOT_RESOLVE',
    'NEEDS_ESCALATION'
  )) DEFAULT 'ASSIGNED',
  priority TEXT DEFAULT 'MEDIUM',
  notes TEXT,
  before_photo_url TEXT,
  after_photo_url TEXT,
  resolution_description TEXT,
  resolved_at DATETIME,
  cannot_resolve_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_field_staff_id) REFERENCES users(id),
  FOREIGN KEY (assigned_by_officer_id) REFERENCES users(id)
);

-- 12. SLA RULES & ESCALATIONS
CREATE TABLE IF NOT EXISTS sla_rules (
  id TEXT PRIMARY KEY,
  department_id TEXT,
  category_id TEXT,
  priority TEXT NOT NULL,
  sla_hours INTEGER NOT NULL,
  warning_threshold_percent INTEGER DEFAULT 75,
  escalation_role TEXT DEFAULT 'OFFICER',
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (category_id) REFERENCES complaint_categories(id)
);

CREATE TABLE IF NOT EXISTS escalations (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  escalated_by_user_id TEXT NOT NULL,
  escalated_to_role TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN',
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (escalated_by_user_id) REFERENCES users(id)
);

-- 13. DOCUMENTS & CHUNKS (MEMBER 5 RAG CORE)
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  document_id TEXT UNIQUE NOT NULL, -- e.g. DOC-GHMC-2026-001
  title TEXT NOT NULL,
  department TEXT NOT NULL, -- e.g. 'General Administration', 'Water Supply', 'Sanitation' or 'ALL'
  document_type TEXT NOT NULL, -- 'SOP', 'Policy', 'Citizen Charter', 'Safety Manual', 'FAQ', 'Bylaw'
  version TEXT DEFAULT '1.0',
  effective_date DATE,
  language TEXT DEFAULT 'English',
  uploaded_by TEXT NOT NULL,
  file_path TEXT,
  file_type TEXT,
  file_size INTEGER,
  visibility TEXT NOT NULL, -- JSON array string or comma separated: 'CITIZEN,OFFICER,FIELD_STAFF,MUNICIPAL_ADMIN,COMMISSIONER,KNOWLEDGE_ADMIN,SUPER_ADMIN' or 'PUBLIC'
  status TEXT CHECK(status IN ('INDEXED', 'PROCESSING', 'FAILED', 'ARCHIVED')) DEFAULT 'PROCESSING',
  total_chunks INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  chunk_id TEXT UNIQUE NOT NULL,
  document_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  page_number INTEGER DEFAULT 1,
  section TEXT,
  visibility TEXT NOT NULL,
  embedding_json TEXT, -- Serialized vector representation
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS document_versions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  version TEXT NOT NULL,
  changes_summary TEXT,
  file_path TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS rag_queries (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_role TEXT NOT NULL,
  query_text TEXT NOT NULL,
  department_filter TEXT,
  response_text TEXT NOT NULL,
  execution_time_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS rag_responses (
  id TEXT PRIMARY KEY,
  query_id TEXT NOT NULL,
  chunk_id TEXT NOT NULL,
  relevance_score REAL,
  citation_text TEXT,
  page_number INTEGER,
  section TEXT,
  FOREIGN KEY (query_id) REFERENCES rag_queries(id) ON DELETE CASCADE,
  FOREIGN KEY (chunk_id) REFERENCES document_chunks(id) ON DELETE CASCADE
);

-- 14. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'INFO',
  link_url TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 15. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details_json TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. MUNICIPAL NOTICES
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

-- 17. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
