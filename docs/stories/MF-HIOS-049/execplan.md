# Exec Plan

## Goal

Wire the Board page at-risk actions to the backend endpoint and fix the server route registration defect.

## Scope

In scope:

- Board frontend API helper for at-risk decisions.
- Board page confirmation actions for continue/request-plan/cancel.
- Backend route registration fix for `POST /api/board/series/:seriesId/at-risk-decisions`.
- Updated Board page copy to reflect real backend behavior.

Out of scope:

- Additional backend board rules.
- Board history UI.
- E2E browser automation.

## Risk Classification

Risk flags:

- Authorization.
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

Pause if UI wiring requires new backend permissions or changes to manual-cancellation rules.
