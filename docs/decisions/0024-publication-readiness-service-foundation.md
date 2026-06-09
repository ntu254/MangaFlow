# 0024 Publication Readiness Service Foundation

Date: 2026-06-09

## Status

Accepted

## Context

Publication readiness is a high-risk MVP gate. The contracts require readiness to be backend-owned by `PublicationReadinessService`; frontend screens must not duplicate the logic.

## Decision

Add a read-only backend readiness endpoint at `GET /api/chapters/:chapterId/readiness`. The service returns overall readiness plus item-level pass/fail reasons for the six contract checks.

Do not publish chapters, schedule publications, or mutate Chapter status in this story.

## Alternatives Considered

1. Frontend-only readiness calculation. Rejected because the contract makes readiness backend-owned.
2. Automatically set `READY_FOR_PUBLICATION` when checks pass. Rejected because status mutation needs a separate explicit workflow action and proof.

## Consequences

Positive:

- Publication readiness logic has a backend owner and unit proof.
- UI can later consume a contract-shaped readiness result.
- Publish behavior remains blocked until a separate endpoint enforces readiness.

Tradeoffs:

- No live Mongo/auth integration test yet.
- No publication scheduling or publishing endpoint yet.

## Follow-Up

- Add frontend readiness API wiring.
- Add publication schedule/publish endpoints that call this service before publishing.
- Add live forbidden-flow tests when HTTP auth fixtures exist.
