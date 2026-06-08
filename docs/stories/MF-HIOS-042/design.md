# Design

## Domain Model

No new collections.

## Application Flow

- `GET /api/board/queue` requires Board role.
- Repository loads Board-visible Series and linked decision/votes.
- Service returns summary rows with Series status, decision status, and vote counts.
- Board page consumes queue rows directly.

## Interface Contract

`GET /api/board/queue`

Returns rows:

```json
{
  "id": "series-id",
  "seriesTitle": "Title",
  "ownerId": "user-id",
  "seriesStatus": "BOARD_REVIEW",
  "decisionStatus": "PENDING",
  "voteSummary": { "APPROVE": 1, "REJECT": 0, "NEEDS_REVISION": 0 },
  "updatedAt": "..."
}
```

## UI / Platform Impact

Board page no longer imports Series API for queue loading.

## Alternatives Considered

1. Keep client filtering from Series API: rejected.
2. Add full Board history endpoint: deferred.
