# Auth Contract

## Scope

Custom authentication and role-based access.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Admin, all users, System

## Business rules

- No Clerk.
- Admin creates users.
- Suspended users cannot login.
- Role redirect must match systemRole.

## API surface

`POST /api/auth/login`
`POST /api/auth/logout`
`POST /api/auth/refresh-token`
`GET /api/auth/me`

## Acceptance criteria

- User can login.
- Wrong password fails.
- Suspended user fails.
- /auth/me returns current user.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
