# CHANGES

All code changes and important edits in this repository must be recorded here.

Format (append at top):
- Date: YYYY-MM-DD  
- Author: <name or bot>  
- Summary: short description  
- Files: list of changed files (paths)  
- Notes: optional details or follow-ups

---


2026-10-06
- Author: Codex
- Summary: Auth ? replaced mock login with bcrypt verification, signed revocable HTTP-only sessions, persistent login throttling, and same-origin write checks.
- Files: server/portal/security.ts, server/portal/handler.ts, server/portal/validation.ts, server/portal/db.ts, api/portal/index.ts, src/app/portal/auth.tsx, src/app/portal/api.ts, src/app/pages/portal/PortalLogin.tsx
- Notes: Requires DATABASE_URL and SESSION_SECRET; sessions and login attempts are reflected in db/schema.sql and src/app/portal/types.ts.

2026-10-06
- Author: Codex
- Summary: Projects/sites ? added server-enforced access, project and site writes, admin assignment controls, and paginated API-backed portal data.
- Files: server/portal/handler.ts, server/portal/queries.ts, src/app/portal/data.tsx, src/app/pages/portal/ProjectsList.tsx, src/app/pages/portal/ProjectDetail.tsx, src/app/pages/portal/ProjectControls.tsx, src/app/pages/portal/PortalLayout.tsx
- Notes: Existing project-level assignments cover all project sites; every role needs assignment to submit reports. Frontend saves await API results and display errors.

2026-10-06
- Author: Codex
- Summary: Reports/photos ? added transactional report/material/manpower writes, server-derived authorship, validated private Blob uploads, and authenticated photo display.
- Files: server/portal/handler.ts, server/portal/validation.ts, src/app/portal/api.ts, src/app/pages/portal/ReportSubmit.tsx, src/app/pages/portal/ReportsList.tsx, src/app/pages/portal/ProjectDetail.tsx
- Notes: Requires BLOB_READ_WRITE_TOKEN for a private store; photo upload ownership and numeric constraints added to schema, with matching TypeScript persistence shapes. photoDataUrl remains the frontend field name but now contains a protected API URL on reads.

2026-10-06
- Author: Codex
- Summary: Milestones/notifications ? persisted milestone edits, derived live delay alerts using Manila calendar dates, and added independent per-user notification read receipts.
- Files: server/portal/handler.ts, src/app/pages/portal/Milestones.tsx, src/app/pages/portal/Notifications.tsx, src/app/portal/utils.ts, db/schema.sql, src/app/portal/types.ts
- Notes: Preserves due_date < today AND status != completed; read receipts prevent one user's action from clearing another user's broadcast notification.

2026-10-06
- Author: Codex
- Summary: Users ? replaced the mock admin list with live create/edit/deactivate controls, password hashing, case-insensitive email uniqueness, and session revocation on access changes.
- Files: server/portal/handler.ts, src/app/pages/portal/UsersAdmin.tsx, src/app/portal/mockData.ts, db/schema.sql, src/app/portal/types.ts
- Notes: Seed fixtures are no longer imported by browser code; the current admin cannot deactivate or demote their own account.

2026-10-06
- Author: Codex
- Summary: Setup/verification ? added transactional migrations, guarded fixture seeding, local API development, portal indexing exclusions, strict type checking, and PostgreSQL integration tests.
- Files: db/schema.sql, db/migrations/002_portal_backend.sql, src/app/portal/types.ts, scripts/migrate.ts, scripts/seed.ts, scripts/dev-api.ts, tests/portal.test.ts, .env.example, .gitignore, SETUP_GUIDE.md, package.json, package-lock.json, tsconfig.json, vite.config.ts, vercel.json, public/robots.txt, CHANGES.md
- Notes: Fresh and upgrade schemas match; new persistence tables are mirrored in types.ts. Hosted provisioning was deferred at the user's request in favor of setup instructions. One serverless dispatcher implements the supplied route contract; the additional protected photo-read endpoint returns image bytes. Seed defaults require custom passwords; original fixture passwords require explicit --allow-demo-passwords. No public marketing components or api/contact.ts were edited. npm is authoritative for deployment; the legacy pnpm lockfile is not used. Validation: npm run typecheck and npm run build passed; all 13 PostgreSQL integration tests passed, including omitted-field preservation on partial updates. Full dependency installation reported 26 audit findings, including one critical, in the full dependency tree.

2026-10-06
- Author: Claude
- Summary: Added the Construction Project Tracking and Progress Monitoring System as a new internal portal (`/portal/*`) — login, role-based dashboard (admin/project_manager/site_staff), project & site management, daily progress report submission (with photo preview + dynamic material/manpower rows), milestone tracking with automatic delay flagging, notifications, and an admin user list. Frontend is complete and runs on mock/localStorage data (clearly commented as demo-only); added an agent handoff spec for the real backend build.
- Files: [src/app/portal/types.ts](src/app/portal/types.ts#L1), [src/app/portal/mockData.ts](src/app/portal/mockData.ts#L1), [src/app/portal/auth.tsx](src/app/portal/auth.tsx#L1), [src/app/portal/data.tsx](src/app/portal/data.tsx#L1), [src/app/portal/utils.ts](src/app/portal/utils.ts#L1), [src/app/pages/portal/PortalLayout.tsx](src/app/pages/portal/PortalLayout.tsx#L1), [src/app/pages/portal/PortalLogin.tsx](src/app/pages/portal/PortalLogin.tsx#L1), [src/app/pages/portal/Dashboard.tsx](src/app/pages/portal/Dashboard.tsx#L1), [src/app/pages/portal/ProjectsList.tsx](src/app/pages/portal/ProjectsList.tsx#L1), [src/app/pages/portal/ProjectDetail.tsx](src/app/pages/portal/ProjectDetail.tsx#L1), [src/app/pages/portal/ReportSubmit.tsx](src/app/pages/portal/ReportSubmit.tsx#L1), [src/app/pages/portal/ReportsList.tsx](src/app/pages/portal/ReportsList.tsx#L1), [src/app/pages/portal/Milestones.tsx](src/app/pages/portal/Milestones.tsx#L1), [src/app/pages/portal/Notifications.tsx](src/app/pages/portal/Notifications.tsx#L1), [src/app/pages/portal/UsersAdmin.tsx](src/app/pages/portal/UsersAdmin.tsx#L1), [src/app/pages/portal/NotAuthorized.tsx](src/app/pages/portal/NotAuthorized.tsx#L1), [src/app/pages/portal/RoleRoute.tsx](src/app/pages/portal/RoleRoute.tsx#L1), [src/app/routes.tsx](src/app/routes.tsx#L1), [src/app/App.tsx](src/app/App.tsx#L1), [db/schema.sql](db/schema.sql#L1), [.github/agents/portal-backend-build.agent.md](.github/agents/portal-backend-build.agent.md#L1), package.json, package-lock.json
- Notes: No database or real auth exists yet — see `.github/agents/portal-backend-build.agent.md` for the full backend scope (schema, API contract, auth, photo storage) needed before this goes live for real users. Added `typescript`, `@types/react`, `@types/react-dom` as devDependencies to enable `tsc --noEmit` type-checking (this repo previously had none). Verified with `npm run build` and a strict `tsc --noEmit` pass — zero errors in all new files.

2026-04-28
- Author: Copilot
- Summary: Fixed RangeError from non-integer testimonial ratings by flooring rating when creating stars; added debug SKILL.md.  
- Files: [src/app/pages/Home.tsx](src/app/pages/Home.tsx#L1), [guidelines/SKILL.md](guidelines/SKILL.md#L1), CHANGES.md  
- Notes: Use `Array.from({ length: Math.floor(rating) })` for safe star rendering.  

2026-04-28
- Author: Copilot
- Summary: Prevent crash when `/api/contact` returns empty or non-JSON body; updated client to handle text responses safely.  
- Files: [src/app/pages/Contact.tsx](src/app/pages/Contact.tsx#L1)  
- Notes: Use `response.text()` and JSON.parse inside try/catch to avoid Unexpected end of JSON input.  

2026-04-28
- Author: Copilot
- Summary: Added a workspace custom agent for approval-gated security audits of the Vercel/Resend construction site stack.  
- Files: [.github/agents/security-audit-approval.agent.md](.github/agents/security-audit-approval.agent.md#L1)  
- Notes: Agent audits first and stops before remediation until the user approves each fix.  

2026-04-28
- Author: Copilot
- Summary: Hardened the contact API with origin checks, payload limits, best-effort rate limiting, and HTML escaping; added Vercel edge security headers.  
- Files: [api/contact.ts](api/contact.ts#L1), [vercel.json](vercel.json#L1)  
- Notes: These changes reduce spam abuse, protect against malformed email content, and add low-cost browser security headers.  
