# MF-HIOS-024 Tasks Page Shared Component Adoption

## Status

implemented

## Lane

normal

## Product Contract

Replace the `/tasks` placeholder with a concrete frontend task page that
composes MangaFlow shared task presentation components.

This story is presentation-only. It uses local sample state to show task list,
task scope, read-only context, create-task dialog, and task state patterns. It
does not fetch tasks, create tasks, enforce Assistant Production Team
eligibility, validate active `TaskType` configuration, enforce permissions,
send notifications, submit work, or call task APIs.

## Current Frontend Patterns

- Authenticated routes render inside the shared `DashboardLayout`.
- `/tasks` currently renders a shared `RoutePlaceholderPage`.
- Feature pages use `PageShell` and shared MangaFlow primitives.
- Shared task components exist but are not mounted on a concrete task route.
- Status labels map through `status-ui.ts`.
- Empty, loading, and error states are represented with shared feedback
  components.

## Selected Skill Pack

- Build Web Apps React best practices
- UI
- HI-OS Governance
- Validation

## Selected Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-task.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/design/*`
- `docs/validation/test-plan.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- `/tasks` renders a concrete shared-component task page.
- The page uses `PageShell`, `MFCard`, `MFButton`, and `MFBadge`.
- Pending task actions render through `ActionItemList`.
- Featured task detail renders through `TaskScopeCard`.
- Task list renders through `MFTable`.
- Task status uses `TaskStatusBadge` and centralized status mappings.
- Context pages render through `ContextPageList` and are visibly `READ ONLY`.
- `CreateTaskDialog` is mounted with caller-supplied sample options only.
- The create-task flow stores only local preview data and clearly states that
  API integration is not connected.
- Empty, loading, error, submitted, and revision states are represented.
- No task API, assignment mutation, permission enforcement, Production Team
  eligibility validation, active `TaskType` validation, notification, or
  submission behavior is implemented.
- Client build and lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Assistant eligibility and active `TaskType` rules are backend/high-risk and
  must not become frontend-only enforcement.
- The create-task dialog could be mistaken for live assignment behavior.
- Sample task data could be mistaken for API-backed production data.
- Browser E2E is unavailable until a configured browser runner exists.

## Implementation Plan

1. Add a feature task page that composes existing shared components.
2. Use module-level sample task, action, context, and table data.
3. Add local dialog state that previews submitted values without calling APIs.
4. Add visible API-disconnected and caller-supplied-options boundaries.
5. Wire `/tasks` to the new page.
6. Validate TypeScript, build, static UI review, and HI-OS gates.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Strict TypeScript no-emit lint |
| Integration | Vite production build |
| E2E | Not configured; static/manual UI review documented |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- Tasks route shows pending actions, featured task scope, context pages, and a
  task table.
- Task statuses are visible text badges through centralized mappings.
- Context pages are explicitly read-only.
- Create task dialog opens, shows shared form fields, and records local preview
  values only.
- Empty, loading, error, submitted, and revision states are visible.

## Evidence

- `cd client && npm run build`: pass; Vite built 819 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `git diff --check`: pass; Git reported the existing CRLF normalization
  warning for `client/src/App.tsx`, but no whitespace errors.
- `harness-cli context --story MF-HIOS-024`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-024`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-024`: pass; trace `#28` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-024`: pass; mechanical verification and
  governance gate both passed.
- Static UI review: `/tasks` now renders through `PageShell`, `MFCard`,
  `MFButton`, `MFBadge`, `TaskScopeCard`, `ContextPageList`,
  `ActionItemList`, `TaskStatusBadge`, `MFTable`, `MFEmptyState`,
  `MFErrorState`, and `CreateTaskDialog`; context pages are visibly
  `READ ONLY`; empty, loading, error, submitted, and revision states are
  represented.
- Static contract review: no task API, assignment mutation, permission
  enforcement, Production Team eligibility validation, active `TaskType`
  validation, notification, or submission behavior was implemented.
- Browser E2E is not configured and remains inconclusive rather than passed.
