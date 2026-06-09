# MF-HIOS-082 Submission Controller Split

## Status

implemented

## Lane

normal

## Product Contract

Submission creation, task submission listing, review queue listing, Mangaka approval, revision, rejection, and Editor approval behavior remain unchanged while `submission.controller.ts` is split into focused query and review controller modules.

## Relevant Product Docs

- `docs/product/requirements.md`
- `docs/contracts/submission-review.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/main.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Make `submission.controller.ts` a thin barrel export.
- Move submission query handlers into `controllers/submission-query.controller.ts`.
- Move review/action handlers into `controllers/submission-review.controller.ts`.
- Preserve route imports, response messages, and API behavior.

Out of scope:

- New endpoints.
- Validation schema changes.
- Workflow rule changes.
- Review chain rule changes.

## Acceptance Criteria

- `server/src/modules/submission/submission.controller.ts` becomes a thin compatibility barrel.
- Query and review handlers live in focused controller files.
- Existing route wiring remains stable.
- Server/client lint/build and related tests pass.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Existing submission and related tests continue to pass. |
| Integration | Not required; API contract unchanged. |
| E2E | Not configured. |
| Platform | Server/client lint/build plus docs verifiers. |
| Release | Not applicable. |

## Manual QA

1. Create submission.
2. List task submissions.
3. List review queue.
4. Mangaka approve.
5. Request revision.
6. Reject.
7. Editor approve.

## Evidence

- `npm run lint --prefix server` -> PASS.
- `npm run build --prefix server` -> PASS.
- `npm run test --prefix server -- submission chapter publication payroll dashboard admin series manuscript task comment board ranking accessPolicy env` -> PASS (20 files, 94 tests).
- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS.
- Product contract, architecture docs, and UI design-system verifiers -> PASS.
- `server/src/modules/submission/submission.controller.ts` reduced from 118 to 2 lines.
