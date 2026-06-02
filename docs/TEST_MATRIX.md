# Test Matrix

This file maps product behavior to proof.

Do not mark a row implemented until tests or validation evidence exist.

## Status Values

| Status | Meaning |
| --- | --- |
| planned | Accepted as intended behavior, not implemented |
| in_progress | Actively being built |
| implemented | Implemented and proof exists |
| changed | Contract changed after earlier implementation |
| retired | No longer part of the product contract |

## Matrix

| Story | Contract | Unit | Integration | E2E | Platform | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| US-000 | Foundation scaffold: product docs, npm workspace client/server, backend health smoke, AI service placeholder | no | no | no | yes | implemented | `docs/stories/epics/E00-phase-0-foundation/US-000-foundation-scaffold.md` |
| MF-001 | Auth/User Sync: Clerk identity boundary, internal user sync, current-user API, onboarding redirect state | yes | yes | no | yes | implemented | `docs/stories/epics/E01-auth-user-sync/MF-001-auth-user-sync/validation.md` |
| MF-002 | Role Assignment: admin reviews requested roles and assigns/suspends/reactivates users safely | yes | yes | no | yes | implemented | `docs/stories/epics/E02-role-assignment/MF-002-role-assignment/validation.md` |
| MF-003 | Mobile MVP: Expo React Native companion app for Tantou Editor and Editorial Board review, voting, ranking, readiness, and notifications | yes | no | no | yes | implemented | `docs/stories/epics/E03-mobile-mvp/MF-003-mobile-editor-board-mvp/validation.md` |

## Evidence Rules

- Unit proof covers pure domain and application rules.
- Integration proof covers backend enforcement, data integrity, provider
  behavior, jobs, or service contracts.
- E2E proof covers user-visible browser flows.
- Platform proof covers only shell, deployment, mobile, desktop, or runtime
  behavior that cannot be proven in lower layers.
- A story can be implemented without every proof column if the story packet
  explains why.
