# Design

## Backend

Create a dedicated admin controller and router mounted at `/api/admin`.

Routes:

- `GET /users` -> list Admin-visible users.
- `POST /users` -> create user through existing admin user service.
- `PATCH /users/:userId/role` -> update role and revoke tokens.
- `PATCH /users/:userId/status` -> activate/suspend account.

All routes use:

```txt
requireAuth -> requireRole("ADMIN") -> validate -> service
```

Status body:

```json
{ "isActive": true }
```

## Frontend

Add:

- `useAdminUsers`
- `AdminUsersPage`
- `AdminUsersTable`
- `AdminUserDialog`
- `admin-users.mappers`

The UI must state that backend routes enforce Admin permissions.
