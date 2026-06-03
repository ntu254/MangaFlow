# Auth and User Sync

## Purpose

MangaFlow uses Google OAuth + JWT for authentication and an internal MongoDB
user record for product identity, role, status, memberships, and workflow
ownership.

Google OAuth is the identity provider. MangaFlow is the authorization and
product profile system.

## Identity Boundary

- The browser signs users in with Google OAuth (server-side token exchange).
- The browser sends a JWT access token in authenticated API requests:

```text
Authorization: Bearer <jwt_access_token>
```

- The backend verifies the token with JWT auth middleware.
- The backend maps the verified Google OAuth `sub` to an internal user by
  `clerkId` (field stores Google `sub` ID).
- The backend never stores passwords.
- Frontend guards are UX helpers only; backend authorization remains required.

## Local User Contract

The internal user record needs:

- `clerkId`
- `email`
- `fullName`
- `avatarUrl`
- `systemRole`
- `requestedSystemRole`
- `status`
- timestamps

Accepted `systemRole` values:

- `ADMIN`
- `MANGAKA`
- `ASSISTANT`
- `EDITOR`
- `BOARD`

Accepted `status` values:

- `ACTIVE`
- `SUSPENDED`

## Pending Role State

The product requires a state where a signed-in user exists but does not yet have
an assigned system role. That user is redirected to onboarding.

For `MF-001`, pending users are stored with `systemRole: null`.
`requestedSystemRole` may store a requested non-privileged role during
onboarding, but it does not grant product permissions. Only `MANGAKA` and
`ASSISTANT` can be requested through onboarding. `ADMIN`, `EDITOR`, and `BOARD`
assignment is deferred to admin/role management stories.

## Auth API

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/auth/me` | Authenticated | Return the current internal user and role/onboarding state. |
| `POST` | `/api/auth/sync-user` | Authenticated | Idempotently create or refresh the internal user from Google OAuth profile. |
| `POST` | `/api/auth/complete-onboarding` | Authenticated | Complete allowed onboarding fields without granting unauthorized roles. |
| `GET` | `/api/auth/permissions` | Authenticated | Return permissions after the role system is implemented. |

`/api/auth/permissions` belongs to the role/permission story unless Auth/User
Sync explicitly narrows and validates a read-only placeholder.

## Redirect Contract

After login, the client calls `/api/auth/me`.

| Result | Client behavior |
| --- | --- |
| No valid session | Public sign-in route |
| Valid user without role | `/app/onboarding` |
| `ADMIN` | `/app/admin/dashboard` |
| `MANGAKA` | `/app/mangaka/dashboard` |
| `ASSISTANT` | `/app/assistant/dashboard` |
| `EDITOR` | `/app/editor/dashboard` |
| `BOARD` | `/app/board/dashboard` |
| `SUSPENDED` | Blocked account state |

## Security Rules

- Missing tokens return `401`.
- Invalid tokens return `401`.
- Valid tokens without internal user records may trigger sync only through the
  accepted sync path.
- Suspended users cannot access protected product APIs.
- Users cannot assign themselves admin or privileged roles.
- Onboarding role requests never grant permissions by themselves.
- Role assignment and series-level permissions require separate stories unless
  explicitly added to a high-risk packet.

## Non-Goals for Auth/User Sync

- Full role permission matrix.
- Series-level memberships.
- Admin user management.
- Storage access control.
- Domain CRUD beyond the local user record.
