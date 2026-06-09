# MF-HIOS-072 App Route Extraction

## Status

implemented

## Lane

normal

## Product Contract

Application route paths, role redirects, protected layouts, admin placeholder destinations, and page wiring remain unchanged while `App.tsx` becomes a minimal shell and route definitions move into dedicated route modules.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/ui-main.md`
- `docs/architecture/overview.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Extract `AppHomeRedirect` from `App.tsx`.
- Extract route tree into `client/src/routes/AppRoutes.tsx`.
- Keep `App.tsx` as a thin provider + router shell.
- Preserve route paths, redirects, placeholder copy, and role protection.

Out of scope:

- New pages or route paths.
- Permission rule changes.
- Lazy loading/code-splitting behavior changes.
- Layout or visual redesign.

## Acceptance Criteria

- `client/src/App.tsx` becomes a thin shell.
- `client/src/routes/AppRoutes.tsx` owns route definitions.
- `client/src/routes/AppHomeRedirect.tsx` owns auth-based redirect logic.
- Existing route behavior remains unchanged.
- Client lint/build and docs verifiers pass.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not required; orchestration refactor only. |
| Integration | Not required; route contract unchanged. |
| E2E | Not configured. |
| Platform | `npm run lint --prefix client`, `npm run build --prefix client`, docs verifiers. |
| Release | Not applicable. |

## Manual QA

1. Open `/` and confirm landing page renders.
2. Open `/login` and confirm login page renders.
3. Open `/app` signed out and confirm redirect to `/login`.
4. Open `/app` signed in and confirm role redirect still resolves to `/app/{role}/dashboard`.
5. Open admin placeholder routes and confirm copy/icons remain unchanged.

## Evidence

- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS.
- Product contract, architecture docs, and UI design-system verifiers -> PASS.
- `client/src/App.tsx` reduced to 13 lines.
