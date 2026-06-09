# MF-HIOS-059 Review Queue Read API Wiring

## Status

implemented

## Lane

normal

## Product Contract

Review Queue must load backend-owned submission review work for the authenticated reviewer role instead of local sample rows, while keeping Mangaka and Editor review stages distinct.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/submission-review.md`
- `docs/contracts/comment-resolution.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-review.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Acceptance Criteria

- Backend exposes `GET /api/submissions/review-queue`.
- Mangaka queue returns submissions with `SUBMITTED` status for active Mangaka series memberships.
- Editor queue returns submissions with `MANGAKA_APPROVED` status for active Editor series memberships.
- Assistant and unsupported roles cannot access the review queue.
- Review Page renders queue loading, empty, error, and live rows from backend data.
- Review action endpoints remain explicit POST actions and refresh the queue after success.

## Design Notes

- Commands: no new workflow command.
- Queries: `GET /api/submissions/review-queue`.
- API: add backend review queue query plus client helper.
- Tables: no database changes.
- Domain rules: backend owns queue role/status filtering; frontend does not filter as a security shortcut.
- UI surfaces: `ReviewPage`.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Submission service queue tests and existing server tests continue to pass. |
| Integration | Deferred; no live HTTP auth fixture in CI. |
| E2E | Not configured. |
| Platform | Client lint/build and root build pass. |
| Release | Not applicable. |

## Evidence

- `npm run lint --prefix client` -> pass.
- `npm run test --prefix server` -> pass, 20 files / 94 tests.
- `npm run build` -> pass; Vite chunk-size warning only.
- `git diff --check` -> pass; LF-to-CRLF warnings only.
