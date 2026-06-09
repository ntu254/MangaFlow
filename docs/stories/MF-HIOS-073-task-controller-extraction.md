# MF-HIOS-073 Task Controller Extraction

## Status

implemented

## Lane

normal

## Product Contract

Task and task-type endpoint behavior, request/response shapes, and route wiring remain unchanged while task controller responsibilities are split into dedicated controller modules.

## Relevant Product Docs

- `docs/product/requirements.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/page-workspace.md`
- `docs/contracts/main.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Make `task.controller.ts` a thin barrel export.
- Split task endpoints into `controllers/task.controller.ts`.
- Split task-type endpoints into `controllers/task-type.controller.ts`.
- Preserve route imports and API behavior.

Out of scope:

- New endpoints.
- Service/business-rule changes.
- Validation schema changes.
- Response contract changes.

## Acceptance Criteria

- `server/src/modules/task/task.controller.ts` becomes a thin compatibility barrel.
- Task and task-type handlers live in dedicated controller files.
- Existing route wiring remains stable.
- Server/client validation and related tests pass.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Existing related tests continue to pass. |
| Integration | Not required; API contract unchanged. |
| E2E | Not configured. |
| Platform | Server/client lint/build plus docs verifiers. |
| Release | Not applicable. |

## Manual QA

1. Create a task through the existing task endpoint.
2. Update task status/priority/due date.
3. List tasks by series/chapter/assignee.
4. Create/update/delete task type.
5. Confirm response bodies/messages remain unchanged.

## Evidence

- `npm run lint --prefix server` -> PASS.
- `npm run build --prefix server` -> PASS.
- `npm run test --prefix server -- task submission comment chapter publication board ranking dashboard accessPolicy env` -> PASS (14 files, 66 tests).
- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS (bundle-size warning only).
- Product contract, architecture docs, and UI design-system verifiers -> PASS.
- `server/src/modules/task/task.controller.ts` reduced to 2 lines.
