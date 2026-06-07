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

## Critical rules

- Suspended users cannot login.
- Backend must enforce permissions.
- Frontend guards are not enough.
