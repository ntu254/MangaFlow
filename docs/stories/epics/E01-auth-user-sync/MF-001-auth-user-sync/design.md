# Design

## Domain Model

Primary entity:

- `User`

Required fields:

- `id`
- `clerkId`
- `email`
- `fullName`
- `avatarUrl`
- `systemRole`
- `requestedSystemRole`
- `status`
- `createdAt`
- `updatedAt`

Role values:

- `ADMIN`
- `MANGAKA`
- `ASSISTANT`
- `EDITOR`
- `BOARD`

Status values:

- `ACTIVE`
- `SUSPENDED`

Pending role decision:

- Users without an assigned role are stored with `systemRole: null`.
- `requestedSystemRole` can hold a requested role of `MANGAKA` or `ASSISTANT`.
- Requested roles do not grant permissions.

Business rules:

- `clerkId` is unique.
- `email` is required.
- User sync is idempotent by `clerkId`.
- Clerk owns authentication; MangaFlow owns product role/status.
- Suspended users cannot access protected APIs.
- Onboarding must not grant unauthorized privilege or assign `systemRole`.

## Application Flow

Commands:

- `syncUserFromClerk(clerkClaims)`
- `completeOnboarding(userId, input)`

Queries:

- `getCurrentUser(clerkSubject)`
- `getAuthRedirectState(user)`

Flow:

1. Client signs in with Clerk.
2. Client calls `/api/auth/me`.
3. Backend verifies the Clerk token.
4. Backend finds internal user by `clerkId`.
5. If allowed by story design, backend creates or refreshes the internal user
   through sync.
6. Backend returns current user and onboarding/redirect state.

## Interface Contract

Authenticated request header:

```text
Authorization: Bearer <clerk_session_token>
```

Endpoints in scope:

```text
GET /api/auth/me
POST /api/auth/sync-user
POST /api/auth/complete-onboarding
```

Endpoint deferred unless explicitly narrowed:

```text
GET /api/auth/permissions
```

Success envelope:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Auth error envelope:

```json
{
  "success": false,
  "message": "Authentication required",
  "code": "AUTH_REQUIRED",
  "details": {}
}
```

Expected status codes:

- `200` for valid authenticated reads.
- `201` or `200` for idempotent sync, based on final controller design.
- `400` for invalid onboarding input.
- `401` for missing or invalid token.
- `403` for suspended or forbidden state.

## Data Model

Collections:

- `users`

Required indexes:

- Unique index on `clerkId`.
- Index on `email`.
- Index on `systemRole` and `status` if role/status queries enter scope.

Migration/seed:

- No destructive migration.
- Seed or fixture users must use deterministic Clerk IDs in tests.

## UI / Platform Impact

Client surfaces:

- Clerk provider setup.
- Public sign-in/sign-up routes.
- `/app` redirect behavior.
- `/app/onboarding` placeholder or minimal onboarding surface.
- Blocked/suspended account state.

Platform/env:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `MONGODB_URI`
- Existing `VITE_API_BASE_URL`

## Observability

Operational logs:

- Auth verification failure.
- User sync created user.
- User sync refreshed user.
- Suspended user access blocked.

Audit records:

- `USER_SYNCED`
- `USER_ONBOARDING_COMPLETED`
- Role/status audit events are deferred to role/admin stories unless added
  explicitly.

## Alternatives Considered

1. Store all user profile/role data in Clerk metadata.
2. Create internal users only through admin invite.
3. Allow users to self-select roles during onboarding.

Accepted direction:

- Keep Clerk as identity provider.
- Keep MangaFlow roles/status in MongoDB.
- Do not allow self-service privilege escalation.
- Store pending users with `systemRole: null`.
- Let onboarding collect a requested non-privileged role without assigning it.
