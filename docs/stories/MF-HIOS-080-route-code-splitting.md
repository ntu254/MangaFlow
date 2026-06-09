# MF-HIOS-080 Route Code Splitting

## Status

implemented

## Lane

normal

## Product Contract

Route paths, auth gates, role redirects, and page behavior remain unchanged while heavy route pages are lazy-loaded behind a shared suspense fallback to reduce initial bundle size.

## Relevant Product Docs

- `docs/product/requirements.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/main.md`
- `docs/architecture/overview.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Add a shared route suspense fallback in `App.tsx`.
- Lazy-load route-level app pages in `AppRoutes.tsx`.
- Preserve route paths, redirects, permissions, and placeholder behavior.
- Reduce initial client bundle weight.

Out of scope:

- Route path changes.
- New loading states per page.
- API changes.
- Design system changes.

## Acceptance Criteria

- `App.tsx` wraps route tree in `Suspense` with a stable loading fallback.
- `AppRoutes.tsx` lazy-loads heavy authenticated route pages.
- Route behavior remains unchanged.
- Initial client chunk size materially decreases.
- Client lint/build and docs verifiers pass.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not required; route orchestration refactor only. |
| Integration | Not required; route contract unchanged. |
| E2E | Not configured. |
| Platform | Client lint/build plus docs verifiers. |
| Release | Not applicable. |

## Manual QA

1. Open `/` and `/login`.
2. Open `/app` signed out and confirm redirect to login still works.
3. Open authenticated dashboard and feature routes.
4. Confirm suspense fallback appears during lazy route loading.
5. Confirm admin placeholder routes still render.

## Evidence

- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS.
- Product contract, architecture docs, and UI design-system verifiers -> PASS.
- Main app chunk dropped to `348.90 kB`; largest route chunk `358.24 kB`.
- Previous `>500 kB` bundle warning no longer appears.
