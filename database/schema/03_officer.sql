-- ============================================================
-- NAGAR CONNECT - MUNICIPAL E-GOVERNANCE PLATFORM
-- Schema 03: Department Officer Management & Assignment
-- ============================================================

CREATE TABLE IF NOT EXISTS complaint_assignments (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  assigned_by_user_id TEXT NOT NULL,
  assigned_to_user_id TEXT NOT NULL,     -- Field staff or designated officer
  department_id TEXT NOT NULL,
  assignment_type TEXT DEFAULT 'FIELD_WORK', -- 'FIELD_WORK', 'VERIFICATION', 'SUPERVISION'
  status TEXT DEFAULT 'PENDING',         -- 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REASSIGNED', 'CANCELLED'
  instructions TEXT,
  priority TEXT DEFAULT 'MEDIUM',        -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  deadline DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by_user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS complaint_comments (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  comment_type TEXT NOT NULL,            -- 'INTERNAL_NOTE', 'CITIZEN_COMMUNICATION', 'CITIZEN_QUERY', 'FIELD_NOTE'
  message TEXT NOT NULL,
  is_internal INTEGER DEFAULT 1,         -- 1 for officer/field only, 0 if visible to citizen
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sla_rules (
  id TEXT PRIMARY KEY,
  department_id TEXT,
  category_id TEXT,
  priority TEXT NOT NULL,                -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  resolution_time_hours INTEGER NOT NULL,
  escalation_time_hours INTEGER NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (category_id) REFERENCES complaint_categories(id)
);

CREATE TABLE IF NOT EXISTS escalations (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  escalated_by_user_id TEXT NOT NULL,
  escalation_level TEXT NOT NULL,        -- 'L1_OFFICER', 'L2_COMMISSIONER', 'L3_ADMIN'
  reason TEXT NOT NULL,                  -- 'SLA_BREACH', 'TECHNICAL_COMPLEXITY', 'RESOURCE_SHORTAGE', 'PUBLIC_SAFETY', 'CITIZEN_REOPEN'
  notes TEXT,
  status TEXT DEFAULT 'OPEN',            -- 'OPEN', 'UNDER_INVESTIGATION', 'RESOLVED'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  resolved_by_user_id TEXT,
  resolution_remarks TEXT,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (escalated_by_user_id) REFERENCES users(id),
  FOREIGN KEY (resolved_by_user_id) REFERENCES users(id)
);

-- Contract ready for Member 4 Field Operations
CREATE TABLE IF NOT EXISTS field_tasks (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  assignment_id TEXT NOT NULL,
  field_staff_id TEXT NOT NULL,
  status TEXT DEFAULT 'ASSIGNED',        -- 'ASSIGNED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'WORK_COMPLETED', 'RESOLUTION_SUBMITTED', 'CANNOT_RESOLVE', 'NEEDS_ESCALATION'
  arrived_at DATETIME,
  completed_at DATETIME,
  work_description TEXT,
  field_notes TEXT,
  resolution_summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES complaint_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (field_staff_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_complaint ON complaint_assignments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON complaint_assignments(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_comments_complaint ON complaint_comments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_escalations_complaint ON escalations(complaint_id);
CREATE INDEX IF NOT EXISTS idx_field_tasks_complaint ON field_tasks(complaint_id);
CREATE INDEX IF NOT EXISTS idx_field_tasks_staff ON field_tasks(field_staff_id);
