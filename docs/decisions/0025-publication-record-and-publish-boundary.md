# 0025 Publication Record and Publish Boundary

Date: 2026-06-09

## Status

Accepted

## Context

Publication is a separate MVP workflow from readiness. The contract requires readiness to be backend-owned and the chapter to publish only when readiness passes.

## Decision

Implement a Publication record plus explicit schedule/publish endpoints. Publish will consult `PublicationReadinessService` and only then transition the chapter to `READY_FOR_PUBLICATION` and `PUBLISHED` in backend service logic.

## Alternatives Considered

1. Store publish state only on Chapter. Rejected because publication needs its own audit record.
2. Auto-publish as soon as readiness becomes true. Rejected because publication must remain an explicit Editor action.

## Consequences

Positive:

- Publication actions are explicit and auditable.
- Readiness remains backend-owned.
- Chapter state transition is gated by the readiness result.

Tradeoffs:

- No UI workflow yet.
- No scheduled job automation yet.

## Follow-Up

- Add frontend wiring.
- Add tests for forbidden publish attempts once HTTP fixtures exist.
