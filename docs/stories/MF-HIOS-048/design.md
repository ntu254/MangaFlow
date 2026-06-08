# Design

## Domain Model

Add `AtRiskDecisionRecord` in the Board module with:

- `seriesId`
- `decision`
- `decidedBy`
- optional `note`

## Application Flow

1. Board user calls `POST /api/board/series/:seriesId/at-risk-decisions`.
2. Route requires auth and `BOARD` role.
3. Service verifies the Series exists and is `AT_RISK`.
4. Service records the decision.
5. Service updates Series status:
   - `CONTINUE` -> `ONGOING`
   - `WARNING` -> `AT_RISK`
   - `REQUEST_IMPROVEMENT_PLAN` -> `AT_RISK`
   - `CANCEL` -> `CANCELLED`

## Interface Contract

```txt
POST /api/board/series/:seriesId/at-risk-decisions
```

Body:

```json
{
  "decision": "CONTINUE | WARNING | REQUEST_IMPROVEMENT_PLAN | CANCEL",
  "note": "optional text"
}
```

Errors:

- `404` if Series missing.
- `409` if Series is not `AT_RISK`.
- `403` from route middleware if caller is not Board.

## Data Model

Adds a Board at-risk decision collection for durable audit-like history. No migration script is needed for Mongo model addition.

## UI / Platform Impact

No UI change in this story.

## Observability

Decision record is retained in Mongo. Harness trace records proof.

## Alternatives Considered

1. Reuse `BoardDecision`. Rejected because proposal approval decisions and at-risk operational decisions are different workflows.
2. Auto-cancel from ranking thresholds. Rejected by contract; cancellation is manual Board decision.
