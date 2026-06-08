# Design

## Domain Model

No new backend entities.

## Application Flow

- Load queue with `listSeries()`.
- Filter Board-visible rows in client for display.
- Trigger backend actions through explicit Board endpoints.
- Refresh queue after finalize/tie-break.

## Interface Contract

- `GET /api/series`
- `POST /api/board/series/:seriesId/votes`
- `POST /api/board/series/:seriesId/decisions/finalize`
- `POST /api/board/series/:seriesId/decisions/tie-break`

## UI / Platform Impact

Board page becomes partial live-data page:
- queue and voting live
- ranking preview local
- at-risk preview local

## Observability

No new telemetry.

## Alternatives Considered

1. Keep full page mocked: rejected.
2. Compute plurality in client: rejected.
3. Add dedicated Board queue endpoint in same story: deferred.
