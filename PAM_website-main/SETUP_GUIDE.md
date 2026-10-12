# 🚀 Production Setup Guide

Follow these steps in order. Each one is required before your site goes live.

## Internal portal backend setup (2026-10-06)

The portal now requires its API and database. There is no browser mock-data fallback.
Hosted resources have not been created or deployed by this change. Complete the following setup before using `/portal/login`.

### 1. Create the database and private photo store

1. Create a Neon Postgres database, either directly in Neon or through the Vercel project's Storage integrations. Use separate databases/branches for development, preview, and production. Copy its pooled Postgres connection string with TLS enabled into `DATABASE_URL`.
2. In the Vercel project's Storage tab, create a **private** Blob store and connect it to the appropriate environment. Its token is `BLOB_READ_WRITE_TOKEN`. The implementation uses private uploads and an authenticated photo read endpoint; a public Blob store is incompatible with this configuration. See [Vercel private storage](https://vercel.com/docs/vercel-blob/private-storage).
3. Use Node.js 22 or later. Copy `.env.example` to `.env` for local commands, then fill in the real values. Never prefix these secrets with `VITE_` or commit them.
4. Generate a session secret using `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`. Store the output as `SESSION_SECRET` locally and in Vercel. Use the same secret on instances of one environment; use a different secret in each environment.

| Variable | Used for |
| --- | --- |
| `DATABASE_URL` | TLS Postgres connection string, including database name and credentials |
| `SESSION_SECRET` | Random signing secret, at least 32 characters |
| `BLOB_READ_WRITE_TOKEN` | Server-only token for a private Vercel Blob store |
| `SEED_ADMIN_PASSWORD`, `SEED_PM_PASSWORD`, `SEED_STAFF_PASSWORD` | Initial seed passwords, at least 12 characters and at most 72 UTF-8 bytes; only needed when running the seed |
| `RESEND_API_KEY`, `RECEIVING_EMAIL`, `FROM_EMAIL`, `FROM_NAME` | Existing contact form configuration, separate from portal authentication |

### 2. Apply the schema and seed

Run these commands from `PAM_website-main` after configuring `.env`:

```powershell
npm ci
npm run db:migrate
npm run db:seed
```

The migration runner applies the complete `db/schema.sql` to an empty database, or `db/migrations/002_portal_backend.sql` to the original portal schema. It uses a transaction, an advisory lock, and a migration ledger; rerunning it does not recreate tables or erase data. Do not also run `schema.sql` manually on an already initialized database.

The seed imports the existing mock fixtures, hashes all passwords, creates the demo projects/sites/milestones/reports, and assigns the three demo users to all demo projects. It refuses to overwrite a database with existing users. Log in with `admin@pambuilders.com`, `pm@pambuilders.com`, or `site@pambuilders.com` using the corresponding password you configured.

For a disposable demo only, `npm run db:seed -- --allow-demo-passwords` explicitly permits the original fixture passwords (`admin123`, `pm123`, `site123`). The default seed requires your own passwords. Demo credentials are no longer displayed on the login screen or imported into the production browser bundle.

### 3. Run locally

Use two terminals:

```powershell
# Terminal 1: server API, reads .env
npm run dev:api

# Terminal 2: frontend, proxies portal API calls to port 3001
npm run dev
```

Open the Vite URL and navigate to `/portal/login`. Vite alone cannot serve the backend. The local API adapter is for development; Vercel runs `api/portal/index.ts` in deployment. API writes require an Origin header matching the request Host and `Content-Type: application/json`.

### 4. Deploy and verify

Set the Vercel project root to `PAM_website-main` if this folder is nested in your repository. The build is `npm run build`, the output directory is `dist`, and `vercel.json` explicitly uses `npm ci` with `package-lock.json`. The older pnpm lockfile is not used by this deployment; use npm for this change.

Configure the three required backend variables in Vercel before deploying. Run migrations and the seed against the intended environment's database from your local setup. Deploy only after that succeeds. The portal API paths are rewritten to a single serverless dispatcher, so this adds one function rather than one function per contract route.

Verify login/logout and session restoration, create a user, assign that user to a project using **Manage project**, then submit a report containing materials, manpower, and a JPEG/PNG/WebP photo of at most 3 MB. Reload the page and view the saved photo. Confirm a second user without assignment cannot access that project's reports or photos. Test this against the hosted deployment; local tests do not establish that Vercel credentials or routing are configured correctly.

### Access and API behavior

- Admins manage users and project assignments. Admins and project managers can read all projects, edit projects, add sites, and manage milestones. Site staff can read only assigned projects. Every role must be assigned to a project to submit a report or upload a photo there.
- The existing schema assigns users at the **project** level. Assignment covers all sites in that project; the API additionally validates the selected site's project. Separate site-level assignments are not part of this schema.
- Passwords are bcrypt hashed. Sessions expire after eight hours and are revocable in Postgres. Logout, password changes, role changes, and deactivation invalidate sessions. Production cookies are Secure, HttpOnly, and SameSite=Strict. Login throttling is persistent across function instances.
- List responses are `{ items, nextCursor }`, with `limit` (1–100) and `after` cursor parameters. Project lists also include `sites`; notifications include `delayAlerts` on the first page. `project_id` filters milestones and reports. Existing frontend contexts follow every page to preserve dashboard totals; very large histories will eventually benefit from page-specific queries and server aggregates.
- Request bodies use the camelCase frontend fields. Project creation also accepts `siteName`, `siteAddress`, and optional `assignedUserIds`; project updates accept `assignedUserIds` for admins. User writes accept `name`, `email`, `role`, `status`, and `password` (optional on update). Report submission ignores caller-supplied author fields.
- `POST /api/portal/reports/photo` accepts `{ projectId, siteId, contentType, data }`, where `data` is base64 file content. It returns `{ url }`; pass that URL as `photoDataUrl` when creating the report. The database stores the private Blob URL in `photo_url`. Report responses keep the legacy `photoDataUrl` property but return `/api/portal/reports/:id/photo`, which authorizes each image request. The added image read route returns image bytes; other endpoints return JSON.
- Due dates use the same rule in UI and API: `due_date < today AND status != 'completed'`, with today consistently evaluated in Asia/Manila. Delay alerts are derived live and disappear when resolved. Stored notifications have per-user read receipts; marking a broadcast read does not mark it read for colleagues.
- There are no DELETE routes in the supplied API contract. Users are deactivated, and projects are placed on hold or completed.
- `/portal` and the portal API are excluded by robots.txt and noindex response headers. These are indexing controls; API authentication remains the access control.

### Validation and maintenance

```powershell
npm run typecheck
npm test
npm run build
```

The test suite runs the actual SQL schema and handlers against embedded PostgreSQL (PGlite). It covers role/assignment boundaries, signed sessions and revocation, CSRF rejection, pagination, report rollback, validation, migration compatibility, notifications, and photo ownership. Blob transport is simulated; live Neon connections, seeding against the hosted database, Vercel routing, and real Blob uploads must be checked after provisioning.

Periodically delete expired rows from `portal_sessions` and `login_attempts`, and review unreferenced `photo_uploads` older than your retention window (for abandoned report forms). Delete abandoned objects from Blob before removing their upload records. This change does not install a scheduled cleanup job. Preserve database backups before applying future migrations.

Dependency installation reported 26 audit findings in the full dependency tree, including one critical finding. This backend implementation does not perform broad upgrades to the existing marketing site's dependency stack; review `npm audit` before production rollout.

### Implementation record by module

All entries below are also recorded individually in `CHANGES.md`. Database additions are mirrored in `src/app/portal/types.ts` and included in the upgrade migration.

| Module | Main files | Environment/schema |
| --- | --- | --- |
| Auth | `server/portal/security.ts`, `handler.ts`, `src/app/portal/auth.tsx` | `DATABASE_URL`, `SESSION_SECRET`; sessions and login attempts |
| Projects/sites | `server/portal/queries.ts`, `handler.ts`, `src/app/portal/data.tsx`, `ProjectControls.tsx` | Existing assignments/sites; assignment lookup index |
| Reports/photos | `handler.ts`, `validation.ts`, `ReportSubmit.tsx`, `ReportsList.tsx`, `ProjectDetail.tsx` | `BLOB_READ_WRITE_TOKEN`; upload ownership table and numeric constraints |
| Milestones/notifications | `handler.ts`, `utils.ts`, `Milestones.tsx`, `Notifications.tsx` | Read receipt table; live delay query |
| Users | `handler.ts`, `UsersAdmin.tsx`, `PortalLogin.tsx` | Case-insensitive email uniqueness |
| Setup/testing | `scripts/*`, `tests/portal.test.ts`, `.env.example`, `vercel.json`, `tsconfig.json` | Migration ledger; no hosted resources provisioned |

---

## Step 1 — Fill In Your Business Info

Search the codebase for `// REPLACE` comments. Each one tells you exactly what to update.

Key files to update:
- `src/app/components/Header.tsx` — business name in logo
- `src/app/components/Footer.tsx` — name, address, phone, email, social links
- `src/app/pages/Contact.tsx` — phone, email, address, hours
- `index.html` — site title, description, URL for SEO
- `api/contact.ts` — the email that receives inquiries

---

## Step 2 — Add Your Photos

Drop your real photos into `src/assets/`.

Then in each page file (Home, Services, Projects, About), find the `<ImageWithFallback src="...">` tags
and replace the Unsplash URLs with your local paths:

```tsx
// Before (Unsplash placeholder):
src="https://images.unsplash.com/photo-..."

// After (your real photo):
src="/src/assets/your-photo.jpg"
```

---

## Step 3 — Set Up Resend (Email Service)

1. Go to **https://resend.com** and create a free account
2. In the Resend dashboard, go to **API Keys** → **Create API Key**
3. Name it (e.g. "Website Contact Form") and copy the key — it starts with `re_`
4. Open `api/contact.ts` and update:
   - `RECEIVING_EMAIL` → the email where you want to receive inquiries
   - `FROM_NAME` → your business name
5. **Do NOT paste the API key in the code.** It goes in Vercel (Step 5 below).

> **Note on the From address:**
> Until you verify a custom domain in Resend, use `onboarding@resend.dev` as the FROM_EMAIL.
> Once you have a domain, you can verify it in Resend and send from `noreply@yourdomain.com`.

---

## Step 4 — Push to GitHub

If you haven't already:

```bash
git init
git add .
git commit -m "Initial production build"
```

Create a new repository on **https://github.com** (make it private if you prefer),
then push:

```bash
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

---

## Step 5 — Deploy on Vercel

1. Go to **https://vercel.com** and sign in with GitHub
2. Click **"Add New Project"** → import your GitHub repository
3. Vercel will auto-detect it as a Vite project. The settings should be:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Before clicking Deploy, go to **Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `RESEND_API_KEY` | `re_your_actual_key_here` |

5. Click **Deploy** — your site will be live in ~1 minute at `yourproject.vercel.app`

---

## Step 6 — Test the Contact Form

1. Visit your live site at `yourproject.vercel.app/contact`
2. Fill in the form and submit
3. Check the inbox of the email you set as `RECEIVING_EMAIL` in `api/contact.ts`
4. If no email arrives, check **Vercel Dashboard → your project → Functions → Logs** for errors

---

## Step 7 (Optional) — Connect a Custom Domain

When you're ready to buy a domain:

1. Buy from **Namecheap** (https://namecheap.com) or directly from **Vercel Domains**
2. In Vercel → your project → **Settings → Domains** → Add your domain
3. Vercel will give you DNS records to add at your registrar
4. It takes 10–60 minutes to go live

---

## Step 8 (Internal Portal) — Construction Project Tracking System

An internal staff portal now lives at `/portal/*` (login, dashboards, project/site
management, daily progress reports, milestones, notifications). It currently runs
entirely on **mock data stored in your browser's localStorage** — it is a clickable
preview, not a live multi-user system yet.

Demo accounts (`src/app/portal/mockData.ts`):

| Email | Password | Role |
|---|---|---|
| admin@pambuilders.com | admin123 | Admin |
| pm@pambuilders.com | pm123 | Project Manager |
| site@pambuilders.com | site123 | Site Staff |

**Before this goes live for real staff**, a backend needs to be built — database,
real authentication, and photo upload storage. The full scope, API contract, and
step-by-step plan are in [`.github/agents/portal-backend-build.agent.md`](.github/agents/portal-backend-build.agent.md).
At a minimum you'll need to add these environment variables once that work is done:

- `DATABASE_URL` — Postgres connection string (Vercel Postgres or Neon both work)
- `SESSION_SECRET` — for signing session cookies
- `BLOB_READ_WRITE_TOKEN` — if using Vercel Blob for site photo uploads

The target database schema is already written at [`db/schema.sql`](db/schema.sql).

---

## Photo Placement Reference

| Page | Where | Recommended size |
|------|-------|-----------------|
| Home | Hero background | 1920×1000px |
| Home | Recent Projects (3 images) | 800×600px each |
| About | "Our Story" section | 800×900px |
| Services | Each service card (6 images) | 800×600px each |
| Projects | Project gallery | 800×600px each |

---

## Summary Checklist

- [ ] All `// REPLACE` comments updated with real business info
- [ ] Real photos dropped into `src/assets/` and paths updated
- [ ] Resend account created and API key copied
- [ ] `api/contact.ts` updated with your receiving email and business name
- [ ] Code pushed to GitHub
- [ ] Vercel project created and `RESEND_API_KEY` added as environment variable
- [ ] Deployed and contact form tested end-to-end
- [ ] (Optional) Custom domain connected
