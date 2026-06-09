# MF-HIOS-087 Admin Dashboard Hook Extraction

## Status

implemented

## Lane

normal

## Product Contract

Admin dashboard keeps current summary loading, stat cards, user table, system health, and audit preview behavior while moving data loading and retry logic out of the route shell.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-admin.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Extract admin dashboard loading/retry state into `client/src/features/admin/hooks/useAdminDashboard.ts`.
- Keep `client/src/features/admin/pages/AdminDashboardPage.tsx` as a thin composition shell.
- Preserve current API usage, empty/error/loading behavior, stats, system health, and audit preview rendering.

Out of scope:

- New admin endpoints.
- New system health or audit behaviors.
- Admin permission changes.
- Browser E2E setup.

## Acceptance Criteria

- `AdminDashboardPage.tsx` primarily composes layout and hook output.
- Existing admin dashboard API call and retry behavior remain unchanged.
- Loading, error, and missing-summary fallback states remain visible.
- Admin UI copy does not imply Admin workflow approval authority.
- No frontend-only permission shortcut is introduced.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not required; state extraction only. |
| Integration | Not required; no API behavior changes. |
| E2E | Not configured. |
| Platform | `npm run lint --prefix client`, `npm run build --prefix client`. |
| Harness | `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-087.ps1`, then `scripts/bin/harness-cli.exe story verify MF-HIOS-087`. |
| Release | Not applicable. |

## Evidence

- `client/src/features/admin/pages/AdminDashboardPage.tsx` reduced to 36 lines.
- `client/src/features/admin/hooks/useAdminDashboard.ts` owns summary loading, error, loading, and retry.
- `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-087.ps1` -> PASS.
- `scripts/bin/harness-cli.exe arch-check --story MF-HIOS-087` -> PASS.
