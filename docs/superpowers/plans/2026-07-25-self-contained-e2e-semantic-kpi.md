# Self-contained E2E and Semantic KPI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the complete frontend Playwright suite independent from a running API and make KPI tone assertions semantic rather than presentation-coupled.

**Architecture:** `StatCard` publishes its existing tone prop through a stable data attribute. Playwright uses a role-specific local-storage session and an endpoint-aware API route fixture; every fixture returns the production `{ success, data }` envelope.

**Tech Stack:** React 19, TypeScript, Playwright, TanStack Query/Router.

## Global Constraints

- Do not alter production API client behavior, storage keys, demo-login UI, public `beachRead` branding, permissions, routes, or dashboard business calculations.
- Do not add packages or start a backend process in Playwright.
- E2E fixtures must be deterministic and fail unrecognised API paths with a non-success response.
- `StatCard` default tone remains `neutral`; existing visual classes remain unchanged.

---

## File structure

- Modify `src/shared/ui/stat-card.tsx`: expose `data-tone` on the card root.
- Modify `tests/e2e-role-flows.spec.ts`: semantic assertions and self-contained endpoint fixtures for every existing role flow.

### Task 1: Expose the StatCard semantic contract

**Files:**
- Modify: `src/shared/ui/stat-card.tsx`
- Modify: `tests/e2e-role-flows.spec.ts`

**Interfaces:**
- Consumes: `tone?: StatCardTone`.
- Produces: root card attribute `data-tone` with one of the existing `StatCardTone` values; omitted props yield `neutral`.

- [ ] Add failing Playwright assertions that locate each creator KPI by its exact label and require `data-tone` values `neutral`, `warning`, and `success`.
- [ ] Run `npx playwright test tests/e2e-role-flows.spec.ts --grep "creator KPI colors"`; verify it fails because no card exposes `data-tone`.
- [ ] Add `data-tone={tone}` to the root `div` in `StatCard`; do not change `STAT_TONE_BG`, markup hierarchy, or visual classes.
- [ ] Replace `expectStatTone` parent traversal/class matching with an exact-label card locator that asserts the card's `data-tone` attribute.
- [ ] Re-run the focused KPI test, `npx eslint src/shared/ui/stat-card.tsx tests/e2e-role-flows.spec.ts`, and `npx tsc --noEmit`.
- [ ] Commit: `test: assert semantic dashboard KPI tones`.

### Task 2: Make every role flow self-contained

**Files:**
- Modify: `tests/e2e-role-flows.spec.ts`

**Interfaces:**
- Consumes: `seedWorkspaceRole(page, role)` and `apiBaseUrl()`'s default `http://localhost:3001/api` shape.
- Produces: `mockRoleFlowApi(page, role)` that intercepts `http://localhost:3001/api/**`, serves explicit fixtures for the paths exercised by that role's existing flow, and returns `{ success: false, message: "Unhandled E2E fixture request" }` with HTTP 500 for every other path.

- [ ] Write a failing full-suite reproduction with no process listening on port 3001; preserve all existing role-flow assertions.
- [ ] Add compact typed fixtures for Assistant tasks, Board rankings, Admin users/payroll, Editor proposal review, and Mangaka series/detail pages. Each record must include every field read by the affected rendered component; use the existing test labels and ids (`p-007`, `Nakamura Hina`) as fixture identifiers.
- [ ] Add `mockRoleFlowApi` before each legacy role flow, call `seedWorkspaceRole` for its role, and remove only that flow's demo-login click plus `waitForURL` dependency. Do not change the flow's route, click, warning, or detail assertions.
- [ ] Make the mock request switch explicit by URL pathname and method. Return the normal success envelope for known endpoints and the stated HTTP 500 failure envelope for unknown endpoints.
- [ ] Run `npm run test:e2e` with no backend process, then `npm run build`, `npx tsc --noEmit`, `npx eslint tests/e2e-role-flows.spec.ts`, and `git diff --check`.
- [ ] Commit: `test: make role flow e2e fixtures self-contained`.

### Task 3: End-to-end verification

**Files:**
- Modify: `tests/e2e-role-flows.spec.ts` only if a missing assertion prevents proof of Task 1 or 2.

- [ ] Run `npm run test:e2e` twice from a clean state with no listener on port 3001; both runs must pass all listed tests.
- [ ] Run `npm run build`, `npx tsc --noEmit`, `npm run lint`, and `git diff --check`.
- [ ] Confirm `rg -n "signInAsDemoRole" tests/e2e-role-flows.spec.ts` has no legacy role-flow callers and that public/login accessibility tests remain unchanged.
- [ ] Commit only if Task 3 changes a test: `test: verify self-contained role flows`.
