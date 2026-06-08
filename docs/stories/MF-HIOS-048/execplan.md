# Exec Plan

## Goal

Add the backend Board at-risk decision action required by the publication/ranking contract.

## Scope

In scope:

- At-risk decision record model.
- `POST /api/board/series/:seriesId/at-risk-decisions`.
- Board-only route guard.
- Service validation that Series must be `AT_RISK`.
- Manual transition for `CANCEL` to `CANCELLED`.

Out of scope:

- Frontend wiring.
- Automatic ranking-to-at-risk transitions.
- Admin overrides.

## Risk Classification

Risk flags:

- Authorization.
- Data model.
- Public contracts.
- Existing behavior.
- Weak proof.

Hard gates:

- Board decision logic.

## Work Phases

1. Discovery.
2. Design.
3. Validation planning.
4. Implementation.
5. Verification.
6. Harness update.

## Stop Conditions

Pause if rule changes are needed for Admin override, auto-cancellation, or ranking formula behavior.
