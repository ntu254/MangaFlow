# MF-HIOS-009 Series Proposal Backend

## Status

Blocked after implementation: code validation passed, but HI-OS CLI validation is unavailable because `scripts/bin/harness-cli.exe` is missing.

## Lane

Normal

## Task Type

Backend/API + Database + Auth/security validation

## Product Contract

- `docs/contracts/series-proposal.md`
- `docs/contracts/main.md`

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/product/out-of-scope.md`
- `docs/architecture/api.md`
- `docs/architecture/database.md`
- `docs/architecture/security.md`
- `docs/validation/test-plan.md`

## Acceptance Criteria

- Mangaka can create a Series proposal.
- New Series starts as `DRAFT`.
- Owner Mangaka is auto-created as `SeriesMember`.
- Submit is blocked when no initial Manuscript exists.
- Submit changes valid draft Series to `EDITOR_REVIEW`.
- Public catalog behavior remains out of scope.

## Implementation Notes

- Added backend `series` module with Mongoose models, Zod validation, service, controller, and routes.
- Mounted routes under `/api/series`.
- Enforced backend `requireAuth` and `requireRole("MANGAKA")`.
- Used authenticated JWT user id as owner; no client-provided owner id is trusted.

## Validation

- `npm test --prefix server`: passed, 3 tests.
- `npm run build --prefix server`: passed.
- `npm run lint --prefix server`: passed.
- `npm run build --prefix client`: passed, with Vite chunk-size warning.
- `npm run lint --prefix client`: passed.
- `npm run build`: passed, with Vite chunk-size warning.
- `npm run lint`: passed.
- `npm test`: not available at root, missing script.
- `.\scripts\bin\harness-cli.exe arch-check --story MF-HIOS-009`: blocked, executable missing.
- `.\scripts\bin\harness-cli.exe story verify MF-HIOS-009`: blocked, executable missing.

## Risks

- No integration test with a real MongoDB instance exists yet.
- Manuscript upload/API is not implemented; this story only checks for an existing manuscript record.
- `npm audit --prefix server --audit-level=high` reports 5 vulnerabilities through Vitest/Vite/esbuild; suggested fix is breaking.

## Harness Delta

- Story packet added because the durable HI-OS CLI is missing in this checkout.
- Context pack generation was attempted and failed because `scripts/bin/harness-cli.exe` is absent.
