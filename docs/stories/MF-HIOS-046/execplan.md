# Exec Plan

## Goal

Create the backend-owned publication readiness foundation required by the MVP contract.

## Scope

In scope:

- `GET /api/chapters/:chapterId/readiness`.
- `PublicationReadinessService` checklist result.
- Repository aggregation for chapter, pages, tasks, submissions, and blocking comments.
- Unit tests for blocked and passing readiness states.

Out of scope:

- Publishing a chapter.
- Scheduling publications.
- Mutating chapter status.
- Frontend API integration.

## Risk Classification

Risk flags:

- Authorization.
- Public contracts.
- Existing behavior.
- Weak proof.

Hard gates:

- Publication readiness logic.

## Work Phases

1. Discovery: read publication, workflow, API, database, and validation docs.
2. Design: keep readiness backend-owned and read-only.
3. Validation planning: service unit tests and root build.
4. Implementation: repository query, service checklist, controller, route.
5. Verification: server tests, lint, build, diff-check, story verify.
6. Harness update: intake, context, decision, trace, story evidence.

## Stop Conditions

Pause if implementation needs publishing behavior, schedule mutation, status transition mutation, schema migration, or permission model changes.
