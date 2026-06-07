# MF-HIOS-009 Frontend Route Shell Restoration

## Status

implemented

## Lane

normal

## Task Type

Frontend routing regression restoration.

## Product Contract

Restore the documented MangaFlow authenticated route surfaces using the current
frontend style and existing shared layout/UI components.

This story provides route-level placeholder surfaces only. It does not invent
feature data, API response shapes, backend permissions, or business workflows.

## Current Frontend Patterns

- React 19, Vite, strict TypeScript, and React Router nested layouts.
- Feature folders under `client/src/features`.
- Shared UI primitives under `client/src/shared/components/ui`.
- Shared authenticated shell through `DashboardLayout`, `RoleSidebar`, and
  `DashboardTopBar`.
- Page titles through `PageTitleContext`.
- Tailwind design tokens, Plus Jakarta Sans, light theme, rounded surfaces, and
  soft purple shadows.
- Authentication and role checks through `AuthProvider` and `ProtectedRoute`.

## Selected Skill Pack

- Build Web Apps frontend guidance
- React best practices
- HI-OS Governance
- Validation

## Selected Docs

- `docs/design/*`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-dashboard.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/contracts/ui-workspace.md`
- `docs/contracts/ui-task.md`
- `docs/contracts/ui-review.md`
- `docs/contracts/ui-board.md`
- `docs/contracts/ui-admin.md`
- `docs/validation/ui-review-checklist.md`
- `docs/stories/MF-HIOS-006-app-shell-routing.md`

## Acceptance Criteria

- Existing marketing, login, and Admin dashboard routes continue to work.
- Authenticated role dashboards render through the shared dashboard shell.
- Documented route surfaces exist for series list/detail, chapter detail,
  workspace, tasks, review, board, and admin.
- Placeholder surfaces use shared MangaFlow components and clearly identify
  that feature implementation is pending.
- Routes do not fabricate API data or frontend-only authorization rules.
- Existing user deletion of `DashboardPage.tsx` is not reverted.
- Existing `client/tsconfig.tsbuildinfo` modification is not committed.
- `npm run build` and `npm run lint` pass in `client`.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Route paths may drift from existing navigation.
- Generic placeholders could accidentally imply unsupported behavior.
- Role routing can create redirect loops if nested incorrectly.
- Existing uncommitted user changes must not enter the story commit.

## Implementation Plan

1. Create one reusable route placeholder page using existing shared primitives.
2. Add thin feature page modules for documented route surfaces.
3. Restore nested authenticated routes in `App.tsx`.
4. Keep Admin dashboard role-protected and use role-param protection for
   generic dashboards.
5. Validate build, lint, and route configuration.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | TypeScript strict compilation through lint |
| Integration | Vite production build |
| E2E | Not configured; manual route matrix documented |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- `/` renders marketing layout.
- `/login` renders auth layout.
- `/app/:role/dashboard` renders authenticated dashboard placeholder except
  Admin, which renders the existing Admin dashboard.
- `/app/series`, `/app/series/:id`, `/app/chapters/:id`,
  `/app/workspace/:chapterId`, `/app/tasks`, `/app/review`, `/app/board`, and
  `/app/admin` render through the shared authenticated shell.

## Evidence

- `cd client && npm run build`: pass; Vite built 781 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `harness-cli context --story MF-HIOS-009`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-009`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-009`: pass; trace `#13` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-009`: pass; mechanical verification and
  governance gate both passed.
- Manual route matrix is documented above; browser E2E is not configured and
  remains inconclusive rather than passed.
