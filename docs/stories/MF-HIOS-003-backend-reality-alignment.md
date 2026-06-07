# MF-HIOS-003 Backend Reality Alignment

## Status

implemented

## Lane

high-risk

## Task Type

Backend/API + Database + Auth/security validation

## Product Contract

- `docs/contracts/main.md`
- `docs/architecture/api.md`
- `docs/architecture/database.md`
- `docs/architecture/auth.md`
- `docs/architecture/security.md`
- `docs/MangaFlow-Business Workflow Specification.md`

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/CONTEXT_RULES.md`
- `docs/TRACE_SPEC.md`
- `docs/decisions/0016-backend-reality-alignment.md`

## Acceptance Criteria

- `series.repository.ts` exists and owns all direct Mongoose calls for the series module.
- `series.service.ts` calls repository functions only; no direct Mongoose model calls.
- `series.controller.ts` delegates business work to service and does not contain workflow logic.
- Error handling in the series module follows asyncHandler / global error middleware semantics.
- `SeriesStatus` uses the production-only MVP set without `PUBLISHED` or `READY_FOR_PUBLISHED`.
- Auth-related behavior present in the original implementation was excluded from this story and tracked separately.
- Branch hygiene followed the project rule: base branch `new`, merge target `new`, forbidden target `main`.

## Implementation Notes

- Moved series Mongoose calls into `server/src/modules/series/series.repository.ts`.
- Refactored `server/src/modules/series/series.service.ts` to use repository exports.
- Updated `server/src/modules/series/series.controller.ts` to delegate to service layer.
- Expanded `SeriesStatus` in `server/src/modules/series/series.model.ts`.
- Added/extended series service tests in `server/src/modules/series/series.service.test.ts`.
- Removed an out-of-scope auth service change via a dedicated cleanup branch before merge to `new`.

## Validation

Governance/alignment: completed.
Git branch hygiene: completed on branch `new`; `mf-hios-003-series-alignment` and `mf-hios-003-cleanup-auth-scope` were merged back into `new`.
Application build/test: `MF-HIOS-003 completed with validation caveat. Application build/test currently blocked by pre-existing tsconfig/moduleResolution/vitest/rollup typing issue.`

## Risks

- Build and test remain blocked by pre-existing TypeScript/Vitest/Rollup typing issues not introduced by this story.
- Other modules may still call Mongoose directly; repository pattern is not yet enforced outside the series module.
- Expanded `SeriesStatus` may require follow-up alignment in UI and API contracts.
