# Project and website management

Run `npm run db:migrate` against the configured database before deploying this update. Migration 003 adds project appearance, permit records, correction reasons, website content, and uploaded assets. It preserves existing project IDs and report history. Fresh installations include the same schema.

Website Projects manages a separate public portfolio. Existing sample portfolio entries are seeded into the editor and remain published; admins can edit, unpublish or delete them. Admins add entries, upload covers, choose display order and draft/published state, and optionally link internal projects. Linked client, budget and location fields are public only when their respective switches are selected. Save website content applies publication changes. Category colors are shared with internal projects; project colors override the category default.

Website Content / About manages the BIR image/PDF. The placeholder is shown until a document is saved. David Chen and Sarah Williams have been removed; Ronald retains his existing title.

Manage project updates the existing record. Reports append to that project's history. Current progress follows submission order (report ID), including backdated reports and admin corrections; it does not reset when opening the form. Normal submissions cannot decrease progress. Admin corrections require a reason, preserve the prior report, and record the signed-in author. Copy previous report copies work descriptions/materials/manpower but requires a new photo and date review.

Reusable permit checklist items are maintained under Website Projects. Apply checklist adds missing names without resetting existing permit status or attachments. Save permits persists project-specific tracking. Website/permit uploads support JPEG, PNG, WebP and PDF up to 2 MB (project covers accept images only). These assets are stored in PostgreSQL; permit files require project access and website drafts remain admin-only until publication. Existing report photos retain their Blob storage workflow.

Demo mode implements these workflows in memory and resets on reload. Production requires the PostgreSQL migration. No deployment is performed by editing these files.


About and Contact now have separate admin pages with the same cards used by the public pages. About supports leadership add/edit/delete/reorder and optional image uploads, plus BIR registration management. Contact supports typed information cards (phone, email, address, hours, custom text), add/edit/delete/reorder, page heading/intro, form heading/project types, and an optional emergency section. Apply card updates the preview; Save changes publishes. Phone and email links derive from the displayed values. Message delivery credentials and recipient configuration remain in the existing server environment settings.

These fields use the existing website_content JSON record; existing databases receive the current page content as defaults until the first save. No additional SQL migration is required beyond migration 003. In demo mode, navigate to the public page in the same tab to see saved changes; reloads or separate tabs start a fresh demo.
