-- PAM Builders Construction Project Tracking and Progress Monitoring System
-- Portal backend schema — Postgres dialect (Vercel Postgres / Neon compatible).
--
-- This is the target schema for the real backend described in
-- .github/agents/portal-backend-build.agent.md. It mirrors the TypeScript
-- types in src/app/portal/types.ts and the demo shape in
-- src/app/portal/mockData.ts — keep all three in sync when either changes.

CREATE TYPE user_role AS ENUM ('admin', 'project_manager', 'site_staff');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE project_status AS ENUM ('ongoing', 'on_hold', 'completed');
CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'completed');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  client VARCHAR(200),
  location VARCHAR(200),
  start_date DATE,
  end_date DATE,
  budget NUMERIC(14, 2) DEFAULT 0,
  status project_status NOT NULL DEFAULT 'ongoing',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_assignments (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE TABLE sites (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  address VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE milestones (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status milestone_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Delay is computed at query/UI time as (due_date < current_date AND status != 'completed').
-- Do not add a "delayed" column — see isMilestoneDelayed() in src/app/portal/utils.ts for the
-- single source of truth the frontend already uses; replicate that exact rule server-side.

CREATE TABLE progress_reports (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  site_id INTEGER REFERENCES sites(id) ON DELETE SET NULL,
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  report_date DATE NOT NULL,
  description TEXT,
  percent_complete SMALLINT DEFAULT 0 CHECK (percent_complete BETWEEN 0 AND 100),
  photo_url VARCHAR(500), -- Vercel Blob (or equivalent) URL, NOT a base64 data URL
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE materials_log (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES progress_reports(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  material_name VARCHAR(150) NOT NULL,
  quantity NUMERIC(12, 2) NOT NULL,
  unit VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE manpower_log (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES progress_reports(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  worker_name VARCHAR(150) NOT NULL,
  position VARCHAR(100),
  hours_worked NUMERIC(5, 2) DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- NULL = broadcast to admins/PMs
  message VARCHAR(255) NOT NULL,
  type VARCHAR(30) DEFAULT 'info',
  ref_type VARCHAR(30),
  ref_id INTEGER,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sites_project ON sites(project_id);
CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_reports_project ON progress_reports(project_id);
CREATE INDEX idx_materials_report ON materials_log(report_id);
CREATE INDEX idx_manpower_report ON manpower_log(report_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Apply after the original portal schema, once, using npm run db:migrate.
CREATE UNIQUE INDEX users_email_lower_unique ON users(lower(email));
CREATE TABLE portal_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_sessions_user ON portal_sessions(user_id);
CREATE TABLE login_attempts (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE notification_reads (
  notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(notification_id, user_id)
);
CREATE TABLE photo_uploads (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  blob_url VARCHAR(500) NOT NULL UNIQUE,
  content_type VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE materials_log ADD CONSTRAINT materials_quantity_nonnegative CHECK (quantity >= 0);
ALTER TABLE manpower_log ADD CONSTRAINT manpower_hours_valid CHECK (hours_worked BETWEEN 0 AND 24);
CREATE INDEX idx_assignments_user ON project_assignments(user_id, project_id);
CREATE INDEX idx_reports_project_date ON progress_reports(project_id, report_date DESC, id DESC);

CREATE TABLE IF NOT EXISTS portal_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
