# Exec Plan

## Goal

Connect Board page to existing backend APIs without moving workflow logic into the client.

## Scope

In scope:
- Board API client.
- Queue via `GET /series` filtered for Board-visible statuses.
- Vote, finalize, and tie-break action wiring.
- Loading/error/live action states.

Out of scope:
- Dedicated Board read endpoint.
- Ranking import backend.
- At-risk backend.

## Risk Classification

Risk flags:
- Authorization-sensitive UI triggers.
- Public API behavior.
- Existing behavior change.

Hard gates:
- Board decision logic must remain backend-owned.

## Work Phases

1. Discovery.
2. Wiring.
3. Validation.
4. Harness update.
5. Commit/push/merge.

## Stop Conditions

Pause if UI needs to infer majority or tie-break results locally.
