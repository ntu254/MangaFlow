# MF-HIOS-084 Chapter Detail Tab Extraction

## Status

implemented

## Lane

normal

## Product Contract

Chapter detail keeps current pages, review, and readiness tab behavior while moving tab-specific composition out of the route shell.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Extract pages tab composition into `client/src/features/chapter/components/ChapterPagesTab.tsx`.
- Extract review tab composition into `client/src/features/chapter/components/ChapterReviewTab.tsx`.
- Extract readiness tab composition into `client/src/features/chapter/components/ChapterReadinessTab.tsx`.
- Keep `client/src/features/chapter/pages/ChapterDetailPage.tsx` as a thinner composition shell.
- Preserve current page/review/readiness API usage and placeholder boundaries.

Out of scope:

- New chapter/page/review/readiness endpoints.
- New permission or publication rules.
- Browser E2E setup.

## Acceptance Criteria

- `ChapterDetailPage.tsx` primarily composes shell cards, tabs, extracted tab components, and state preview.
- Tab switching behavior remains unchanged.
- Pages tab keeps live page metadata rendering and error/loading states.
- Review and readiness tabs preserve existing bounded behavior and backend action calls.
- No frontend-only permission shortcut is introduced.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not required; composition extraction only. |
| Integration | Not required; no API behavior changes. |
| E2E | Not configured. |
| Platform | `npm run lint --prefix client`, `npm run build --prefix client`. |
| Harness | `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-084.ps1`, then `scripts/bin/harness-cli.exe story verify MF-HIOS-084`. |
| Release | Not applicable. |

## Evidence

- `client/src/features/chapter/pages/ChapterDetailPage.tsx` reduced to 50 lines.
- `client/src/features/chapter/components/ChapterPagesTab.tsx` wraps pages tab composition.
- `client/src/features/chapter/components/ChapterReviewTab.tsx` wraps review tab composition.
- `client/src/features/chapter/components/ChapterReadinessTab.tsx` wraps readiness tab composition.
- `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-084.ps1` -> PASS.
- `scripts/bin/harness-cli.exe arch-check --story MF-HIOS-084` -> PASS.
