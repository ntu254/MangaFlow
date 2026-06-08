# MF-HIOS-048 Board At-Risk Decision Backend

## Current Behavior

Ranking import/finalize exists and Board UI still shows at-risk actions as local-only preview. The API contract requires `POST /api/board/series/:seriesId/at-risk-decisions` and manual Board cancellation behavior.

## Target Behavior

Board users can record a manual at-risk decision for a Series in `AT_RISK` status. `CANCEL` transitions the Series to `CANCELLED`; other at-risk decisions keep or restore production status according to workflow rules.

## Affected Users

- Editorial Board.
- Board Chair.

## Affected Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/publication-ranking.md`
- `docs/contracts/workflow-status.md`
- `docs/architecture/api.md`
- `docs/architecture/database.md`
- `docs/architecture/auth.md`
- `docs/architecture/security.md`
- `docs/validation/test-plan.md`

## Non-Goals

- No frontend Board at-risk wiring.
- No automatic cancellation from rankings.
- No Admin override.
- No public catalog/reader behavior.
