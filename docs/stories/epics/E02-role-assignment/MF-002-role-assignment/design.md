# Design

## Domain Model

Primary entity:

- `User`

Relevant fields:

- `systemRole`
- `requestedSystemRole`
- `status`
- `updatedAt`

Business rules:

- Only active admins can assign roles.
- A user cannot assign their own role through this slice.
- Assigned roles must be one of `ADMIN`, `MANGAKA`, `ASSISTANT`, `EDITOR`, or
  `BOARD`.
- Assigning a role clears `requestedSystemRole`.
- Suspended users cannot access protected product APIs.
- Suspending a user does not delete their profile or role history.

Open decision:

- First-admin bootstrap strategy. Candidate options:
  - Manually seed the first admin in MongoDB.
  - Use an environment allowlist for one bootstrap Clerk ID.
  - Keep first-admin creation out of app code and document manual setup.

## Application Flow

Commands:

- `assignSystemRole(actorUser, targetUserId, role)`
- `suspendUser(actorUser, targetUserId)`
- `reactivateUser(actorUser, targetUserId)`

Queries:

- `listUsersForRoleReview(actorUser, filters)`
- `getUserForAdmin(actorUser, targetUserId)`

## Interface Contract

Candidate endpoints:

```text
GET /api/admin/users?status=ACTIVE&role=pending
PATCH /api/admin/users/:userId/role
PATCH /api/admin/users/:userId/status
```

Role request:

```json
{
  "systemRole": "MANGAKA"
}
```

Status request:

```json
{
  "status": "SUSPENDED"
}
```

Expected errors:

- `401 AUTH_REQUIRED` for missing/invalid token.
- `403 ADMIN_REQUIRED` for non-admin callers.
- `400 INVALID_ROLE` for invalid role input.
- `400 INVALID_STATUS` for invalid status input.
- `404 USER_NOT_FOUND` for missing target users.

## Data Model

No destructive migration is expected. Existing `users` fields from `MF-001`
support this slice:

- `systemRole`
- `requestedSystemRole`
- `status`

Recommended future additions:

- Audit records for role and status changes.

## UI / Platform Impact

Client impact:

- Minimal admin role-review route or panel.
- Pending users should still route to `/app/onboarding` until assigned.
- Role-bearing users route to their dashboard after assignment.

Platform/env:

- No new provider keys expected unless first-admin bootstrap uses an env
  allowlist.

## Observability

Operational logs:

- Role assignment attempt.
- Role assignment success.
- Non-admin role assignment rejection.
- Suspension/reactivation changes.

Audit records:

- `USER_ROLE_ASSIGNED`
- `USER_SUSPENDED`
- `USER_REACTIVATED`

## Alternatives Considered

1. Let users self-select `MANGAKA` or `ASSISTANT`. Rejected in decision
   `0008-auth-user-sync-boundary`.
2. Delay all role assignment until a full admin dashboard exists. Rejected
   because pending users need a controlled activation path before workflow
   stories can be useful.

