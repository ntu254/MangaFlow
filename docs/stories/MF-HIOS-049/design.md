# Design

## Domain Model

No new collection. Reuse existing Board queue, ranking, and at-risk decision backend artifacts.

## Application Flow

1. Board page loads queue and rankings.
2. Board page detects first `AT_RISK` series from queue.
3. `ReviewDecisionBar` actions call backend `POST /api/board/series/:seriesId/at-risk-decisions`.
4. UI displays backend result summary and refreshes queue.

## Interface Contract

Frontend helper:

```ts
createAtRiskDecision(seriesId, decision, note?)
```

Backend route registration is fixed inside `board.routes.ts` so Express mounts the endpoint before export.

## UI / Platform Impact

Board page now states at-risk is API-backed. Cancel action keeps explicit confirmation text because it triggers a real cancellation decision.

## Observability

Harness trace + existing server unit tests + compile/build validation.

## Alternatives Considered

1. Keep local preview copy. Rejected because backend endpoint now exists.
2. Add a new dedicated at-risk dialog. Rejected for this bounded slice; existing shared review decision component already provides confirmation affordance.
