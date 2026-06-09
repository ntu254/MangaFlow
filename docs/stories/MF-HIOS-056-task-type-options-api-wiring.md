# MF-HIOS-056 Task Type Options API Wiring

## Status

implemented

## Lane

normal

## Product Contract

Tasks Page must load active task type options from backend data while keeping assistant assignment eligibility backend-owned and leaving assistant options bounded until a dedicated production-team read endpoint exists.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-task.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Acceptance Criteria

- Tasks Page loads active task type options through `GET /api/tasks/types?activeOnly=true`.
- The create-task dialog uses backend TaskType labels instead of hard-coded sample task types.
- Assistant options remain clearly bounded as caller-supplied samples until a production-team read endpoint exists.
- Task list loading/error states remain visible.
- No frontend-only permission or assignment eligibility logic is introduced.

## Design Notes

- Commands: no new backend command.
- Queries: `GET /api/tasks/assignee/:assigneeId`, `GET /api/tasks/types?activeOnly=true`.
- API: add client task-type list helper only.
- Tables: no database changes.
- Domain rules: backend remains source of truth for task type active state and assistant eligibility.
- UI surfaces: `TasksPage` and `CreateTaskDialog`.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Existing server tests continue to pass. |
| Integration | Deferred; no live HTTP auth fixture in CI. |
| E2E | Not configured. |
| Platform | Client lint/build and root build pass. |
| Release | Not applicable. |

## Evidence

- `npm run lint --prefix client` -> pass.
- `npm run test --prefix server` -> pass, 20 files / 90 tests.
- `npm run build` -> pass; Vite chunk-size warning only.
- `git diff --check` -> pass; LF-to-CRLF warnings only.
