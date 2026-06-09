# MF-HIOS-055 Task Workspace Read API Wiring

## Status

implemented

## Lane

normal

## Product Contract

Assistant task workspace must read assigned-task metadata through a backend-enforced task endpoint while preserving the task-based access boundary and keeping page artwork access out of scope.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/page-workspace.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-workspace.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Acceptance Criteria

- Workspace route calls `GET /api/tasks/:taskId` when a route id is present.
- Backend remains source of truth for Assistant assigned-task access and forbidden direct page-workspace access.
- Workspace shows loading, recoverable error, and live task metadata states.
- Context pages remain read-only and only reflect explicit `contextPageIds` when present.
- The UI does not fetch signed URLs, full chapter page lists, or direct page workspace payloads in this slice.

## Design Notes

- Commands: no new backend command.
- Queries: `GET /api/tasks/:taskId`.
- API: add `getTask` client helper; reuse existing backend task access enforcement.
- Tables: no database changes.
- Domain rules: Assistant access stays task-based; no frontend permission shortcut added.
- UI surfaces: `WorkspacePage`.

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
