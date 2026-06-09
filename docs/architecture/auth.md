# Auth Architecture

MangaFlow uses custom auth.

## Strategy

- Email/password
- JWT access token
- Refresh token
- Optional Google OAuth
- Admin-created users

## Role model

```txt
ADMIN
MANGAKA
ASSISTANT
EDITOR
BOARD
```

Board Chair has Board permissions and resolves tie votes.

## Middleware

- requireAuth
- requireRole
- requireSeriesRole
- requireBoardRole

Middleware is not the full authorization boundary. High-risk resource access must flow through policy services after authentication.

## Authorization boundary

Required backend direction:

```txt
requireAuth
-> coarse role check
-> resource policy check
-> allow/deny
```

Expected policy surfaces:

- `AccessPolicyService`
- `SeriesAccessPolicy`
- `TaskAccessPolicy`
- `FileAccessPolicy`
- `PublicationAccessPolicy`

Assistant access must never be granted by `requireSeriesRole("ASSISTANT")` alone for page, chapter, workspace, or file reads.

## Critical rules

- Suspended users cannot login.
- Backend must enforce permissions.
- Frontend guards are not enough.
- Production auth secrets must not use weak fallback defaults.
- Hardcoded admin credentials must not live in source.
