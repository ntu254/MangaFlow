# 0009 First Admin Bootstrap

Date: 2026-06-02

## Status

Accepted

## Context

`MF-002 Role Assignment` needs an admin actor before any admin-only role review
API can be used. The bootstrap mechanism must not let signed-in users grant
themselves privileges through the app.

## Decision

The first MangaFlow admin is created by manual MongoDB seed/update outside the
application runtime. The app will not expose a self-service first-admin
bootstrap endpoint in `MF-002`.

The expected manual setup is:

1. Sign in once with Google so `POST /api/auth/sync-user` creates the internal
   user.
2. Update that user's `systemRole` to `ADMIN` directly in MongoDB through a
   trusted operator path.
3. Use that admin account for role review and future user activation.

## Alternatives Considered

1. Environment allowlist for a bootstrap Google User ID. Deferred because it adds a
   privileged runtime branch that needs its own expiry/removal controls.
2. First signed-in user becomes admin. Rejected because it is unsafe in shared
   or deployed environments.
3. Self-service admin request in onboarding. Rejected because onboarding must
   not grant permissions.

## Consequences

Positive:

- No runtime self-promotion path exists.
- Authorization remains simple: only users already assigned `ADMIN` can manage
  roles.
- MVP setup is explicit and operator-controlled.

Tradeoffs:

- A trusted operator must perform the first admin seed manually.
- Demo environments need seed-data documentation before handoff.

## Follow-Up

- Add exact seed instructions in the seed/demo story.
- Consider an audited bootstrap command only if manual setup becomes recurring
  friction.

