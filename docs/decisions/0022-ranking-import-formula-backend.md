# 0022 Ranking Import Formula Backend

Date: 2026-06-08

## Status

Accepted

## Context

Ranking formula is product-critical and must not be duplicated in frontend code.

## Decision

Add Board-only ranking import and finalize backend endpoints. Backend calculates finalScore as `voteCount * 0.7 + (readerScore * 10) * 0.3`, rounded to 2 decimals.

## Alternatives Considered

1. Frontend formula: rejected.
2. Auto-cancel/at-risk during import: rejected.

## Consequences

Positive:
- Formula is backend-owned and tested.
- Ranking data can be imported idempotently per period/Series.

Tradeoffs:
- No CSV/bulk import yet.
- No ranking UI wiring yet.

## Follow-Up

- Add ranking UI import wiring.
- Add at-risk decision endpoint.
