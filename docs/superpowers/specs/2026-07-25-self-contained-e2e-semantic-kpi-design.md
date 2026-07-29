# Self-contained E2E and semantic KPI contract

## Goal

Make the frontend Playwright suite deterministic without a live API at `localhost:3001`, and make KPI assertions depend on a semantic component contract instead of Tailwind classes or DOM depth.

## Scope

- Keep production API behavior and the existing demo-login UI unchanged.
- In `tests/e2e-role-flows.spec.ts`, replace backend-dependent role-flow setup with reusable local auth seeding and route-scoped API fixtures.
- Fixtures must provide only the data each role flow needs and return the same `{ success, data }` response envelope used by the frontend client.
- Add a `data-tone` attribute to `StatCard`, populated from its existing `tone` prop with the default `neutral` value.
- Change KPI tests to assert `data-tone` on the owning card rather than CSS classes or parent traversal.

## Design

### E2E fixture boundary

`seedWorkspaceRole` remains the single helper for browser auth state. A single mock helper intercepts the configured API base URL and dispatches explicit per-endpoint fixtures. Role flows call it before navigating; no test relies on a demo-login request completing against a live backend.

Unknown requests fail visibly with a deterministic error response rather than silently returning unrelated empty arrays. This keeps new frontend requests from being hidden by broad mocks.

### Semantic KPI boundary

`StatCard` exposes `data-tone={tone ?? "neutral"}` on its root element. The property is non-visual and has no production behavior beyond making the existing semantic prop observable for tests. E2E locates the card by label and asserts its `data-tone` value.

### Verification

- Run the full `npm run test:e2e` suite with no backend process.
- Run scoped lint, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.
- Confirm test fixtures do not alter public `beachRead` branding, API client behavior, storage keys, or real-login behavior.

## Non-goals

- Starting, changing, or mocking a production backend service.
- Changing dashboard queries, role permissions, metrics, visual tones, or demo-login UX.
- Adding test libraries or dependencies.
