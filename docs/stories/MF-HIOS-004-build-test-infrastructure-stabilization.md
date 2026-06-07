# MF-HIOS-004 — Build/Test Infrastructure Stabilization

## Status

Completed with validation caveat

## Context

Build and test pipeline was blocked by a pre-existing toolchain typing issue. This story stabilized the infrastructure enough to restore reliable server build and test validation.

## Scope

Build/test infrastructure only. No new domain modules or business logic changes.

### Allowed

- `tsconfig` / `moduleResolution` alignment
- `vitest` typing / setup / config fixes
- `rollup` / `node_modules` typing issue handling
- `package.json` / test / build config changes if required for tooling stability
- Verify `npm run build`
- Verify `npm test` or equivalent test command

### Forbidden

- Add manuscript / board / chapter / task / submission module
- Refactor domain logic
- Change Series business rules
- Merge to `main`
- Commit `.env`

## Acceptance Criteria

1. Build command runs to completion without TS type errors.
2. Test command runs to completion without infrastructure errors.
3. No business/domain logic changes are introduced in this story.
4. Changes are limited to tooling/config files only.

## Implementation

### Changed files

- `server/src/modules/series/series.repository.ts`
- `client/package.json`
- `client/package-lock.json`
- `client/vitest.config.ts`

### Implemented

- Fixed server build failure caused by an unused `mongoose` import in `series.repository.ts`
- Added client test infrastructure scaffolding: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- Added `client/vitest.config.ts`
- Added a `test` script to `client/package.json`
- No domain logic or module additions

## Validation

- `npm run build --prefix server`: pass
- `npm test --prefix server`: pass (10/10 tests)
- `npm run build --prefix client`: pass
- `npm test --prefix client`: not run / not configured for this story scope

## Risks

- Client test infrastructure now exists but currently has no tests; this should not be interpreted as coverage progress.
- Server build fix is targeted; other modules may still contain similar toolchain issues.
- Full app validation was intentionally out of scope.

## Documentation

- `docs/contracts/main.md`
- `docs/architecture/overview.md`
- `docs/validation/test-plan.md`

## Follow-Up

- Await explicit direction before MF-HIOS-005 or any feature work
- If requested later, validate client tests with an explicit story that owns frontend testing
