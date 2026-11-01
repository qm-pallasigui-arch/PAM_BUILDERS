-- Backfill historical records as approved before applying the pending default.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending','approved','rejected'));
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending','approved','rejected'));
ALTER TABLE projects ALTER COLUMN approval_status SET DEFAULT 'pending';
ALTER TABLE progress_reports ALTER COLUMN approval_status SET DEFAULT 'pending';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS approval_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS approval_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id);
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS approval_events (
  id SERIAL PRIMARY KEY,
  resource TEXT NOT NULL CHECK (resource IN ('projects','reports')),
  record_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')),
  actor_id INTEGER NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
