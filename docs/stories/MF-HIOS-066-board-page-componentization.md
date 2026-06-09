# MF-HIOS-066 Board Page Componentization

## Status

implemented

## Lane

normal

## Product Contract

Board Page keeps current queue, vote, ranking, and at-risk API behavior while separating route composition, data hook, mapper logic, and workflow panels.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/board-approval.md`
- `docs/contracts/publication-ranking.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-board.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Extract `useBoardPage` for queue, ranking, vote, at-risk, and action state.
- Extract `board-page.mappers.tsx` for queue rows, ranking rows, board actions, and vote options.
- Extract `BoardPanels.tsx` for queue, vote, ranking, at-risk, and state preview rendering.
- Preserve current API behavior:
  - `GET /api/board/queue`
  - `POST /api/board/series/:seriesId/votes`
  - `POST /api/board/series/:seriesId/decisions/finalize`
  - `POST /api/board/series/:seriesId/decisions/tie-break`
  - `POST /api/board/series/:seriesId/at-risk-decisions`
  - `GET /api/rankings`
  - `POST /api/rankings/import`
  - `POST /api/rankings/:rankingId/finalize`

Out of scope:

- New backend decision logic.
- Board Chair role-policy changes.
- UI redesign.

## Acceptance Criteria

- `BoardPage.tsx` becomes a thin composition page.
- `useBoardPage` owns queue/ranking loading and action state.
- `board-page.mappers.tsx` owns queue/ranking/action/vote transforms.
- Queue, vote, ranking, at-risk, and preview rendering leave the page file.
- Existing backend board/ranking behavior remains unchanged.

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
- `BoardPage.tsx` reduced from 269 lines to 29 lines.
