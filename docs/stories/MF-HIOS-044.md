# MF-HIOS-044 Board Ranking UI API Wiring

## Lane

Normal.

## Summary

Wire the Board ranking panel to backend ranking endpoints so Board users can list imported rankings, import a row, and finalize the top imported row from the UI.

## Product docs

- `docs/contracts/publication-ranking.md`
- `docs/contracts/main.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

- Add `GET /api/rankings` for Board users.
- Add client ranking API helpers.
- Replace local Board ranking preview rows with API-backed list/import/finalize actions.
- Preserve at-risk as local-only preview.

## Acceptance criteria

- Ranking rows are loaded from backend and sorted by final score.
- Import action calls `POST /api/rankings/import` and keeps backend MVP formula ownership.
- Finalize action calls `POST /api/rankings/:id/finalize`.
- Board page text clearly states ranking is API-backed and at-risk remains local-only.
- No frontend-only permission shortcut is introduced; backend route stays auth + Board-role protected.

## Validation

- `npm run test --prefix server` -> pass, 17 files / 80 tests.
- `npm run lint --prefix server` -> pass.
- `npm run lint --prefix client` -> pass.
- `npm run build` -> pass; Vite chunk-size warning only.
- `git diff --check` -> pass.

## Risks

- Browser E2E not configured.
- Manual QA still needs a live Board token and MongoDB data.
