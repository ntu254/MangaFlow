# MF-HIOS-071 Submission Service Modularization

## Status

implemented

## Lane

normal

## Product Contract

Assistant submission, Mangaka review, Editor final approval, revision, rejection, queue, and task-status synchronization behavior remain unchanged while submission service responsibilities are split.

## Relevant Product Docs

- `docs/product/requirements.md`
- `docs/contracts/submission-review.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/comment-resolution.md`
- `docs/contracts/main.md`
- `docs/architecture/api.md`
- `docs/architecture/security.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Make `submission.service.ts` a thin barrel export.
- Move membership access checks into a policy.
- Move status/payload transition checks into a guard.
- Split submission query/create and review command responsibilities.
- Preserve controller imports and API behavior.

Out of scope:

- New endpoints or statuses.
- Schema/repository changes.
- Review-chain or permission changes.

## Acceptance Criteria

- Submission facade is a stable barrel export.
- Access, transition, query/create, and review command concerns are separate.
- Existing submission tests pass.
- Related workflow tests pass.
- Server/client lint/build and docs verifiers pass.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Submission and related workflow tests pass. |
| Integration | Not required; no API contract change. |
| E2E | Not configured. |
| Platform | Server/client lint/build plus docs verifiers. |
| Release | Not applicable. |

## Manual QA

1. Assigned Assistant submits text/file from an allowed task state.
2. Mangaka approves submitted work.
3. Editor final-approves Mangaka-approved work.
4. Mangaka/Editor requests revision at the correct stage.
5. Mangaka rejects before approval.
6. Confirm queue and task status remain synchronized.

## Evidence

- Server lint/build -> PASS.
- Related server tests -> PASS (14 files, 66 tests).
- Client lint/build -> PASS (bundle-size warning only).
- Product contract, architecture docs, and UI design-system verifiers -> PASS.
- `server/src/modules/submission/submission.service.ts` reduced from 162 to 5 lines.
