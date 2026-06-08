# 0021 Dedicated Board Queue Endpoint

Date: 2026-06-08

## Status

Accepted

## Context

Board page was using `GET /series` and client-side filtering for Board queue rows. That mixed Board visibility rules into UI presentation.

## Decision

Add `GET /api/board/queue` as the Board-owned read model for approval queue summaries. It returns Series status, decision status, and backend vote counts.

## Alternatives Considered

1. Keep `GET /series` filtering in UI: rejected.
2. Add full Board dashboard/history now: deferred.

## Consequences

Positive:
- Board page no longer infers queue membership from generic Series API.
- Vote summaries are backend-provided.

Tradeoffs:
- Queue endpoint is still MVP-simple and unpaginated.

## Follow-Up

- Add pagination and Board history.
- Add ranking/at-risk read models.
