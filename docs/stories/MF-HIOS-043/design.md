# Design

## Domain Model

`Ranking(period, seriesId, voteCount, readerScore, finalScore, status)` with unique `(period, seriesId)`.

## Formula

```txt
finalScore = voteCount * 0.7 + (readerScore * 10) * 0.3
```

Rounded to 2 decimals.

## Interface Contract

- `POST /api/rankings/import`
- `POST /api/rankings/:id/finalize`

## UI / Platform Impact

No frontend changes.

## Alternatives Considered

1. Calculate score in frontend: rejected.
2. Auto-create at-risk state on import: rejected; at-risk is Board decision.
