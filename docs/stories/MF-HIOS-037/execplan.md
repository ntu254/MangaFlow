# Exec Plan

## Goal

Implement Editor proposal review action endpoints for manuscripts.

## Scope

In scope:

- Add Manuscript canonical status field.
- Sync Manuscript status to `EDITOR_REVIEW` when Series submit moves to Editor review.
- Implement `POST /api/manuscripts/:id/request-revision`.
- Implement `POST /api/manuscripts/:id/forward-to-board`.
- Implement `POST /api/manuscripts/:id/reject`.
- Enforce Editor-only route access.
- Unit tests for all three transitions and invalid state guard.

Out of scope:

- Board vote module.
- Frontend review queue wiring.
- Audit log implementation.

## Risk Classification

Risk flags:

- Authorization.
- Workflow status transition.
- Public API contract.
- Data model write.

Hard gates:

- Editor workflow decision logic.

## Work Phases

1. Discovery.
2. Implementation.
3. Validation.
4. Harness update.
5. Commit, push, merge into `new`.

## Stop Conditions

Pause if Board decision rules or Admin override behavior becomes necessary.
