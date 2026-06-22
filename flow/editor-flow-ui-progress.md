# Editor Flow UI Progress

## 2026-06-22 - Mangaka review task studio link fix

Task summary:

- Check the Mangaka review flow for tasks submitted by assistants.
- Fix the browser error where opening Page Studio called `/api/pages/pg_6a391cccff1c3e271bc310eb_1/studio` and received `400`.

Root cause:

- Shared task overview components generated a fake page id with `pg_${chapterId}_1`.
- Real backend Page records use their actual `task.pageId` ObjectId, so the generated id was invalid for `/api/pages/:pageId/studio`.

Actions taken:

- Updated task table and task card studio links to use the real `task.pageId`.
- Added a disabled `No page` state when a task does not have a linked page instead of making a bad API request.
- Kept Assistant Task Studio unchanged because it already opens by `taskId` and resolves `task.pageId`.

Files changed:

- `client/src/features/tasks/components/TaskList.tsx`
- `client/src/features/tasks/components/TaskCard.tsx`

Validation run:

- `cmd /c "cd client && npx prettier --write src/features/tasks/components/TaskList.tsx src/features/tasks/components/TaskCard.tsx"` passed.
- `cmd /c "cd client && npx eslint src/features/tasks/components/TaskList.tsx src/features/tasks/components/TaskCard.tsx"` passed.
- `cmd /c "npm --prefix client run build"` passed.

Outcome:

- Opening Studio from task overview no longer sends generated `pg_<chapterId>_1` IDs to the backend.

## 2026-06-22 - Tantou Editor Control Desk implementation

Requested Editor flow:

Editor Login -> Dashboard -> pending reviews/deadlines/ranking alerts -> Managed Series -> Manuscript Review -> Page Annotation -> Production Progress -> Board Reports -> Ranking -> Decision History -> Logout.

Current implementation coverage:

- Shared login/logout remains unchanged.
- Editor sidebar now exposes an Editor-owned information architecture:
  - Dashboard
  - Managed Series
  - Proposal Review
  - Final Reviews
  - Page Annotation
  - Production Progress
  - Board Reports
  - Ranking Risk
  - Decision History
  - Notifications
- Editor no longer gets Board voting or payroll navigation from the sidebar.
- Dashboard is now an Editor Control Desk with proposal queue, final review queue, deadline risk, at-risk series, managed-series load, and user-safe activity.
- Existing proposal review and final review routes remain in place for the decision actions already wired to backend APIs.
- Page Annotation routes into the existing Page Studio instead of creating a second canvas.

API and backend changes:

- Fixed Editor dashboard summary mismatch:
  - final-review count now uses `Submission.status = MANGAKA_APPROVED`
  - proposal count now uses `Series.status = EDITOR_REVIEW`
  - assigned series now uses active `SeriesMember` rows for `role = EDITOR`
- Added read-only Editor workspace endpoints:
  - `GET /api/editor/managed-series`
  - `GET /api/editor/production-progress`
  - `GET /api/editor/ranking-risk`
  - `GET /api/editor/decision-history`
  - `GET /api/editor/activity`
- Ranking risk and decision history are scoped to managed series and do not expose Board mutation actions.
- Activity endpoint returns safe production events from series/task/submission/chapter data, not raw AuditLog payloads.

Frontend changes:

- Added shared Editor workspace UI primitives for shell, panels, metrics, pills, loading, empty states, and text links.
- Added new Editor routes:
  - `/app/editor/managed-series`
  - `/app/editor/production-progress`
  - `/app/editor/page-annotation`
  - `/app/editor/board-reports`
  - `/app/editor/ranking-risk`
  - `/app/editor/decision-history`
- Added Editor API client methods and React Query hooks for the new read-only endpoints.
- Updated generated route tree through the client build.

Validation run:

- `cmd /c "npm --prefix client run build"` passed.
- Targeted frontend ESLint passed for touched Editor UI/API/sidebar files.
- `cmd /c "cd server && npx vitest run src/modules/dashboard/dashboard.service.test.ts"` passed.
- `cmd /c "cd server && npx tsc --noEmit"` still fails on pre-existing unrelated server type errors in chapter file service, series member service, series service, submission services, and task target-state. The Editor dashboard field error found during this pass was fixed.

Known blockers/deferred:

- Full server typecheck is still blocked by unrelated existing errors outside this Editor pass.
- Proposal review detail and final-review detail keep their existing decision forms; this pass adds the surrounding Editor workspace and API backing rather than rewriting those established action screens from scratch.
- Page annotation currently opens Page Studio for pages surfaced by production progress; deeper inline comment UX can be improved inside Page Studio in a follow-up.

Trace status:

- Outcome: completed with known unrelated server typecheck blockers.
- Errors: full server typecheck blocked by pre-existing unrelated TypeScript errors.
- Friction: PowerShell treated native Vite warnings differently when output was piped; `cmd /c` was used for reliable client build validation.

## 2026-06-22 - Editor UI proposal alignment pass

Task summary:

- Apply the attached Editor UI Proposal so Tantou Editor reads as an Editorial Review Workspace rather than a generic SaaS admin dashboard.
- Keep Settings hidden from Editor.
- Restore Decision History in the Editor IA because the latest attached proposal explicitly includes it.

Actions taken:

- Updated Editor sidebar labels and ownership:
  - Dashboard
  - Managed Series
  - Manuscript Review
  - Final Reviews
  - Page Annotation
  - Production Progress
  - Board Reports
  - Ranking & Risk
  - Decision History
  - Notifications
- Dashboard now uses proposal KPI language:
  - Managed series
  - Pending manuscript reviews
  - Revision required
  - Upcoming deadlines
  - High-risk series
  - Board reports needed
- Managed Series was redesigned into a table-first desk with a right-side detail drawer.
- Page Annotation copy now frames the route as a review-mode canvas queue.
- Board Reports now presents recommendation cases plus a defense-note/report outline.
- Ranking & Risk now includes read-only risk context and actions to view detail or prepare a defense note.

Files read:

- `client/src/layouts/Sidebar.tsx`
- `client/src/features/dashboard/components/EditorDash.tsx`
- `client/src/routes/app/editor/managed-series.tsx`
- `client/src/routes/app/editor/page-annotation.tsx`
- `client/src/routes/app/editor/board-reports.tsx`
- `client/src/routes/app/editor/ranking-risk.tsx`
- `client/src/routes/app/editor/decision-history.tsx`
- `client/src/features/editor/components/EditorWorkspace.tsx`
- `client/src/shared/api/editor.ts`

Files changed:

- `client/src/layouts/Sidebar.tsx`
- `client/src/features/dashboard/components/EditorDash.tsx`
- `client/src/routes/app/editor/managed-series.tsx`
- `client/src/routes/app/editor/page-annotation.tsx`
- `client/src/routes/app/editor/board-reports.tsx`
- `client/src/routes/app/editor/ranking-risk.tsx`
- `flow/editor-flow-ui-progress.md`

Decisions made:

- Decision History is visible again for Editor because the newest proposal includes it as a read-only managed-series ledger.
- Settings remains hidden for Editor because both the prior request and the proposal say Editor should not see system settings.
- Page Annotation continues to launch the existing Page Studio path; this pass improves the workspace framing without introducing a second canvas implementation.

Errors:

- none

Friction:

- none

Outcome:

- UI proposal alignment implemented and validated.

Validation run:

- `cmd /c "cd client && npx prettier --write src/layouts/Sidebar.tsx src/features/dashboard/components/EditorDash.tsx src/routes/app/editor/managed-series.tsx src/routes/app/editor/page-annotation.tsx src/routes/app/editor/board-reports.tsx src/routes/app/editor/ranking-risk.tsx"` passed.
- `cmd /c "cd client && npx eslint src/layouts/Sidebar.tsx src/features/dashboard/components/EditorDash.tsx src/routes/app/editor/managed-series.tsx src/routes/app/editor/page-annotation.tsx src/routes/app/editor/board-reports.tsx src/routes/app/editor/ranking-risk.tsx"` passed.
- `cmd /c "npm --prefix client run build"` passed.
