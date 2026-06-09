# MF-HIOS-063 Tasks Page Componentization

## Status

implemented

## Lane

normal

## Product Contract

Tasks Page keeps current assignee task API and task type API behavior while separating page composition, data loading, backend-to-UI mappers, table rendering, featured task preview, and state preview.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-task.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Extract task page data loading into `useTasksPage`.
- Extract task rows/actions/context page mapping into `task-page.mappers.ts`.
- Extract task table/error rendering into `TaskListPanel`.
- Extract featured task/context/preview section into `TaskPreviewPanel`.
- Extract static task state preview into `TaskStatePreview`.
- Preserve current assignee and task type API behavior.

Out of scope:

- New backend task mutation wiring.
- Production-team assistant options API.
- Workspace comments/submissions wiring.
- Permission or workflow-rule changes.

## Acceptance Criteria

- `TasksPage.tsx` is a thin composition page and no longer owns API loading or table column definitions.
- `useTasksPage` owns task/task-type loading, errors, preview-task state, dialog state, and derived UI collections.
- `task-page.mappers.ts` owns task id, type label, scope label, rows, actions, and context-page transforms.
- `TaskListPanel` owns task table columns and error/table state.
- `TaskPreviewPanel` owns featured task scope/context/page preview presentation.
- Existing API behavior remains unchanged:
  - `GET /api/tasks/assignee/:assigneeId`
  - `GET /api/tasks/types?activeOnly=true`
- Create task dialog remains local preview only.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not required; frontend componentization only. |
| Integration | Not required; no backend behavior changes. |
| E2E | Not configured. |
| Platform | `npm run lint --prefix client` and `npm run build --prefix client`. |
| Release | Not applicable. |

## Evidence

- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS.
- `TasksPage.tsx` reduced from 461 lines to 141 lines.
