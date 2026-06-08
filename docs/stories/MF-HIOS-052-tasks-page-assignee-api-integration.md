# MF-HIOS-052 Tasks Page Assignee API Integration

## Status

implemented

## Lane

normal

## Product Contract

Tasks Page must show live tasks for the current user through backend-enforced task access instead of local sample rows.

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
- `docs/architecture/auth.md`
- `docs/architecture/security.md`
- `docs/validation/test-plan.md`

## Acceptance Criteria

- Tasks Page fetches tasks through `GET /api/tasks/assignee/:assigneeId` for the authenticated user.
- Backend remains source of truth for self/admin access; no frontend-only permission shortcut is added.
- Task list loading, empty, and recoverable error states are visible.
- Task status and priority use shared status UI components.
- Context page and create-task sections remain clearly bounded until their write/detail APIs are wired.

## Design Notes

- Commands: no new backend command.
- Queries: `GET /api/tasks/assignee/:assigneeId`.
- API: add client helper only; backend route already exists.
- Tables: no database changes.
- Domain rules: no change to Assistant task access enforcement.
- UI surfaces: `TasksPage`.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id MF-HIOS-052 --unit 0 --integration 0 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | Existing server tests continue to pass. |
| Integration | Deferred; no live HTTP auth fixture in CI. |
| E2E | Not configured. |
| Platform | Client lint/build and root build pass. |
| Release | Not applicable. |

## Harness Delta

No harness updates planned.

## Evidence

- `npm run lint --prefix client` -> pass.
- `npm run test --prefix server` -> pass, 20 files / 90 tests.
- `npm run lint --prefix server` -> pass.
- `npm run build` -> pass; Vite chunk-size warning only.
- `git diff --check` -> pass.
- `scripts\bin\harness-cli.exe trace ... --story MF-HIOS-052` -> trace #53, standard tier, meets lane requirement.
