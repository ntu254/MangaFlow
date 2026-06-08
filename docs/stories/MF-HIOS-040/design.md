# Design

## Domain Model

- `BoardMember(userId,isActive,isChair)`
- `BoardVote(seriesId,userId,value)` unique per user/series
- `BoardDecision(seriesId,status,result,decidedBy)` unique per series

## Application Flow

- Vote: Board member posts value; vote upserts and summary returns.
- Finalize: requires `BOARD_REVIEW` series and minimum vote count. Plurality winner updates Series; tie marks `TIE_BREAK_REQUIRED`.
- Tie-break: only chair may resolve `TIE_BREAK_REQUIRED`; result updates Series and decision.

## Interface Contract

- `POST /api/board/series/:seriesId/votes`
- `POST /api/board/series/:seriesId/decisions/finalize`
- `POST /api/board/series/:seriesId/decisions/tie-break`

## Data Model

Adds new Board collections only. No Series schema change.

## UI / Platform Impact

No frontend changes.

## Observability

Audit logging deferred.

## Alternatives Considered

1. Generic PATCH status: rejected.
2. Chair-only normal voting: rejected by contract; chair votes normally and tie-breaks separately.
