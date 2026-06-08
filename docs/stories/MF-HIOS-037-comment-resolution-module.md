# MF-HIOS-037 Comment Resolution Module

## Status

implemented

## Lane

high-risk

## Product Contract

Implement backend comment lifecycle for production review. Comments start open,
Assistants mark fixes, Mangaka verifies fixes, and Editor resolves or reopens
blocking comments.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/comment-resolution.md`
- `docs/contracts/submission-review.md`
- `docs/contracts/workflow-status.md`
- `docs/architecture/api.md`
- `docs/architecture/database.md`
- `docs/architecture/auth.md`
- `docs/architecture/security.md`
- `docs/validation/test-plan.md`

## Acceptance Criteria

- `Comment` model stores canonical `CommentStatus` values.
- `POST /api/comments` creates an `OPEN` blocking comment by an Editor.
- `POST /api/comments/:id/mark-fixed` allows only the assigned Assistant to move `OPEN -> FIXED_BY_ASSISTANT`.
- `POST /api/comments/:id/verify-fixed` allows Mangaka to move `FIXED_BY_ASSISTANT -> VERIFIED_BY_MANGAKA`.
- `POST /api/comments/:id/resolve` allows Editor to move `VERIFIED_BY_MANGAKA -> RESOLVED_BY_EDITOR`.
- `POST /api/comments/:id/reopen` allows Editor to move `FIXED_BY_ASSISTANT` or `VERIFIED_BY_MANGAKA` back to `OPEN`.
- Wrong role cannot skip lifecycle states.
- Blocking unresolved comment helper is available for future publication readiness service.

## Design Notes

- API uses explicit POST action endpoints, not generic status patches.
- Service layer owns role and transition checks.
- Assistant access remains task-based through `Task.assignedTo`.
- This story does not implement `PublicationReadinessService`.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Comment lifecycle, wrong-role blocking, unresolved blocker helper. |
| Integration | Deferred; no live Mongo fixture in CI. |
| E2E | Not configured. |
| Platform | `npm run build --prefix server`, root build if server passes. |
| Release | N/A |

## Harness Delta

Story number avoids the existing `MF-HIOS-035` conflict between series API
integration and older comment-resolution follow-up notes.

## Evidence

- `npm test --prefix server`: pass on 2026-06-08, 11 files / 52 tests.
- `npm run build --prefix server`: pass on 2026-06-08.
- `npm run build`: pass on 2026-06-08; Vite emitted an existing chunk-size warning.
- `npm run lint --prefix server`: pass on 2026-06-08.
