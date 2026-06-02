# Overview

## Current Behavior

`MF-002` exposes admin-only role assignment APIs, but the browser app has no
role-review surface. Admins cannot yet inspect pending users or apply role and
status actions from the UI.

## Target Behavior

MangaFlow has a minimal admin role-review UI:

- Active admins can open `/app/admin/users/role-review`.
- The screen lists active pending users with requested roles.
- Admins can assign `MANGAKA`, `ASSISTANT`, `EDITOR`, or `BOARD`.
- Admins can suspend or reactivate visible users.
- Non-admin users do not see actionable controls.

## Affected Users

- Admin.
- Pending user.
- Suspended user.

## Affected Product Docs

- `docs/product/roles-permissions.md`
- `docs/product/ui-direction.md`

## Non-Goals

- Full admin dashboard.
- Bulk role assignment.
- Search, pagination, or advanced filters beyond the pending role-review list.
- Series-level permissions.

