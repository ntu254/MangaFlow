# MF-HIOS-067 Series Detail Page Componentization

## Status

implemented

## Lane

normal

## Product Contract

Series Detail keeps current series/chapter read behavior while separating route composition, data hook, chapter mappers, and series panels.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/series-proposal.md`
- `docs/contracts/chapter-production.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Extract `useSeriesDetail` for series/chapter loading and local manuscript file selection state.
- Extract `series-detail.mappers.tsx` for chapter rows, chapter gate, and action metadata.
- Extract `SeriesDetailPanels.tsx` for overview, chapter list, and page-preview boundary panels.
- Preserve current API behavior:
  - `GET /api/series/:id`
  - `GET /api/chapters/series/:seriesId`

Out of scope:

- Signed manuscript upload wiring.
- Page preview/file access wiring.
- Backend permission/workflow changes.

## Acceptance Criteria

- `SeriesDetailPage.tsx` becomes a thin composition page.
- `useSeriesDetail` owns load/error state and local manuscript selections.
- `series-detail.mappers.tsx` owns chapter row transforms and chapter gate constants.
- Overview, chapter list, and page-boundary rendering leave the page file.
- Existing series/chapter API behavior remains unchanged.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not required; frontend componentization only. |
| Integration | Not required; no backend behavior changes. |
| E2E | Not configured. |
| Platform | `npm run lint --prefix client` and `npm run build --prefix client`. |
| Release | Not applicable. |

## Evidence

- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS.
- `SeriesDetailPage.tsx` reduced from 266 lines to 38 lines.
