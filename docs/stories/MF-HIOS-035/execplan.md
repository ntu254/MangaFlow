# Exec Plan

## Goal

Connect frontend Series screens to real backend API with role-based authorization.

## Scope

In scope:

- `GET /api/series` with Mangaka owner filter, Board status filter, Assistant block.
- `GET /api/series/:seriesId` with owner/role access enforcement.
- Frontend API client wiring.
- Frontend empty/loading/error states.
- Unit + integration tests for authorization rules.

Out of scope:

- Series creation backend (remains frontend-local for now).
- Manuscript upload and signed URL.
- Task-scoped Assistant access to specific chapters/pages.
- Board approval gate mutation logic.

## Risk Classification

Risk flags:

- Authorization (Assistant block, owner check, Board status filter).
- API contract (new public endpoints).
- Existing behavior (frontend was mocked, now real).
- Weak proof (no E2E Series authorization tests exist yet).

Hard gates:

- Authorization (Assistant must not access broad Series list/detail).

## Work Phases

1. ✅ Discovery: read contracts, auth rules, security rules.
2. ✅ Design: define repo/service/controller/routes layers.
3. ✅ Validation planning: unit for service authorization, integration for routes, manual QA for frontend states.
4. 🚧 Implementation: write service/controller/routes, wire frontend API, update tests.
5. ⏳ Verification: run tests, build, manual QA.
6. ⏳ Harness update: record trace, update story status.

## Stop Conditions

Pause for human confirmation if:

- Assistant access rule conflicts with task-scoped design.
- Board status filter list differs from product contract.
- Validation requirements cannot be satisfied without E2E infrastructure.
