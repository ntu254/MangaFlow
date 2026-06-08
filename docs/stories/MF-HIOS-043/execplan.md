# Exec Plan

## Goal

Add Ranking import/finalize backend with formula proof.

## Scope

In scope:
- Ranking model
- `POST /api/rankings/import`
- `POST /api/rankings/:id/finalize`
- Board-only access
- formula tests

Out of scope:
- ranking import UI
- at-risk decision workflow

## Risk Classification

Risk flags:
- API contract
- data model write
- Board-only operation
- formula correctness

Hard gates:
- ranking formula

## Work Phases

1. Discovery
2. Backend implementation
3. Validation
4. Harness update
5. Commit/push/merge
