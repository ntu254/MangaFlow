# Exec Plan

## Goal

Make recommender AI prompts use real quiz/profile data from `profiles`, without
using mock recommender data as the behavior source.

## Scope

In scope:

- Client-side profile context loading in recommender service.
- Edge function server-side profile loading and prompt inclusion.
- Unit tests proving profile context is included.
- Harness story, intake, trace, and governance proof.

Out of scope:

- Database schema migration.
- Visual redesign.
- Recommender ranking algorithm overhaul.

## Risk Classification

Risk flags:

- External systems.
- Public contracts.
- Existing behavior.
- Weak proof.

Hard gates:

- External provider behavior.

## Work Phases

1. Discovery: inspect current recommender, profile, quiz, and edge function boundaries.
2. Design: define a profile context DTO based on existing `profiles` fields.
3. Validation planning: add focused unit tests and build proof.
4. Implementation: load/pass/merge profile context into prompts.
5. Verification: run tests, build, arch-check, and story gate.
6. Harness update: record intake, trace, and evidence.

## Stop Conditions

Pause for human confirmation if:

- Data migration or deletion risk appears.
- Validation requirements need to be weakened.
- Architecture direction changes.
