# MF-HIOS-088 SeriesListPanel Admin Reuse

## Status

implemented

## Lane

normal

## Product Contract

SeriesListPanel becomes reusable for future admin series monitor screens while preserving current `/app/series` behavior and keeping admin usage read-only by default.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/contracts/ui-admin.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Add read-only/admin-friendly props to `client/src/features/series/components/SeriesListPanel.tsx`.
- Preserve the existing SeriesPage usage and open-detail action.
- Allow future admin series monitor reuse without showing chapter creation authority.

Out of scope:

- Implementing `/app/admin/series`.
- Adding admin series API calls.
- New workflow/permission rules.
- Browser E2E setup.

## Acceptance Criteria

- Existing `SeriesPage` behavior remains unchanged.
- `SeriesListPanel` accepts reuse props such as `readOnly`, optional `onSelect`, and action labels.
- Read-only/admin mode does not show chapter creation action/gate copy that implies Admin workflow approval authority.
- No frontend-only permission shortcut is introduced.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not required; presentation prop extraction only. |
| Integration | Not required; no API behavior changes. |
| E2E | Not configured. |
| Platform | `npm run lint --prefix client`, `npm run build --prefix client`. |
| Harness | `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-088.ps1`, then `scripts/bin/harness-cli.exe story verify MF-HIOS-088`. |
| Release | Not applicable. |

## Evidence

- `client/src/features/series/components/SeriesListPanel.tsx` now supports `mode`, `readOnly`, `actionLabel`, `showChapterGate`, `onOpenDetail`, and `onSelect` props.
- Read-only mode renders a neutral monitor badge and hides chapter creation gate by default.
- Existing `SeriesPage` behavior remains compatible without route changes.
- `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-088.ps1` -> PASS.
- `scripts/bin/harness-cli.exe arch-check --story MF-HIOS-088` -> PASS.
