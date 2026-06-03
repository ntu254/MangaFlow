# Design

## Architecture Changes

Introduces `RoleGuard` in React and `requireSystemRole`, `requireSeriesRole` middlewares in Express. These components form the boundaries of the RBAC system, ensuring only authorized identities can interact with restricted views or mutate restricted resources.

## Data Model Changes

- No database schema changes. It leverages the existing `User.systemRole` and `SeriesMember.role`.

## New Endpoints

- No new endpoints; retrofits existing endpoints in `/api/series`.

## Security Boundaries

- Backend APIs are explicitly wrapped in role requirements.
- `req.localUser` is bound directly to the verified `req.auth` token to prevent spoofing.

## Rollout Plan

1. Deploy Role Constants.
2. Deploy Middlewares and Guards.
3. Retrofit Series API.
