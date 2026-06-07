# MF-HIOS-023 Workspace Shared Component Adoption

## Status

implemented

## Lane

normal

## Product Contract

Replace the `/workspace/:chapterId` placeholder with a concrete frontend
workspace page that composes MangaFlow shared workspace, task, context,
comment, and submission presentation components.

This story is presentation-only. It uses local sample state to show the UI
contract boundaries and does not fetch workspace data, enforce authorization,
open Assistant access, expose full chapter pages, submit work, review
submissions, resolve comments, upload files, or call page/task/review APIs.

## Current Frontend Patterns

- Authenticated routes render inside the shared `DashboardLayout`.
- `/workspace/:chapterId` currently renders a shared `RoutePlaceholderPage`.
- `WorkspaceShell` provides the required left/canvas/right responsive layout.
- Shared task and review domain components already exist but are not mounted on
  a concrete workspace route.
- Empty and error states use shared feedback components.
- Status labels map through `status-ui.ts`.

## Selected Skill Pack

- Build Web Apps React best practices
- UI
- HI-OS Governance
- Validation

## Selected Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/page-workspace.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/submission-review.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-workspace.md`
- `docs/contracts/ui-task.md`
- `docs/contracts/ui-review.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/design/*`
- `docs/validation/test-plan.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- `/workspace/:chapterId` renders a concrete shared-component workspace page.
- The page uses `WorkspaceShell` with left context, center canvas, and right
  review/detail panels.
- The center canvas remains the primary visual focus.
- The assigned page is visually distinct from read-only context pages.
- Context pages are visibly marked `READ ONLY`.
- The Assistant access boundary is text-visible: no full chapter access is
  exposed by default.
- Task scope, status, priority, assignee, due date, and task type are visible.
- Submission versions and comments render through shared review components.
- Empty, loading, and error states are represented without API calls.
- The page clearly states that workspace API integration is not connected yet.
- No page workspace API, task workspace API, permission enforcement,
  submission mutation, comment resolution, upload, or full-chapter access is
  implemented.
- Client build and lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Assistant access scope is high-risk if implemented as real behavior.
- Sample workspace data could be mistaken for API-backed production data.
- Review and comment components could imply workflow actions if mutation
  callbacks are wired.
- Browser E2E is unavailable until a configured browser runner exists.

## Implementation Plan

1. Add a feature workspace page that composes existing shared components.
2. Use module-level sample data for one assigned page and limited read-only
   context pages.
3. Add visible copy for API-disconnected and assigned-page-only boundaries.
4. Wire `/workspace/:chapterId` to the new page.
5. Validate TypeScript, build, static UI review, and HI-OS gates.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Strict TypeScript no-emit lint |
| Integration | Vite production build |
| E2E | Not configured; static/manual UI review documented |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- Workspace route shows left, canvas, and right panels on desktop.
- Mobile workspace panel controls continue to expose one panel at a time.
- Assigned page is the only editable/primary page shown in the canvas.
- Context pages are explicitly read-only.
- Comments and submission versions render without action mutations.
- Empty, loading, and error preview states are visible on the page.

## Evidence

- `cd client && npm run build`: pass; Vite built 816 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `git diff --check`: pass; Git reported the existing CRLF normalization
  warning for `client/src/App.tsx`, but no whitespace errors.
- `harness-cli context --story MF-HIOS-023`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-023`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-023`: pass; trace `#27` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-023`: pass; mechanical verification and
  governance gate both passed.
- Static UI review: `/workspace/:chapterId` now renders through
  `WorkspaceShell`, `TaskScopeCard`, `ContextPageList`, `MFPagePreviewCard`,
  `CommentThread`, `SubmissionVersionList`, `MFEmptyState`, and
  `MFErrorState`; context pages are visibly `READ ONLY`; assigned-page-only
  and API-disconnected boundaries are text-visible.
- Static contract review: no page workspace API, task workspace API,
  permission enforcement, submission mutation, comment resolution, upload, or
  full-chapter access was implemented.
- Browser E2E is not configured and remains inconclusive rather than passed.
