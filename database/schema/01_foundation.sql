-- ============================================================
-- NAGAR CONNECT - MUNICIPAL E-GOVERNANCE PLATFORM
-- Schema 01: Foundation, RBAC, Users, Departments
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  contact_email TEXT,
  helpline TEXT,
  head_officer_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
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

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  department_id TEXT,
  employee_id TEXT UNIQUE,
  designation TEXT,
  ward_number TEXT,
  is_active INTEGER DEFAULT 1,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role) REFERENCES roles(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'INFO', -- 'INFO', 'SUCCESS', 'WARNING', 'ESCALATION', 'ASSIGNMENT'
  reference_type TEXT,      -- 'COMPLAINT', 'TASK', 'SLA', 'SYSTEM'
  reference_id TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,     -- 'LOGIN', 'COMPLAINT_CREATED', 'ASSIGNED', 'STATUS_CHANGE', etc.
  entity_type TEXT NOT NULL,-- 'COMPLAINT', 'USER', 'ASSIGNMENT', 'SLA'
  entity_id TEXT,
  details TEXT,             -- JSON string with state diff or context
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  category TEXT DEFAULT 'GENERAL',
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS municipal_notices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  department_id TEXT,
  content TEXT NOT NULL,
  severity TEXT DEFAULT 'NORMAL', -- 'NORMAL', 'URGENT', 'CRITICAL'
  start_date DATE,
  end_date DATE,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);
