# MF-HIOS-081 App Routes Config Extraction

## Status

implemented

## Lane

normal

## Product Contract

Route paths, lazy-loaded page behavior, auth gates, redirects, and placeholder copy remain unchanged while route lazy registry and placeholder route config move out of `AppRoutes.tsx`.

## Relevant Product Docs

- `docs/product/requirements.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/main.md`
- `docs/architecture/overview.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Extract lazy route component registry into `lazy-routes.ts`.
- Extract admin/notification placeholder config into `placeholder-routes.ts`.
- Keep `AppRoutes.tsx` focused on route tree composition.
- Preserve behavior from MF-HIOS-080 route code splitting.

Out of scope:

- Route path changes.
- New pages.
- New lazy-loading strategy.
- Permission or redirect changes.

## Acceptance Criteria

- `AppRoutes.tsx` is thinner and route-tree focused.
- Lazy import declarations live in a dedicated registry module.
- Placeholder route copy/config lives in a dedicated config module.
- Client lint/build and docs verifiers pass.
- Bundle split remains intact with no large-chunk warning.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not required; routing config refactor only. |
| Integration | Not required; route contract unchanged. |
| E2E | Not configured. |
| Platform | Client lint/build plus docs verifiers. |
| Release | Not applicable. |

## Manual QA

1. Open marketing/auth routes.
2. Open authenticated dashboard and app feature routes.
3. Open admin placeholders and notifications placeholder.
4. Confirm lazy route chunks still load.

## Evidence

- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS.
- Product contract, architecture docs, and UI design-system verifiers -> PASS.
- `client/src/routes/AppRoutes.tsx` reduced from 135 to 65 lines.
- Main app chunk remains about `348.94 kB` with no large-chunk warning.
