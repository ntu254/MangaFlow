# MF-HIOS-083 Series Page Componentization

## Status

implemented

## Lane

normal

## Product Contract

Series page keeps the current series listing, proposal creation, selection, and manuscript upload behavior while moving state, mapping, and panels out of the route shell.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/series-proposal.md`
- `docs/contracts/manuscript-review.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Extract `SeriesPage` data/state/mutation logic into `client/src/features/series/hooks/useSeriesPage.ts`.
- Extract list rendering into `client/src/features/series/components/SeriesListPanel.tsx`.
- Extract pure row/upload option transforms into `client/src/features/series/utils/series-page.mappers.ts`.
- Keep `client/src/features/series/pages/SeriesPage.tsx` as a thin composition shell.
- Preserve existing API calls and current signed manuscript upload flow.

Out of scope:

- New backend endpoints or schema changes.
- New authorization rules or role-scope behavior.
- Admin series monitor reuse; that is tracked by MF-HIOS-088.
- Browser E2E setup.

## Acceptance Criteria

- `SeriesPage.tsx` primarily composes layout, hook output, and extracted components.
- Series list load/create/select behavior remains unchanged.
- Manuscript upload flow remains wired through the existing shared upload panel/API helpers.
- Empty/loading/error states remain present.
- No frontend-only permission shortcut is introduced.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not required unless new mapper complexity warrants targeted tests. |
| Integration | Not required; no backend/API behavior changes. |
| E2E | Not configured. |
| Platform | `npm run lint --prefix client`, `npm run build --prefix client`. |
| Harness | `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-083.ps1`, then `scripts/bin/harness-cli.exe story verify MF-HIOS-083` after trace/proof records. |
| Release | Not applicable. |

## Evidence

- `client/src/features/series/pages/SeriesPage.tsx` reduced to 60 lines.
- `client/src/features/series/hooks/useSeriesPage.ts` owns series loading, create callback, upload target state, and manuscript upload URL request state.
- `client/src/features/series/components/SeriesListPanel.tsx` owns list/card/gate rendering.
- `client/src/features/series/utils/series-page.mappers.ts` owns pure Series row and upload option transforms.
- `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-083.ps1` -> PASS.
- `scripts/bin/harness-cli.exe arch-check --story MF-HIOS-083` -> PASS.
