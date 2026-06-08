# 0020 Board Page Uses Explicit Backend Actions

Date: 2026-06-08

## Status

Accepted

## Context

Board page needs to stop pretending workflow state while preserving backend ownership of plurality, finalize, and tie-break decisions.

## Decision

Board page uses existing backend endpoints for vote, finalize, and tie-break. Client may display queue state and summaries, but must not compute authoritative result state.

## Alternatives Considered

1. Local-only vote state: rejected.
2. Client-side decision computation: rejected.
3. New dedicated queue endpoint first: deferred.

## Consequences

Positive:
- Real Board actions available in UI.
- Backend remains source of truth.

Tradeoffs:
- Queue still piggybacks on `GET /series`.
- Ranking/at-risk remain mixed live/local surface.

## Follow-Up

- Add dedicated Board queue/read-summary endpoint.
- Wire ranking import and at-risk backend workflows.
