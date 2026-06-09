# MF-HIOS-079 Chapter Controller Split

## Status

implemented

## Lane

normal

## Product Contract

Chapter lifecycle, page creation/listing, and chapter readiness endpoint behavior remain unchanged while `chapter.controller.ts` is split into focused lifecycle, page, and readiness controller modules.

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

- Make `chapter.controller.ts` a thin barrel export.
- Move chapter lifecycle handlers into `controllers/chapter-lifecycle.controller.ts`.
- Move page handlers into `controllers/page.controller.ts`.
- Move readiness handler into `controllers/chapter-readiness.controller.ts`.
- Preserve route imports, response messages, and API behavior.

Out of scope:

- New endpoints.
- Validation schema changes.
- Workflow rule changes.
- Readiness logic changes.

## Acceptance Criteria

- `server/src/modules/chapter/chapter.controller.ts` becomes a thin compatibility barrel.
- Lifecycle, page, and readiness handlers live in focused controller files.
- Existing route wiring remains stable.
- Server/client lint/build and related tests pass.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Existing chapter/publication and related tests continue to pass. |
| Integration | Not required; API contract unchanged. |
| E2E | Not configured. |
| Platform | Server/client lint/build plus docs verifiers. |
| Release | Not applicable. |

## Manual QA

1. Create chapter.
2. List/get chapter.
3. Update chapter status.
4. Create/list pages.
5. Read chapter readiness.

## Evidence

- `npm run lint --prefix server` -> PASS.
- `npm run build --prefix server` -> PASS.
- `npm run test --prefix server -- chapter publication payroll dashboard admin series manuscript task submission comment board ranking accessPolicy env` -> PASS (20 files, 94 tests).
- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS (bundle-size warning only).
- Product contract, architecture docs, and UI design-system verifiers -> PASS.
- `server/src/modules/chapter/chapter.controller.ts` reduced from 104 to 3 lines.
