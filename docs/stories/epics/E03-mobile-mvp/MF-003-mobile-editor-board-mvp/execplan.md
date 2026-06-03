# Exec Plan

## Goal

Create the first Expo React Native mobile MVP surface for Tantou Editor and
Editorial Board companion workflows.

## Scope

In scope:

- `mobile/` workspace scaffold.
- Shared mobile design tokens and reusable primitives.
- Editor and Board bottom-tab navigation.
- MVP screens from `docs/09_mobile_app_spec.md`.
- Seeded demo data and API-client boundaries that match backend routes.
- TypeScript validation.

Out of scope:

- Full Clerk mobile credential setup.
- Native push notification provider setup.
- Device farm, EAS build, or store distribution.
- Desktop-level canvas annotation.

## Risk Classification

Risk flags:

- Auth.
- Authorization.
- Public contracts.
- Cross-platform.
- Existing behavior.
- Weak proof.
- Multi-domain.

Hard gates:

- Auth and authorization. Backend permission enforcement remains required.

## Work Phases

1. Discovery.
2. Design.
3. Validation planning.
4. Implementation.
5. Verification.
6. Harness update.

## Stop Conditions

Pause for human confirmation if:

- Mobile expands beyond Editor/Board MVP.
- Backend permission rules need to change.
- API contract or auth boundary changes.
- Validation requirements need to be weakened.

