# 0027 Board At-Risk UI Route Registration Fix

Date: 2026-06-09

## Status

Accepted

## Context

The backend at-risk endpoint existed in code but was appended after `export default` in `board.routes.ts`, so the route would not be registered. The Board page also still described at-risk behavior as local-only preview despite the backend action existing.

## Decision

Fix the backend route registration and wire the Board page to call the backend at-risk decision endpoint with explicit confirmation copy for cancellation.

## Alternatives Considered

1. Leave UI local-only until a later story. Rejected because the backend action already exists and the stale UI text becomes misleading.
2. Add a new custom modal. Rejected because the shared `ReviewDecisionBar` already satisfies the confirmation requirement.

## Consequences

Positive:

- Board UI and backend are aligned.
- Cancellation remains explicit and confirmed.
- Backend permission checks remain authoritative.

Tradeoffs:

- No HTTP integration test yet.
- No decision history UI yet.

## Follow-Up

- Add live HTTP coverage for Board at-risk forbidden flows.
- Add Board decision history UI if needed.
