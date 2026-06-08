# Exec Plan

## Goal

Create code-level workflow status constants/types and align the existing Series
status usage with the canonical workflow status contract.

## Scope

In scope:

- Add server shared workflow status constants/types.
- Refactor Series model and repository to import shared Series status values.
- Align client Series API status type and status UI map.
- Add focused unit tests for constants and Series model enum alignment.
- Run server/client build, lint, and server tests.

Out of scope:

- Status transition services.
- Board decision logic.
- Publication readiness logic.
- Payroll calculation.
- Database migration.
- New endpoints.

## Risk Classification

Risk flags:

- Data model.
- Public contracts.
- Existing behavior.
- Weak proof.

Hard gates:

- Database enum validation touches persisted workflow state, so no destructive
  migration or narrowing is allowed.

## Work Phases

1. Discovery.
2. Story packet.
3. Add shared constants.
4. Align Series/server/client usage.
5. Add focused tests.
6. Validate.
7. Trace and story verify.

## Stop Conditions

Pause for human confirmation if:

- A database migration becomes necessary.
- Existing runtime behavior must change beyond enum alignment.
- Validation requirements cannot be run.
