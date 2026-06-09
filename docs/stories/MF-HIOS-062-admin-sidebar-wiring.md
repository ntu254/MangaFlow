# MF-HIOS-062 Admin Sidebar Wiring

## Status

implemented

## Lane

normal

## Product Contract

Admin navigation should reflect system administration responsibilities, not Mangaka/Editor/Board workflow ownership. The Admin sidebar exposes a compact MVP set of system-management routes with badges/placeholders while preserving backend-owned permissions and workflow rules.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/admin-dashboard.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-admin.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Replace Admin's single generic sidebar item with grouped Admin sections.
- Add MVP Admin items: Dashboard, Users, Series, Board Members, Task Types, Task Rates, Payroll, Storage, AI Service, Audit Logs, System Health, Notifications, Logout.
- Add placeholder route wiring for Admin routes not yet backed by full modules.
- Keep Admin routes protected by `ProtectedRoute roles={["ADMIN"]}`.
- Wire badges from the Admin dashboard summary API where backend counts exist.
- Make route copy explicit that Admin monitors/configures and does not override Board, Editor, publication, or payroll rules.

Out of scope:

- Roles & Permissions, Chapters, Manuscripts, and Publication Rules sidebar items.
- Backend endpoint changes.
- New Admin CRUD screens.
- Permission or workflow-rule changes.

## Acceptance Criteria

- Admin sidebar uses system-management groups:
  - Overview
  - User & Access
  - Content Management
  - Workflow Config
  - Finance
  - System
  - Notifications
- Admin sidebar does not look identical to Mangaka/Editor role navigation.
- Admin MVP sidebar includes only the compact set requested for MVP.
- Routes exist for every Admin MVP sidebar item.
- `Notifications` links to `/app/notifications`.
- `Logout` remains an action, not a route.
- Badges exist for Users, Series, Board Members, Task Types, Task Rates, Payroll, Storage, AI Service, Audit Logs, System Health, and Notifications.
- Admin badge values come from `GET /api/dashboard/admin/sidebar-summary` when available, with safe placeholders before load/failure.
- Admin route placeholder copy states backend-owned workflow/security boundaries.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not required; navigation-only UI wiring. |
| Integration | Not required; no backend behavior changes. |
| E2E | Not configured. |
| Platform | `npm run lint --prefix client` and `npm run build --prefix client`. |
| Release | Not applicable. |

Manual QA:

- Login as Admin and confirm grouped sidebar labels and badges render.
- Confirm clicking every Admin MVP sidebar item reaches a route instead of falling to `*` redirect.
- Confirm non-Admin roles still show the default role dashboard navigation.
- Confirm Admin placeholder copy does not imply Admin can approve publication, review manuscripts, vote Board, or bypass payroll rules.

## Evidence

- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS.
- `npm run lint --prefix server` -> PASS.
- `npm run build --prefix server` -> PASS.
- `npm run test --prefix server -- dashboard` -> PASS.
- Docs verifiers passed:
  - `python scripts/verify-product-contract-scope.py`
  - `python scripts/verify-architecture-docs.py`
  - `python scripts/verify-ui-design-system.py`
