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
