# Portal state patterns

## Implemented state matrix

| Scope | Trigger | Feedback and recovery |
| --- | --- | --- |
| Initial portal load | No successful load for this signed-in user | Loading panel; child pages do not render premature empty states |
| Initial load failure | Request fails before the first successful load | Error panel and Retry loading |
| Background refresh | Data was already loaded | Keep current page, dialogs, and drafts mounted; announce refreshing |
| Refresh failure | Request fails after a successful load | Preserve last successful data; show stale-data warning and Retry refresh |
| Projects empty | No visible projects | Admins/managers: create first project; site staff: explain assignment requirement |
| Reports empty | No reports across all projects | Explain report creation and link to projects |
| Filtered reports empty | Selected project has no reports | Explain filter and offer Clear filter |
| Milestones empty | No milestones | Explain purpose; offer creation if a project exists |
| Notifications empty | No system messages | All-caught-up message; delay alerts remain independent |
| Project/milestone creation | Required fields missing or save fails | Persistent inline alert; required invalid inputs reference the message; preserve entered values |
| Action in flight | Create, submit report, milestone update, mark read | Disabled button, busy semantics, spinner and operation label |
| Action succeeds | Create or milestone/notification update | Success notification; refresh data |

## Workflow map

Milestone: Pending → In progress → Completed. Pending → Completed remains available for work completed before it was recorded. Project managers and admins use the existing authorized API. Overdue is derived from the due date in Asia/Manila and shown alongside the workflow status; completion removes the overdue indicator.

Projects retain Ongoing, On hold, and Completed with existing management permissions. Reports retain append-only submission and the existing correction workflow. Approval is tracked separately from operational project status, as described below.

## Reusable components

- `portal/Button.tsx`: optional `loading` and `loadingLabel` for action buttons; standard focus, disabled, hover, and pressed feedback. Existing `asChild` links retain their child structure; use loading on actual action buttons.
- `portal/ContentState.tsx`: empty, loading, and error presentations; `PortalDataBoundary` separates initial loading from refresh without replacing mounted page content.
- `portal/data.tsx`: successful data is tied to the current authenticated user; previous users' data is not exposed while a new user loads. A successful write followed by a failed refresh is presented as stale data, not a failed write that invites duplicate submission.

## Verification

Run `npm run typecheck`, `npm test`, and `npm run build`. State regression tests cover rendered loading/error boundaries, retained content during refresh failure, busy-button semantics, and milestone updates through the demo API. These checks do not substitute for browser interaction testing.

Browser review: use a narrow viewport and keyboard navigation; submit incomplete forms; throttle a refresh with an open draft; fail a refresh after data has loaded; retry; check a user with no assigned projects; clear a reports filter; start and complete an overdue milestone. Verify focus visibility, readable messages, retained input, and no duplicate writes.

Future pages can adopt these primitives as their own state requirements are defined. Partial results, search, dragging, and undo are not added where the existing workflow does not support them.


## Shared interaction design

Neutral buttons, navigation, actionable cards and icon controls use light orange (`#fff7ed`) on hover, orange borders (`#fdba74`), and dark orange text/icons (`#9a3412`). Primary orange buttons darken; destructive controls stay red. Icons retain their shape and inherit the action color. Focus has a visible orange outline. Selected navigation stays solid orange, with `aria-current` from the router. Noninteractive cards do not receive clickable styling. Motion is reduced when requested by the OS.

`AddCard` uses a native button or navigation link, a stable + icon, a label, and a short explanation. It is the single creation entry point for projects, reports, milestones, and users. Duplicate header and empty-state creation buttons are removed. Report creation only offers approved projects for which the user can submit; multiple eligible projects open a project picker. Project detail also offers an add-report card.

Completion and approval use green; pending approval uses amber; rejection/expiry use red. Text and icons accompany the color. Permit badges distinguish Pending, Submitted, Approved, and Expired. Editable permit changes are marked unsaved until persisted.

## Approval workflow and rollout

Run `npm run db:migrate` before running the backend with these changes. Migration `004_approvals` preserves historical projects/reports as approved, sets new records to pending by default, and adds reviewer metadata and an append-only `approval_events` audit table. It is safe to rerun without approving pending records. The demo implements these rules in memory; reload resets demo records.

- Project managers may submit projects. Pending/rejected projects remain visible to managers/admins but are inaccessible to site staff, including direct API access and related report/milestone lists.
- Admin-created projects/reports are automatically approved. Explicit admin decisions record the reviewer, timestamp, feedback, and audit event.
- Pending projects cannot receive progress reports. Admins approve or reject pending projects. Rejection requires a reason. Managers/admins may correct rejected project details and explicitly resubmit for review.
- Non-admin reports require approval. Pending/rejected reports stay in the visible history for authorized users; their percentages are labeled reported and excluded from official progress.
- Report approval rechecks the latest approved progress under a project lock. A superseded report or one that reduces progress cannot be approved. Admin corrections continue to require a reason.
- Rejected reports remain immutable; users submit a new corrected report. Approved records cannot be rejected through the review endpoint. Repeating an identical review is idempotent.
- This is approval of initial project submission, not a new approval requirement for every subsequent project management edit. Cancellation is not introduced.

SQL integration tests verify authorization, staff access restrictions, forged approval field handling, review validation, resubmission, audit events, progress floors, and historical migration. Demo tests verify the same core journey. Browser interaction testing is still required for visual sign-off.


## Page headers and report layout

Portal working screens share `PageHeader`: a light-orange band with a section label, a larger page title, and a short description. Content and filters sit below it. Website editor save/public-view actions remain in the header; the login screen retains its authentication-specific layout.

`ReportCard` is reused in the reports list and project report history. Details and the site photo are separate cards, side by side on desktop and stacked in reading order on mobile. Images use their full aspect ratio without cropping, have descriptive alternative text, and link to the original. Reports without photos display an explicit placeholder. The report-entry form uses the same two-column arrangement with a dedicated upload, file guidance, and preview card.
