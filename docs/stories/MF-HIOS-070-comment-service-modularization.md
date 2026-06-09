# MF-HIOS-070 Comment Service Modularization

## Status

implemented

## Lane

normal

## Product Contract

Comment creation, scope validation, Assistant fix, Mangaka verification, Editor resolution, and reopen behavior remain unchanged while comment service internals are split into focused policy, guard, scope, command, query, and shared modules.

## Relevant Product Docs

- `docs/product/requirements.md`
- `docs/contracts/comment-resolution.md`
- `docs/contracts/submission-review.md`
- `docs/contracts/page-workspace.md`
- `docs/contracts/main.md`
- `docs/architecture/api.md`
- `docs/architecture/security.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Make `server/src/modules/comment/comment.service.ts` a thin compatibility facade.
- Move series-member comment access into a policy.
- Move comment resolution transitions into a guard.
- Move comment target normalization into a scope service.
- Split command and query responsibilities.
- Preserve controller imports and API behavior.

Out of scope:

- New endpoints.
- Schema/repository changes.
- Comment workflow status changes.
- Permission rule changes.

## Acceptance Criteria

- Comment service facade stays small and stable.
- Access, transition, scope, command, and query responsibilities are separated.
- Existing comment tests keep passing.
- Related workflow tests keep passing.
- Server/client lint/build and docs verifiers pass.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Comment and related workflow tests pass. |
| Integration | Not required; no API contract change. |
| E2E | Not configured. |
| Platform | Server/client lint/build plus docs verifiers. |
| Release | Not applicable. |

## Manual QA

1. Editor creates a blocking comment on a valid task/submission/page/region scope.
2. Assigned Assistant marks open comment fixed.
3. Mangaka verifies fixed comment.
4. Editor resolves verified comment.
5. Editor reopens fixed or verified comment.
6. Confirm wrong role/state/scope attempts are denied.

## Evidence

- `npm run lint --prefix server` -> PASS.
- `npm run build --prefix server` -> PASS.
- `npm run test --prefix server -- comment task submission chapter publication board ranking dashboard accessPolicy env` -> PASS (14 files, 66 tests).
- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS (bundle-size warning only).
- Product contract, architecture docs, and UI design-system verifiers -> PASS.
- `server/src/modules/comment/comment.service.ts` reduced to 23 lines.
