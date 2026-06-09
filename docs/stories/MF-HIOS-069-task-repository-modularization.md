# MF-HIOS-069 Task Repository Modularization

## Status

implemented

## Lane

normal

## Product Contract

Task creation, assignment eligibility, task scope validation, persistence, and API behavior remain unchanged while repository, policy, guard, and mapper responsibilities are separated.

## Relevant Product Docs

- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/page-workspace.md`
- `docs/architecture/api.md`
- `docs/architecture/database.md`
- `docs/architecture/security.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Make `server/src/modules/task/task.repository.ts` a stable barrel export.
- Split task and task-type persistence into focused repositories.
- Move assignment authorization into a policy.
- Move series/chapter/page/region/context validation into a scope guard.
- Move task response mapping into a mapper.
- Preserve controller/service exports and API behavior.

Out of scope:

- New endpoints or workflow states.
- Schema changes.
- Permission or task-assignment rule changes.

## Acceptance Criteria

- Persistence modules contain DB operations only.
- Task assignment rules live in a dedicated policy.
- Task scope invariants live in a dedicated guard.
- Task creation result mapping lives outside persistence.
- Existing task/controller imports remain compatible.
- Server/client lint/build and relevant server tests pass.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Task and related workflow tests pass. |
| Integration | Not required; no API contract change. |
| E2E | Not configured. |
| Platform | Server/client lint/build plus docs verifiers. |
| Release | Not applicable. |

## Manual QA

1. Create a task as an active Mangaka/Editor for an approved production series.
2. Confirm the task response preserves IDs, base rate, priority, due date, and context pages.
3. Attempt assignment to an inactive/non-Assistant/non-member user; confirm denial.
4. Attempt invalid chapter/page/region/context relationships; confirm denial.

## Evidence

- `npm run lint --prefix server` -> PASS.
- `npm run build --prefix server` -> PASS.
- `npm run test --prefix server -- task submission comment chapter publication board ranking dashboard accessPolicy env` -> PASS (14 files, 66 tests).
- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS (bundle-size warning only).
- Product contract, architecture docs, and UI design-system verifiers -> PASS.

