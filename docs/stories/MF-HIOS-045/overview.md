# MF-HIOS-045 Admin Dashboard Summary API Wiring

## Current Behavior

The Admin dashboard screen uses hard-coded counts and local-only system health/activity previews. The contract requires `GET /api/dashboard/admin/sidebar-summary`, but no mounted read-only dashboard endpoint existed.

## Target Behavior

Admin can load a backend-owned read-only dashboard summary with counts, system health, storage label, and audit preview. The route is protected by `requireAuth` and `requireRole("ADMIN")`.

## Affected Users

- Admin.

## Affected Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/admin-dashboard.md`
- `docs/contracts/auth.md`
- `docs/contracts/main.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-admin.md`

## Non-Goals

- No Admin user creation/update UI.
- No role mutation endpoint changes.
- No Board outcome override.
- No Board member management.
- No Task Type management.
