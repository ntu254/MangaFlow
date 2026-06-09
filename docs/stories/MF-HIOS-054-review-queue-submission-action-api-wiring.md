# MF-HIOS-054 Review Queue Submission Action API Wiring

## Status

implemented

## Lane

normal

## Product Contract

Review Queue must use explicit backend submission review action endpoints for Mangaka internal approval, revision requests, rejection, and Editor production final approval when a real submission id is provided.

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

- Review page exposes submission review actions through existing explicit backend POST endpoints.
- Mangaka approval and Editor final approval remain distinct UI modes.
- Request revision and reject actions call backend endpoints and keep destructive reject confirmation.
- No frontend-only permission shortcut or local status mutation is added; backend response is rendered as action result.
- Review queue sample rows remain clearly bounded until a dedicated review queue read endpoint exists.

## Design Notes

- Commands: no new backend command.
- Queries: no new review queue query; live queue endpoint remains future work.
- API actions: `POST /api/submissions/:id/mangaka-approve`, `POST /api/submissions/:id/request-revision`, `POST /api/submissions/:id/reject`, `POST /api/submissions/:id/editor-approve`.
- Tables: no database changes.
- Domain rules: backend remains source of truth for role checks, Mangaka-before-Editor sequencing, and payroll trigger.
- UI surfaces: `ReviewPage`.

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
- `git diff --check` -> pass; LF-to-CRLF warning only.
