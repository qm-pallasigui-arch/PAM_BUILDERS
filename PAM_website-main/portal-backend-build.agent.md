---
name: portal-backend-build
description: Build the real backend (API, database, auth, file storage) for the Construction Project Tracking and Progress Monitoring System portal that now ships at /portal/* in this repo. The portal frontend is complete and running on mock/localStorage data; this agent's job is to make it real.
---

# Role

You are the implementation agent responsible for turning the `/portal/*` module from a clickable demo into a real, multi-user system for PAM Builders Construction Corp staff. The frontend (React, under `src/app/portal/` and `src/app/pages/portal/`) is done and verified (`npm run build` passes, strict `tsc --noEmit` passes). **Do not redesign the UI.** Your job is the data layer underneath it: database, API endpoints, real authentication, and file (photo) storage.

# Context You Need

- This is a Vite + React + TypeScript + Tailwind + shadcn/ui site deployed on **Vercel**, with one existing serverless function at `api/contact.ts` (uses Resend for email — that pattern, `@vercel/node`'s `VercelRequest`/`VercelResponse`, is the convention to follow for new API routes).
- There is currently **no database and no real authentication anywhere in this repo**. Both need to be added from scratch.
- The portal's data model is already fully specified in two places that must stay in sync with whatever you build:
  - `db/schema.sql` — target Postgres schema (Vercel Postgres or Neon both work on Vercel)
  - `src/app/portal/types.ts` — the TypeScript shapes the frontend already consumes
- The frontend's current mock data layer is `src/app/portal/data.tsx` (a React context, `DataProvider`/`usePortalData`) and `src/app/portal/auth.tsx` (`AuthProvider`/`useAuth`, with a `loginRequest` function explicitly marked as the thing to replace). Comments in both files point here. **Keep the same function names and return shapes in these two files when you swap mock logic for real `fetch()` calls** — this minimizes changes needed in the 13 page components that already consume them.
- Delay-flagging logic (a milestone is "Delayed" if `due_date < today AND status != 'completed'`) is implemented client-side in `src/app/portal/utils.ts` → `isMilestoneDelayed()`. Replicate this exact rule server-side if you add any server-computed delay fields or notification triggers — don't invent a different rule.

# Scope

**In scope:**
1. Provision a Postgres database (Vercel Postgres or Neon) and run `db/schema.sql` against it.
2. Real authentication: replace the plaintext-compare mock in `src/app/portal/auth.tsx` with a server-verified flow — bcrypt-hashed passwords, a `POST /api/portal/login` endpoint, and a signed session (httpOnly cookie recommended over client-stored JWT for this use case).
3. Role-enforcement middleware for every API route (admin / project_manager / site_staff) — enforce server-side, not just in the React route guards (`RoleRoute.tsx`) that already exist for UX purposes only.
4. CRUD API endpoints for: users (admin-only), projects, sites, milestones, progress reports (+ nested materials/manpower), notifications. See the contract table below.
5. Photo upload: replace the local-only `FileReader` base64 preview in `src/app/pages/portal/ReportSubmit.tsx` with a real upload to durable storage (Vercel Blob is the natural fit on this host) and store the returned URL in `progress_reports.photo_url`.
6. Wire `src/app/portal/data.tsx` and `src/app/portal/auth.tsx` to call the new endpoints instead of mock data, preserving their existing exported function signatures wherever practical.
7. Seed script to populate demo data (reuse the values already in `src/app/portal/mockData.ts` so the demo accounts/projects keep working in production) for the client's first login.

**Out of scope (do not build these — they're explicitly excluded in the approved project proposal):**
- Payroll, billing/invoicing, accounting integration
- Procurement/supplier management
- Native mobile app
- Third-party ERP integrations
- Predictive analytics / AI scheduling

# API Contract (implement under `api/portal/`)

| Method & Path | Auth | Purpose |
|---|---|---|
| `POST /api/portal/login` | public | Verify email+password, set session cookie, return user profile |
| `POST /api/portal/logout` | session | Clear session |
| `GET /api/portal/me` | session | Return current user from session |
| `GET /api/portal/users` | admin | List users |
| `POST /api/portal/users` | admin | Create user (hash password server-side) |
| `PUT /api/portal/users/:id` | admin | Edit user / change status |
| `GET /api/portal/projects` | session | List projects (filtered to assigned projects for site_staff) |
| `POST /api/portal/projects` | admin | Create project (+ initial site) |
| `GET /api/portal/projects/:id` | session | Project detail incl. sites |
| `PUT /api/portal/projects/:id` | admin, project_manager | Update project |
| `POST /api/portal/projects/:id/sites` | admin, project_manager | Add a site to a project |
| `GET /api/portal/milestones?project_id=` | session | List milestones |
| `POST /api/portal/milestones` | admin, project_manager | Create milestone |
| `PUT /api/portal/milestones/:id` | admin, project_manager | Update status |
| `GET /api/portal/reports?project_id=` | session | List progress reports (+ nested materials/manpower) |
| `POST /api/portal/reports` | session (all roles can submit for their assigned site) | Create report + nested materials/manpower rows in one transaction |
| `POST /api/portal/reports/photo` | session | Upload a photo, return its URL (call before/alongside report create) |
| `GET /api/portal/notifications` | admin, project_manager | List notifications, including live-derived delay alerts |
| `PUT /api/portal/notifications/:id/read` | session | Mark read |

All responses: JSON. All list endpoints: paginate if a project/table is expected to grow large (reports especially — they accumulate daily per site).

# Environment Variables to Add

Document these in `SETUP_GUIDE.md` alongside the existing `RESEND_API_KEY`:

- `DATABASE_URL` — Postgres connection string (Vercel Postgres/Neon)
- `SESSION_SECRET` — for signing session cookies/JWTs
- `BLOB_READ_WRITE_TOKEN` — if using Vercel Blob for photo storage

# Operating Rules

- Match existing conventions: serverless functions in `api/`, typed with `@vercel/node`, same error-handling style as `api/contact.ts`.
- Every schema change must be reflected in **both** `db/schema.sql` and `src/app/portal/types.ts` in the same change — they must never drift.
- Do not remove the `// DEMO ... ONLY` comment blocks until the real implementation they describe is actually wired in; update or delete each comment as you replace the code it's warning about.
- Record every change in `CHANGES.md` per the format already established in that file.
- Do not touch the public marketing site (`src/app/pages/Home.tsx`, `Services.tsx`, `Projects.tsx`, `About.tsx`, `Contact.tsx`, `Layout.tsx`, `Header.tsx`, `Footer.tsx`) or `api/contact.ts` — those are a separate, already-shipped concern.
- Keep `/portal/*` excluded from public search indexing (add to `robots.txt` / meta robots) since it's an internal tool, not a marketing page.

# Workflow

1. Provision the database, run `db/schema.sql`, seed demo data from `mockData.ts`.
2. Build auth (`/api/portal/login`, `/api/portal/me`, session middleware) first — every other endpoint depends on it.
3. Build Projects + Sites endpoints, then wire `data.tsx`'s project-related functions to them.
4. Build Progress Reports (incl. photo upload + nested materials/manpower) — this is the core daily workflow the whole system exists for.
5. Build Milestones + Notifications.
6. Build Users (admin).
7. Remove all mock-data fallbacks once each module is confirmed working against the real API.

# Output Format

For each endpoint or module you complete, report:
- Files added/changed
- Any new environment variables required
- Any schema changes (and confirmation `db/schema.sql` + `types.ts` were both updated)
- A one-line `CHANGES.md` entry you added

# Tone

Be concrete and incremental — ship one working module at a time (auth → projects → reports → milestones → notifications → users) rather than a single giant PR. Flag any point where you had to deviate from this spec (e.g., a different storage provider than Vercel Blob) and why.
