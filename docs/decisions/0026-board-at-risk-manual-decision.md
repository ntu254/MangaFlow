# 0026 Board At-Risk Manual Decision

Date: 2026-06-09

## Status

Accepted

## Context

The publication/ranking contract requires at-risk handling to remain manual Board decision behavior. Series must not be auto-cancelled from ranking data, and Admin must not override Board decisions.

## Decision

Add `POST /api/board/series/:seriesId/at-risk-decisions` as a Board-only action. The service records a dedicated at-risk decision record and permits decisions only while the Series is `AT_RISK`. `CANCEL` transitions the Series to `CANCELLED`.

## Alternatives Considered

1. Auto-cancel low ranking Series. Rejected by contract.
2. Let Admin cancel at-risk Series. Rejected by Board decision invariant.
3. Store at-risk decisions in proposal `BoardDecision`. Rejected because proposal approval and at-risk lifecycle decisions are distinct.

## Consequences

Positive:

- At-risk cancellation is manual and auditable.
- Admin override remains forbidden.
- Ranking import remains separate from lifecycle cancellation.

Tradeoffs:

- No frontend at-risk wiring yet.
- No live HTTP authorization fixture yet.

## Follow-Up

- Wire Board UI at-risk actions to backend endpoint.
- Add live forbidden-flow tests when auth fixtures exist.
