# MF-HIOS-074 Series Module Split

## Status

implemented

## Lane

normal

## Product Contract

Series creation, board visibility, manuscript upload draft, and submit behavior remain unchanged while series repository internals are split into focused repository and utility modules.

## Relevant Product Docs

- `docs/product/requirements.md`
- `docs/contracts/series-proposal.md`
- `docs/contracts/manuscript-review.md`
- `docs/contracts/main.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Make `series.repository.ts` a thin barrel export.
- Move slug generation into a utility.
- Split series persistence, manuscript persistence, and series submission behavior into dedicated repository modules.
- Preserve service/controller imports and API behavior.

Out of scope:

- New endpoints.
- Permission rule changes.
- Schema changes.
- Series workflow rule changes.

## Acceptance Criteria

- `server/src/modules/series/series.repository.ts` becomes a thin compatibility barrel.
- Series persistence, manuscript persistence, and submission logic live in separate modules.
- Existing series/manuscript tests pass.
- Server/client lint/build and docs verifiers pass.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Existing series and manuscript tests continue to pass. |
| Integration | Not required; API contract unchanged. |
| E2E | Not configured. |
| Platform | Server/client lint/build plus docs verifiers. |
| Release | Not applicable. |

## Manual QA

1. Create a series and confirm owner membership is created.
2. List series for Mangaka/Board and confirm visibility rules remain intact.
3. Create manuscript upload draft and confirm signed upload data still returns.
4. Submit a draft series with manuscript and confirm it transitions to editor review.

## Evidence

- `npm run lint --prefix server` -> PASS.
- `npm run build --prefix server` -> PASS.
- `npm run test --prefix server -- series manuscript chapter task submission comment publication board ranking dashboard accessPolicy env` -> PASS (18 files, 85 tests).
- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS (bundle-size warning only).
- Product contract, architecture docs, and UI design-system verifiers -> PASS.
- `server/src/modules/series/series.repository.ts` reduced to 3 lines.
