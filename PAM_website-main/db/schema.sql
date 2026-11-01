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

ALTER TABLE projects ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'General';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS permits jsonb NOT NULL DEFAULT '[]';
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS correction_reason text;
CREATE TABLE IF NOT EXISTS website_content (id integer PRIMARY KEY CHECK(id=1), content jsonb NOT NULL);
INSERT INTO website_content VALUES(1,'{"projects":[{"id":"portfolio-1","title":"Riverside Luxury Home","description":"Custom 5,000 sq ft modern home with panoramic river views, featuring sustainable materials and smart home technology.","image":"https://images.unsplash.com/photo-1622015663319-e97e697503ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob21lJTIwZXh0ZXJpb3IlMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzc1Mzg2MTM1fDA&ixlib=rb-4.1.0&q=80&w=1080","category":"Residential","details":{"year":"2025","duration":"12 months","size":"5,000 sq ft"},"color":null,"order":0,"published":true,"linkedProjectId":null,"showClient":false,"showBudget":false,"showLocation":false},{"id":"portfolio-2","title":"Downtown Tech Office","description":"Modern 10,000 sq ft office space with open floor plan, collaborative areas, and state-of-the-art facilities.","image":"https://images.unsplash.com/photo-1703355685639-d558d1b0f63e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBpbnRlcmlvciUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NzUzMDM0NTl8MA&ixlib=rb-4.1.0&q=80&w=1080","category":"Commercial","details":{"year":"2025","duration":"8 months","size":"10,000 sq ft"},"color":null,"order":1,"published":true,"linkedProjectId":null,"showClient":false,"showBudget":false,"showLocation":false},{"id":"portfolio-3","title":"Gourmet Kitchen Remodel","description":"Complete kitchen transformation featuring custom cabinetry, quartz countertops, and professional-grade appliances.","image":"https://images.unsplash.com/photo-1772567732969-c1506edf80a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwcmVtb2RlbCUyMG1vZGVybnxlbnwxfHx8fDE3NzUzODYwMzN8MA&ixlib=rb-4.1.0&q=80&w=1080","category":"Renovation","details":{"year":"2026","duration":"3 months","size":"450 sq ft"},"color":null,"order":2,"published":true,"linkedProjectId":null,"showClient":false,"showBudget":false,"showLocation":false},{"id":"portfolio-4","title":"Spa-Inspired Bathroom","description":"Luxurious bathroom renovation with heated floors, rainfall shower, soaking tub, and custom tile work.","image":"https://images.unsplash.com/photo-1758448018619-4cbe2250b9ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMHJlbm92YXRpb24lMjBsdXh1cnl8ZW58MXx8fHwxNzc1Mzg2MDMzfDA&ixlib=rb-4.1.0&q=80&w=1080","category":"Renovation","details":{"year":"2026","duration":"2 months","size":"200 sq ft"},"color":null,"order":3,"published":true,"linkedProjectId":null,"showClient":false,"showBudget":false,"showLocation":false},{"id":"portfolio-5","title":"Boutique Retail Store","description":"High-end retail space with custom millwork, elegant lighting, and optimized customer flow.","image":"https://images.unsplash.com/photo-1759050486852-fdfe2fdc7bea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXRhaWwlMjBzdG9yZSUyMGludGVyaW9yJTIwZGVzaWdufGVufDF8fHx8MTc3NTM4NjEzNnww&ixlib=rb-4.1.0&q=80&w=1080","category":"Commercial","details":{"year":"2025","duration":"4 months","size":"2,500 sq ft"},"color":null,"order":4,"published":true,"linkedProjectId":null,"showClient":false,"showBudget":false,"showLocation":false},{"id":"portfolio-6","title":"Modern Family Residence","description":"Contemporary 3,800 sq ft home with open concept living, energy-efficient design, and premium finishes.","image":"https://images.unsplash.com/photo-1773558048595-0eb9c121f119?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXNpZGVudGlhbCUyMGhvbWUlMjBleHRlcmlvcnxlbnwxfHx8fDE3NzUzNzU0MjR8MA&ixlib=rb-4.1.0&q=80&w=1080","category":"Residential","details":{"year":"2025","duration":"10 months","size":"3,800 sq ft"},"color":null,"order":5,"published":true,"linkedProjectId":null,"showClient":false,"showBudget":false,"showLocation":false},{"id":"portfolio-7","title":"Urban Apartment Complex","description":"Multi-unit residential building with 24 luxury apartments, rooftop terrace, and modern amenities.","image":"https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwxfHx8fDE3NzUzMDI0ODh8MA&ixlib=rb-4.1.0&q=80&w=1080","category":"Commercial","details":{"year":"2024","duration":"18 months","size":"45,000 sq ft"},"color":null,"order":6,"published":true,"linkedProjectId":null,"showClient":false,"showBudget":false,"showLocation":false},{"id":"portfolio-8","title":"Historic Home Restoration","description":"Careful restoration of a 1920s craftsman home, preserving original character while modernizing systems.","image":"https://images.unsplash.com/photo-1770838773417-08b18661c62f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwcmVub3ZhdGlvbiUyMGludGVyaW9yfGVufDF8fHx8MTc3NTM4MTAxNnww&ixlib=rb-4.1.0&q=80&w=1080","category":"Renovation","details":{"year":"2025","duration":"7 months","size":"2,800 sq ft"},"color":null,"order":7,"published":true,"linkedProjectId":null,"showClient":false,"showBudget":false,"showLocation":false},{"id":"portfolio-9","title":"Corporate Headquarters","description":"Contemporary office building with sustainable design, collaborative workspaces, and wellness areas.","image":"https://images.unsplash.com/photo-1677324574457-645566fea332?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwYnVpbGRpbmclMjBvZmZpY2V8ZW58MXx8fHwxNzc1MzEyNTkyfDA&ixlib=rb-4.1.0&q=80&w=1080","category":"Commercial","details":{"year":"2024","duration":"14 months","size":"25,000 sq ft"},"color":null,"order":8,"published":true,"linkedProjectId":null,"showClient":false,"showBudget":false,"showLocation":false}],"categories":[{"name":"General","color":"#ea580c"},{"name":"Residential","color":"#2563eb"},{"name":"Commercial","color":"#7c3aed"},{"name":"Renovation","color":"#059669"}],"permitTemplates":[],"birUrl":""}') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS content_assets (id serial PRIMARY KEY, project_id integer REFERENCES projects(id), public boolean NOT NULL DEFAULT false, name text NOT NULL, content_type text NOT NULL, data bytea NOT NULL);

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
