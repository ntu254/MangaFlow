# MF-HIOS-077 Chapter Repository Split

## Status

implemented

## Lane

normal

## Product Contract

Chapter creation gate, page persistence, file confirmation, region persistence, and readiness data behavior remain unchanged while chapter repository internals are split into focused modules.

## Relevant Product Docs

- `docs/product/requirements.md`
- `docs/contracts/chapter-production.md`
- `docs/contracts/page-workspace.md`
- `docs/contracts/publication-ranking.md`
- `docs/contracts/main.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Make `chapter.repository.ts` a thin barrel export.
- Split chapter lifecycle persistence.
- Split page/file persistence.
- Split region persistence.
- Split readiness data aggregation.
- Preserve service imports and API behavior.

Out of scope:

- New endpoints.
- Schema changes.
- Signed URL policy changes.
- Publication readiness rule changes.

## Acceptance Criteria

- `server/src/modules/chapter/chapter.repository.ts` becomes a thin compatibility barrel.
- Chapter, page/file, region, and readiness repository concerns live separately.
- Existing chapter/publication/related tests pass.
- Server/client lint/build and docs verifiers pass.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Existing chapter/publication and related tests pass. |
| Integration | Not required; API contract unchanged. |
| E2E | Not configured. |
| Platform | Server/client lint/build plus docs verifiers. |
| Release | Not applicable. |

## Manual QA

1. Create a chapter for approved/ongoing/at-risk series only.
2. Create/list pages and confirm upload.
3. Create/list/archive/delete regions.
4. Read chapter readiness data.
5. Confirm readiness rule behavior remains backend-owned.

## Evidence

- `npm run lint --prefix server` -> PASS.
- `npm run build --prefix server` -> PASS.
- `npm run test --prefix server -- chapter publication payroll dashboard admin series manuscript task submission comment board ranking accessPolicy env` -> PASS (20 files, 94 tests).
- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS (bundle-size warning only).
- Product contract, architecture docs, and UI design-system verifiers -> PASS.
- `server/src/modules/chapter/chapter.repository.ts` reduced from 171 to 4 lines.
