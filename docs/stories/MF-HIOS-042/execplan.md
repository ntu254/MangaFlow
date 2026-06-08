# Exec Plan

## Goal

Replace Board page Series-list dependency with a dedicated backend queue/read-summary endpoint.

## Scope

In scope:
- `GET /api/board/queue`
- backend queue projection with vote summary and decision status
- Board page consuming queue endpoint
- unit test for queue projection

Out of scope:
- ranking/at-risk integration
- board history pagination

## Risk Classification

Risk flags:
- Authorization-sensitive Board data
- Public API contract
- Existing UI behavior

Hard gates:
- Board data visibility

## Work Phases

1. Discovery
2. Backend queue endpoint
3. Frontend wiring
4. Validation
5. Harness update
6. Commit/push/merge
