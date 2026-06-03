# 0008 Auth User Sync Boundary

Date: 2026-06-02

## Status

Accepted

## Context

`MF-001 Auth/User Sync` needs to resolve three open decisions before
implementation:

- How to persist a signed-in user who does not yet have a MangaFlow role.
- Whether onboarding can assign a role or only request one.
- How to test Google OAuth and MongoDB boundaries without requiring live
  credentials.

The implementation must not allow self-service privilege escalation, must keep
Google OAuth as the identity provider, and must keep MangaFlow roles/status in
the internal database.

## Decision

Pending users are stored with `systemRole: null`. A null role means the user is
authenticated but still requires onboarding or admin assignment.

`POST /api/auth/complete-onboarding` may update safe profile fields and record a
requested role, but it does not assign `systemRole`. Requested roles are limited
to `MANGAKA` and `ASSISTANT`; `ADMIN`, `EDITOR`, and `BOARD` cannot be requested
or self-assigned through onboarding.

The first auth slice uses deterministic tests that mock the JWT verifier at
the backend boundary and use repository-level fakes for auth service tests.
Runtime code still wires the Mongoose user model and MongoDB connection for the
real application path.

## Alternatives Considered

1. Use a dedicated `PENDING` system role. Rejected because it mixes onboarding
   state into the role enum and complicates authorization checks.
2. Let onboarding assign non-admin roles directly. Rejected for this slice
   because even non-admin roles unlock product workflows and should be assigned
   intentionally in a later role/admin story.
3. Require live auth (Google OAuth + JWT) and MongoDB for integration tests. Rejected because it
   would make the first auth proof depend on external credentials and services.

## Consequences

Positive:

- Authorization can treat `systemRole === null` as no product privileges.
- Onboarding can collect intent without granting access.
- Tests can run deterministically in local and CI environments.

Tradeoffs:

- A later admin/role story must assign the requested role.
- Full Mongo integration proof is deferred until database test infrastructure is
  introduced.
- The user model carries `requestedSystemRole` as workflow metadata.

## Follow-Up

- Add admin role assignment and requested-role review in a later role story.
- Add live/disposable Mongo integration coverage when the database test harness
  exists.
