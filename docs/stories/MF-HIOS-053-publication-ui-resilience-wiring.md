# MF-HIOS-053 Publication UI Resilience Wiring

## Status

implemented

## Lane

normal

## Product Contract

Chapter Detail publication controls must call backend publication/readiness APIs, show recoverable loading/error states, and avoid duplicating publication readiness rules in frontend code.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/publication-ranking.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/architecture/overview.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Acceptance Criteria

- Readiness loading always resolves through success, backend failure, or network failure state.
- Publication create/schedule/publish actions show loading state and recoverable network failure copy.
- UI does not calculate readiness locally; it renders backend `GET /api/chapters/:id/readiness` output or explicit fallback messaging.
- Publish still uses explicit backend `POST /api/publications/:id/publish`; no frontend permission shortcut is added.

## Design Notes

- Commands: no new backend command.
- Queries: `GET /api/chapters/:id/readiness`.
- API actions: `POST /api/publications`, `POST /api/publications/:id/schedule`, `POST /api/publications/:id/publish`.
- Tables: no database changes.
- Domain rules: backend remains source of truth for readiness and publish gate.
- UI surfaces: `ChapterDetailPage`.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Existing server tests continue to pass. |
| Integration | Deferred; no live HTTP auth fixture in CI. |
| E2E | Not configured. |
| Platform | Client lint/build and root build pass. |
| Release | Not applicable. |

## Evidence

- `npm run lint --prefix client` -> pass.
- `npm run test --prefix server` -> pass, 20 files / 90 tests.
- `npm run build` -> pass; Vite chunk-size warning only.
- `git diff --check` -> pass; LF-to-CRLF warning only.
