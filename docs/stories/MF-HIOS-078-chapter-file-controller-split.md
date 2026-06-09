# MF-HIOS-078 Chapter File Controller Split

## Status

implemented

## Lane

normal

## Product Contract

Page file upload/download, page-with-file retrieval, and region endpoint behavior remain unchanged while `file.controller.ts` is split into focused page/file and region controller modules.

## Relevant Product Docs

- `docs/product/requirements.md`
- `docs/contracts/page-workspace.md`
- `docs/contracts/chapter-production.md`
- `docs/contracts/main.md`
- `docs/architecture/api.md`
- `docs/architecture/security.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Make `file.controller.ts` a thin barrel export.
- Move page/file handlers into `controllers/page-file.controller.ts`.
- Move region handlers into `controllers/region.controller.ts`.
- Preserve route imports, response messages, and API behavior.

Out of scope:

- New endpoints.
- Signed URL policy changes.
- Permission rule changes.
- Validation schema changes.

## Acceptance Criteria

- `server/src/modules/chapter/file.controller.ts` becomes a thin compatibility barrel.
- Page/file and region handlers live in focused controller files.
- Existing route wiring remains stable.
- Server/client lint/build and related tests pass.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Existing chapter and access-policy tests continue to pass. |
| Integration | Not required; API contract unchanged. |
| E2E | Not configured. |
| Platform | Server/client lint/build plus docs verifiers. |
| Release | Not applicable. |

## Manual QA

1. Request presigned page upload URL.
2. Confirm page upload.
3. Request signed download URL with allowed actor.
4. Get page with file asset.
5. Create/list/get/update/delete regions.

## Evidence

- `npm run lint --prefix server` -> PASS.
- `npm run build --prefix server` -> PASS.
- `npm run test --prefix server -- chapter publication payroll dashboard admin series manuscript task submission comment board ranking accessPolicy env` -> PASS (20 files, 94 tests).
- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS (bundle-size warning only).
- Product contract, architecture docs, and UI design-system verifiers -> PASS.
- `server/src/modules/chapter/file.controller.ts` reduced from 136 to 2 lines.
