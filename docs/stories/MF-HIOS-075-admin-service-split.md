# MF-HIOS-075 Admin Service Split

## Status

implemented

## Lane

normal

## Product Contract

Admin user management, Board member management, task-type administration, and dashboard summary behavior remain unchanged while admin service internals are split into focused service modules.

## Relevant Product Docs

- `docs/product/requirements.md`
- `docs/contracts/ui-admin.md`
- `docs/contracts/admin-dashboard.md`
- `docs/contracts/board-approval.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/main.md`
- `docs/architecture/api.md`
- `docs/architecture/security.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Make `admin.service.ts` a thin barrel export.
- Split user management services.
- Split Board member services.
- Split task-type admin services.
- Split dashboard summary service.
- Preserve controller imports and API behavior.

Out of scope:

- New admin endpoints.
- Role/permission rule changes.
- Board decision override logic.
- Task type schema changes.

## Acceptance Criteria

- Admin service facade is small and stable.
- User, Board member, task-type, and dashboard logic live in separate modules.
- Existing dashboard/admin-related tests pass.
- Server/client lint/build and docs verifiers pass.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Existing dashboard/admin-adjacent tests continue to pass. |
| Integration | Not required; API contract unchanged. |
| E2E | Not configured. |
| Platform | Server/client lint/build plus docs verifiers. |
| Release | Not applicable. |

## Manual QA

1. List/create/update/suspend/activate admin users.
2. Add/activate/deactivate Board members and set Chair.
3. Create/update/activate/deactivate/delete task types.
4. Load admin dashboard summary.
5. Confirm Admin still cannot override Board decisions.

## Evidence

- `npm run lint --prefix server` -> PASS.
- `npm run build --prefix server` -> PASS.
- `npm run test --prefix server -- dashboard admin series manuscript chapter task submission comment publication board ranking accessPolicy env` -> PASS (18 files, 85 tests).
- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS (bundle-size warning only).
- Product contract, architecture docs, and UI design-system verifiers -> PASS.
- `server/src/modules/admin/admin.service.ts` reduced from 136 to 4 lines.
