# 0019 Board Voting Backend Rules

Date: 2026-06-08

## Status

Accepted

## Context

Series forwarded to Board need backend vote recording and finalize logic before production approval can happen.

## Decision

- Board members can cast one upserted vote per Series.
- Finalization requires minimum valid votes: `min(3, active eligible board users)`.
- Plurality winner finalizes to APPROVED / REJECTED / NEEDS_REVISION.
- Tie for highest count becomes `TIE_BREAK_REQUIRED`.
- Only Board Chair can resolve tie-break.
- Final board result updates Series status to `APPROVED`, `REJECTED`, or `REVISION_REQUESTED`.

## Alternatives Considered

1. Majority >50% requirement: rejected; contract uses plurality.
2. Admin override: rejected.
3. Separate Board Chair normal-vote bypass: rejected.

## Consequences

Positive:
- Board workflow now has backend enforcement.
- Series approval gate can rely on Board result.

Tradeoffs:
- No vote-deadline scheduler yet.
- No audit log yet.

## Follow-Up

- Add Board frontend workflow.
- Add vote-deadline/finalization timing.
- Add audit events.
