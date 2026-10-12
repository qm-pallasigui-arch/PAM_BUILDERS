# Local portal backend and database setup

Only exploring the portal? Run `npm run dev:demo` and open `http://127.0.0.1:5174/portal/login`. No database or API setup is needed. The login page lists demo credentials; changes reset on reload. Continue below when you need persistent data and real accounts.

The website footer includes **Staff Login**, which opens `/portal/login` for all three staff roles. The frontend needs both the portal API and PostgreSQL for sign-in. These instructions prepare a development database with sample projects, not an empty production launch.

## 1. Open the project

Run commands in PowerShell from `PAM_website-main`:

```powershell
cd C:\Users\redlo\Downloads\PAM_website-portal-overhaul\PAM_website-main
node --version
```

Use Node.js 22 or later. Dependencies are already installed in this workspace. On a fresh checkout, run `npm ci`.

## 2. Prepare PostgreSQL

Use a dedicated development PostgreSQL database. You can use a hosted PostgreSQL connection string or a local PostgreSQL server. For local PostgreSQL, connect with your database administrator using SQL Shell or pgAdmin and run these statements separately, outside a transaction:

```sql
CREATE ROLE pam_app LOGIN PASSWORD 'replace-with-your-own-database-password';
CREATE DATABASE pam_portal OWNER pam_app;
```

The database password is separate from staff login passwords. A local connection string looks like:

```text
postgresql://pam_app:YOUR_URL_ENCODED_PASSWORD@127.0.0.1:5432/pam_portal
```

URL-encode special characters in the username/password. For hosted PostgreSQL, use the provider's supplied connection string and TLS settings. Do not point development seed commands at a production database.

## 3. Create the local configuration

This command preserves an existing `.env`:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

Fill these values in `.env`:

```dotenv
DATABASE_URL=your-postgresql-connection-string
SESSION_SECRET=your-generated-session-secret
SEED_ADMIN_PASSWORD=your-chosen-admin-password
SEED_PM_PASSWORD=your-chosen-project-manager-password
SEED_STAFF_PASSWORD=your-chosen-site-staff-password
```

Generate the session secret locally:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Copy the result into `SESSION_SECRET`. Choose each staff password with at least 12 characters and at most 72 UTF-8 bytes. Keep `.env` private; the repository ignores it. Do not prefix server secrets with `VITE_`.

`BLOB_READ_WRITE_TOKEN` is needed for report photo uploads through a private Vercel Blob store. It can remain blank while setting up login and database access. Contact email settings are separate; the local portal API adapter does not serve the contact form endpoint.

## 4. Create the tables

```powershell
npm run db:migrate
```

Expected result: `Portal schema is up to date.` The runner tracks its migration and can be rerun. It creates the schema on an empty database; do not also manually import `db/schema.sql`.

## 5. Create the initial development accounts

```powershell
npm run db:seed
```

This hashes your chosen passwords and inserts three accounts plus sample projects, sites, milestones, reports, and notifications. It refuses to seed a database that already has users.

| Role | Login email | Password source |
| --- | --- | --- |
| Admin | admin@pambuilders.com | `SEED_ADMIN_PASSWORD` |
| Project Manager | pm@pambuilders.com | `SEED_PM_PASSWORD` |
| Site Staff | site@pambuilders.com | `SEED_STAFF_PASSWORD` |

Changing a seed variable later does not change an existing account password. Use the portal's admin Users module to edit accounts after setup.

## 6. Start the API and website

In one PowerShell terminal:

```powershell
npm run dev:api
```

Expected result: `Portal API listening on http://127.0.0.1:3001`.

Keep that terminal running. The website is already running in this session; if you need to restart it, open another terminal in the same project folder:

```powershell
npm run dev -- --host 127.0.0.1
```

Open the URL printed by Vite (normally `http://127.0.0.1:5173`). Vite forwards `/api/portal` requests to the API on port 3001. Use the website URL to log in, not the API port.

## 7. Verify the setup

1. Open the public website, scroll to **Quick Links**, and select **Staff Login**.
2. Sign in as `admin@pambuilders.com` with your chosen admin password.
3. Confirm the dashboard loads sample projects and the Users module shows the three accounts.
4. Reload the page to check the session persists, then sign out.
5. Sign in as site staff and confirm the admin Users module is unavailable.
6. If photo uploads are needed, configure the private Blob token, restart the API, submit a report with a photo, and verify the saved photo after reload.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| API unavailable or Vite proxy connection refused | Keep `npm run dev:api` running on port 3001. |
| Missing `.env` or `DATABASE_URL` | Run from `PAM_website-main` and complete step 3. |
| Database connection refused | Start PostgreSQL and verify the connection host and port. |
| Database authentication/TLS error | Check the database credentials and provider connection settings. |
| Missing relation/table | Run `npm run db:migrate` against the same database used by the API. |
| Invalid email or password | Use the password configured when seeding; the old fixture passwords are not the default. |
| Seed requires an empty database | Accounts already exist. Sign in with their original credentials; do not delete data to rerun the seed. |
| Too many sign-in attempts | Wait 15 minutes before retrying the correct credentials. |
| Photo upload fails | Configure a token for a private Blob store and restart the API. |

For hosted deployment, see [SETUP_GUIDE.md](SETUP_GUIDE.md).
