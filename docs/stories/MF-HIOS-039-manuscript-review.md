# MF-HIOS-039 Manuscript Review Backend Module

## Status

implemented

## Lane

high-risk

## Product Contract

Implement Tantou Editor proposal/manuscript review before Board review.
This is separate from production final approval.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/series-proposal.md`
- `docs/contracts/manuscript-review.md`
- `docs/contracts/workflow-status.md`
- `docs/architecture/api.md`
- `docs/architecture/database.md`
- `docs/architecture/auth.md`
- `docs/architecture/security.md`
- `docs/validation/test-plan.md`

## Acceptance Criteria

- Manuscript model stores canonical `ManuscriptStatus` values.
- Manuscript uploads create new immutable versions and do not overwrite prior files.
- Series submit moves latest Manuscript to `EDITOR_REVIEW`.
- Editor can request revision: Manuscript `REVISION_REQUESTED`, Series `REVISION_REQUESTED`.
- Editor can reject: Manuscript `REJECTED`, Series `REJECTED`.
- Editor can forward to Board: Manuscript `APPROVED_TO_BOARD`, Series `BOARD_REVIEW`.
- Wrong role cannot perform Editor proposal review actions.
- Production final approval remains in `submission-review.md`.

## Design Notes

- API uses explicit POST action endpoints under `/api/manuscripts/:manuscriptId`.
- Service layer owns status transition checks.
- System role `EDITOR` is required for proposal review actions.
- Board voting is not implemented in this story.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Model enum, version creation, submit status, Editor action transitions, wrong-role blocking. |
| Integration | Deferred; no live Mongo fixture in CI. |
| E2E | Not configured. |
| Platform | `npm run build --prefix server`, root build if server passes. |
| Release | N/A |

## Harness Delta

Story number follows backend sequence after payroll MVP.

## Evidence

- `npm test --prefix server`: pass on 2026-06-08, 15 files / 68 tests.
- `npm run build --prefix server`: pass on 2026-06-08.
- `npm run lint --prefix server`: pass on 2026-06-08.
- `npm run build`: pass on 2026-06-08; Vite emitted an existing chunk-size warning.
