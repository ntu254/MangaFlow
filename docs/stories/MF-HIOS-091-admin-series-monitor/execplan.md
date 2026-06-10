# Exec Plan

## Goal

Add a safe read-only Admin Series Monitor using existing backend access rules.

## Scope

In scope:

- Add regression test for Admin Series list access.
- Add client admin series hook/page.
- Replace the Admin Series placeholder route.
- Add verification script and Harness proof.

Out of scope:

- New workflow transitions.
- Admin mutation endpoints for Series.
- Board, Editor, or Mangaka approval behavior.

## Risk Classification

Risk flags:

- Authorization.
- Public contracts.
- Existing behavior.
- Weak proof.

Hard gates:

- Admin must not override Board or Editor workflow decisions.

## Work Phases

1. Add focused backend access test.
2. Implement Admin Series Monitor UI.
3. Add verification script.
4. Run validation.
5. Update Harness story evidence and trace.

## Stop Conditions

Pause for human confirmation if:

- Admin needs any state-changing Series action.
- Series access rules differ from existing contracts.
- Validation requirements need to be weakened.

