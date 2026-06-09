# MF-HIOS-049 Board At-Risk UI API Wiring

## Current Behavior

Board backend supports manual at-risk decisions, but the Board page previously showed local-only preview behavior. During inspection, the new backend at-risk route was also appended after `export default`, leaving it unregistered.

## Target Behavior

Board UI calls the backend at-risk endpoint with explicit confirmation and displays backend results. Board route registration is fixed so the endpoint is reachable.

## Affected Users

- Editorial Board.
- Board Chair.

## Affected Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/publication-ranking.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-board.md`
- `docs/architecture/api.md`
- `docs/architecture/auth.md`
- `docs/architecture/security.md`
- `docs/validation/test-plan.md`

## Non-Goals

- No public catalog or reader UI.
- No Admin override path.
- No automated ranking-to-cancel behavior.
