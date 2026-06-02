# Overview

## Current Behavior

`MF-001` can create or refresh an internal user from Clerk. New users are stored
with `systemRole: null`, and onboarding can record `requestedSystemRole` as
`MANGAKA` or `ASSISTANT`.

There is no API or UI for an admin to review requested roles, assign a
`systemRole`, suspend a user, or reactivate a suspended user.

## Target Behavior

MangaFlow has a controlled first role-assignment slice:

- Admins can list users who need role review.
- Admins can assign a valid `systemRole` to a user.
- Admins can suspend and reactivate users.
- Role assignment clears `requestedSystemRole`.
- Non-admin users cannot assign roles, including their own role.
- The backend remains the source of truth for role/status decisions.

## Affected Users

- Admin.
- Newly signed-in pending user.
- Users requesting `MANGAKA` or `ASSISTANT`.
- Suspended user.

## Affected Product Docs

- `docs/product/auth-user-sync.md`
- `docs/product/roles-permissions.md`
- `docs/product/api-storage-data.md`
- `docs/product/mvp-roadmap.md`

## Non-Goals

- Series-level membership authorization.
- Full permission matrix implementation.
- Admin user management dashboard beyond minimal role review controls.
- Audit-log persistence beyond explicit role/status events for this slice.
- Public invite flows.
- Self-service role assignment.

