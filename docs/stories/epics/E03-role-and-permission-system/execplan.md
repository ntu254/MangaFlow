# Execution Plan

## Pre-requisites

- MF-001 User Sync must be completed.

## Steps

1. `server/src/shared/constants/roles.ts` and `client/src/shared/constants/roles.ts`.
2. `server/src/modules/auth/rbac.middleware.ts` for `requireSystemRole`, `requireSeriesRole`.
3. `server/src/modules/series/series.routes.ts` refactoring.
4. `client/src/shared/components/RoleGuard.tsx`.
5. `client/src/App.tsx` refactoring to protect `/app/mangaka/series`.

## Rollback Triggers

- If `requireSystemRole` fails to fetch the local user, endpoints might lock out legitimate Mangakas. Roll back to manual user fetching inside routes.
