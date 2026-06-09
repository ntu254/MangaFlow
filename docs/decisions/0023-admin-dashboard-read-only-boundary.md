# 0023 Admin Dashboard Read-Only Boundary

Date: 2026-06-09

## Status

Accepted

## Context

The Admin Dashboard contract requires `GET /api/dashboard/admin/sidebar-summary`. The work touches an Admin-only route, so it needs a clear boundary that does not expand into role mutation, Board override, or broader Admin governance behavior.

## Decision

Implement a separate read-only dashboard module for `GET /api/dashboard/admin/sidebar-summary`, protected by `requireAuth` and `requireRole("ADMIN")`. The route returns counts, system health, storage summary, and audit preview only.

Do not mount or expose the existing untracked Admin mutation WIP in this story.

## Alternatives Considered

1. Mount a broad Admin module with user and Board member mutation routes. Rejected because it exceeds the Admin dashboard summary contract and increases authorization risk.
2. Keep the Admin UI hard-coded. Rejected because the contract requires backend counts.

## Consequences

Positive:

- Admin dashboard counts are backend-owned.
- Admin route protection is explicit.
- Board decision override remains forbidden.

Tradeoffs:

- User management, Board member management, Task Type management, and persistent audit logs remain future slices.
- Route-level forbidden-flow proof relies on shared middleware and compile/test coverage rather than live HTTP integration fixtures.

## Follow-Up

- Add live integration test coverage for non-Admin access when auth fixtures are available.
- Slice Admin user/Task Type/Board member management as separate high-risk stories if needed.
