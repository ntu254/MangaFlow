# MF-020 Editor Approval Workflow UI

## Current Behavior

The backend supports root-level REST API endpoints for Editor/Admin approval of manuscripts, chapters, and pages (implemented in MF-019). However, there is no dashboard for Editors to see assigned series, pending manuscripts, pending chapters, deadlines, and unresolved comments. There are also no frontend workspace controls or pages for Editors to execute approvals or revision requests.

## Target Behavior

Implement the Editor review and approval frontend UI:
1. **Editor Dashboard** (`/app/editor/dashboard`):
   - Lists series assigned to the active Editor.
   - Lists manuscripts awaiting review.
   - Lists chapters awaiting review.
   - Displays deadlines, statuses, and counts of unresolved comments.
2. **Chapter Pages & Review Workspace**:
   - Reuses/extends `ChapterPagesPage` and `PageWorkspacePage` by checking the pathname prefix.
   - Restricts Mangaka-specific actions (e.g. uploading/deleting pages) when accessed as an Editor.
   - Embeds Editor approval and revision-request controls on both the Chapter Pages page and the individual Page Workspace page.
   - Integrates comment resolution and blocks page/chapter approvals with proper error displays when unresolved comments remain.

## Affected Users

- Editor
- Admin
- Mangaka (who receives the approved/needs-revision states)

## Affected Product Docs

- `docs/04_frontend_routes_ui_screens.md`
- `docs/07_screen_design_specification.md`

## Non-Goals

- E2E browser tests (deferred).
- Email notifications.
