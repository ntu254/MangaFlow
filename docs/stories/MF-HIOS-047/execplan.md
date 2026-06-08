# Exec Plan

## Goal

Add the minimal backend publication record, schedule, and publish flow that consumes the readiness service.

## Scope

In scope:

- `POST /api/publications`.
- `POST /api/publications/:id/schedule`.
- `POST /api/publications/:id/publish`.
- Publication model and service checks.
- Chapter status transition to `READY_FOR_PUBLICATION` then `PUBLISHED` only when readiness passes.

Out of scope:

- Frontend integration.
- Reader/catalog surfaces.
- Auto-publish scheduling jobs.
- Public publication feed.

## Risk Classification

Risk flags:

- Authorization.
- Data model.
- Public contracts.
- Existing behavior.
- Weak proof.

Hard gates:

- Publication readiness logic.
- Chapter status transitions.

## Work Phases

1. Discovery.
2. Design.
3. Validation planning.
4. Implementation.
5. Verification.
6. Harness update.

## Stop Conditions

Pause if the flow requires schedule automation, public catalog behavior, or changes to readiness ownership.
