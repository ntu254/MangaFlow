# MF-HIOS-086 Role Dashboard Hook Extraction

## Status

implemented

## Lane

normal

## Product Contract

Role dashboard keeps current role-specific title, badge, quick actions, and recent activity placeholder while moving config/data derivation out of the route shell.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-dashboard.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Extract role dashboard config/data derivation into `client/src/features/dashboard/hooks/useRoleDashboard.ts`.
- Extract quick action grid into `client/src/features/dashboard/components/RoleDashboardActions.tsx`.
- Keep `RoleDashboardPage.tsx` as a thin composition shell.
- Preserve current routes, labels, and placeholder activity behavior.

Out of scope:

- New dashboard API calls.
- New KPI/reporting backend behavior.
- Role/permission changes.
- Browser E2E setup.

## Acceptance Criteria

- `RoleDashboardPage.tsx` primarily composes layout, hook output, and extracted components.
- Role-specific quick actions remain unchanged for MANGAKA, ASSISTANT, EDITOR, and BOARD.
- Unknown/missing user keeps the existing generic dashboard fallback.
- Recent activity placeholder remains visible.
- No frontend-only permission shortcut is introduced.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not required; config extraction only. |
| Integration | Not required; no API behavior changes. |
| E2E | Not configured. |
| Platform | `npm run lint --prefix client`, `npm run build --prefix client`. |
| Harness | `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-086.ps1`, then `scripts/bin/harness-cli.exe story verify MF-HIOS-086`. |
| Release | Not applicable. |

## Evidence

- `client/src/features/dashboard/pages/RoleDashboardPage.tsx` reduced to 41 lines.
- `client/src/features/dashboard/hooks/useRoleDashboard.ts` owns role dashboard config and fallbacks.
- `client/src/features/dashboard/components/RoleDashboardActions.tsx` owns quick action grid rendering.
- `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-086.ps1` -> PASS.
- `scripts/bin/harness-cli.exe arch-check --story MF-HIOS-086` -> PASS.
