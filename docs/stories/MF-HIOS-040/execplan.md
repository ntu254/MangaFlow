# Exec Plan

## Goal

Implement backend Board voting flow with plurality finalize and chair-only tie-break.

## Scope

In scope:
- BoardMember, BoardVote, BoardDecision models.
- Cast vote endpoint.
- Finalize decision endpoint.
- Tie-break endpoint.
- Series status updates from Board result.
- Unit tests.

Out of scope:
- Board dashboard wiring.
- Deadline scheduler.
- Audit logs.

## Risk Classification

Risk flags:
- Authorization
- Workflow decision logic
- Public API contract
- Data model write

Hard gates:
- Board decision logic
- Admin override prohibition

## Work Phases

1. Discovery.
2. Implementation.
3. Validation.
4. Harness update.
5. Commit/push/merge.

## Stop Conditions

Pause if Board Chair identity or Board membership seeding rules change materially.
