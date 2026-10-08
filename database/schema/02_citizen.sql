-- ============================================================
-- NAGAR CONNECT - MUNICIPAL E-GOVERNANCE PLATFORM
-- Schema 02: Citizen Complaint Management
-- ============================================================

CREATE TABLE IF NOT EXISTS complaint_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department_id TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  default_priority TEXT DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  default_sla_hours INTEGER DEFAULT 72,
  description TEXT,
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  complaint_number TEXT NOT NULL UNIQUE, -- e.g. NGC-2026-000001
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
  priority TEXT DEFAULT 'MEDIUM',        -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  status TEXT DEFAULT 'SUBMITTED',       -- 'SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'FIELD_VERIFICATION', 'IN_PROGRESS', 'RESOLUTION_SUBMITTED', 'CITIZEN_VERIFICATION', 'RESOLVED', 'CLOSED', 'REJECTED'
  sla_deadline DATETIME,
  sla_status TEXT DEFAULT 'ON_TRACK',    -- 'ON_TRACK', 'APPROACHING_DEADLINE', 'OVERDUE', 'BREACHED'
  is_escalated INTEGER DEFAULT 0,
  escalation_level TEXT DEFAULT 'NONE',  -- 'NONE', 'L1_OFFICER', 'L2_COMMISSIONER', 'L3_ADMIN'
  resolution_summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  closed_at DATETIME,
  FOREIGN KEY (citizen_id) REFERENCES users(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (category_id) REFERENCES complaint_categories(id)
);

CREATE TABLE IF NOT EXISTS complaint_status_history (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by_user_id TEXT NOT NULL,
  action TEXT NOT NULL,                  -- 'SUBMITTED', 'REVIEWED', 'ASSIGNED', 'STATUS_UPDATED', 'ESCALATED', 'RESOLVED', 'CLOSED'
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS complaint_evidence (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  uploaded_by_user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'IMAGE',        -- 'IMAGE', 'VIDEO', 'DOCUMENT'
  stage TEXT DEFAULT 'INITIAL',          -- 'INITIAL', 'FIELD_BEFORE', 'FIELD_AFTER', 'RESOLUTION'
  file_size_bytes INTEGER,
  caption TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS complaint_feedback (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL UNIQUE,
  citizen_id TEXT NOT NULL,
  rating INTEGER NOT NULL,               -- 1 to 5 stars
  comment TEXT,
  reopened INTEGER DEFAULT 0,
  reopen_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (citizen_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_complaints_citizen ON complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_dept ON complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_sla ON complaints(sla_status);
CREATE INDEX IF NOT EXISTS idx_status_history_complaint ON complaint_status_history(complaint_id);
