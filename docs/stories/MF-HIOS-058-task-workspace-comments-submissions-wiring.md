# MF-HIOS-058 Task Workspace Comments and Submissions Wiring

## Status

implemented

## Lane

normal

## Product Contract

Task Workspace must use backend-enforced task access and load task comments plus submission versions for the assigned task instead of local sample review history.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/page-workspace.md`
- `docs/contracts/submission-review.md`
- `docs/contracts/comment-resolution.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-workspace.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Acceptance Criteria

- Workspace route uses `:taskId` instead of `:chapterId`.
- Workspace loads task metadata through `GET /api/tasks/:taskId`.
- Workspace loads task comments through a backend endpoint guarded by existing task access rules.
- Workspace loads task submissions through `GET /api/tasks/:taskId/submissions`.
- Assistant cannot read task comments by guessed task id unless task access is allowed by backend.
- Local sample comment/submission history is removed from the workspace route.

## Design Notes

- Commands: no new backend command.
- Queries: `GET /api/tasks/:taskId`, `GET /api/comments/task/:taskId`, `GET /api/tasks/:taskId/submissions`.
- API: add client helpers for task comments/submissions and reuse backend task access service.
- Tables: no database changes.
- Domain rules: no frontend-only permission logic added; comment listing now reuses task access enforcement.
- UI surfaces: `App.tsx`, `WorkspacePage`, comment/submission backend list endpoints.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Comment service tests and existing server tests continue to pass. |
| Integration | Deferred; no live HTTP auth fixture in CI. |
| E2E | Not configured. |
| Platform | Client lint/build and root build pass. |
| Release | Not applicable. |

## Evidence

- `npm run lint --prefix client` -> pass.
- `npm run test --prefix server` -> pass, 20 files / 91 tests.
- `npm run build` -> pass; Vite chunk-size warning only.
- `git diff --check` -> pass; LF-to-CRLF warnings only.
