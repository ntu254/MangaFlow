# MF-HIOS-010 Role Dashboard Foundations

## Status

implemented

## Lane

normal

## Product Contract

Replace the generic authenticated role-dashboard placeholder with useful,
contract-aligned dashboard foundations for Mangaka, Assistant, Editor, and
Board users.

This story does not fabricate KPI values or connect undocumented dashboard
APIs. It provides honest empty states, reusable loading/error feedback, and
safe navigation actions based on the documented production workflow.

## Current Frontend Patterns

- React 19, Vite, strict TypeScript, and nested React Router layouts.
- Shared authenticated shell through `DashboardLayout` and `RoleSidebar`.
- Shared UI primitives and Tailwind design tokens.
- Page titles through `PageTitleContext`.
- Role identity through `AuthProvider`.

## Selected Skill Pack

- Build Web Apps React best practices
- UI
- HI-OS Governance
- Validation

## Selected Docs

- `docs/design/*`
- `docs/contracts/main.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-dashboard.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/validation/ui-review-checklist.md`
- `docs/validation/test-plan.md`

## Acceptance Criteria

- Mangaka, Assistant, Editor, and Board dashboards use the shared app shell.
- Each role sees workflow-aligned quick actions to existing routes.
- Dashboard content uses reusable MangaFlow cards, badges, buttons, icons, and
  sections.
- Empty, loading, and recoverable error feedback components exist and use
  design tokens.
- The rendered dashboard uses an honest empty state instead of fabricated KPI
  or activity data.
- Admin dashboard behavior remains unchanged.
- No backend permission or business rule is implemented in the frontend.
- Existing user deletion of `DashboardPage.tsx` is not reverted.
- Existing `client/tsconfig.tsbuildinfo` modification is not committed.
- Client build and lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Role actions could imply unsupported permissions.
- Empty dashboard content could be mistaken for live API data.
- New feedback patterns could duplicate existing shared primitives.
- Existing uncommitted user changes must stay outside the story commit.

## Implementation Plan

1. Add reusable empty, error, and loading feedback primitives.
2. Add a reusable dashboard quick-action card.
3. Define static role presentation and navigation configuration.
4. Compose the role dashboard from shared components.
5. Validate responsive classes, accessibility, build, lint, and HI-OS gates.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Strict TypeScript no-emit lint |
| Integration | Vite production build |
| E2E | Not configured; manual role route matrix documented |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- `/app/mangaka/dashboard` shows Series and Tasks actions.
- `/app/assistant/dashboard` shows the Tasks action.
- `/app/editor/dashboard` shows Review and Series actions.
- `/app/board/dashboard` shows the Board action.
- Dashboard cards stack on narrow screens.
- Empty state copy does not claim that API data was loaded.
- Error feedback exposes a keyboard-focusable retry button.

## Evidence

- `cd client && npm run build`: pass; Vite built 783 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `git diff --check`: pass.
- `harness-cli context --story MF-HIOS-010`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-010`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-010`: pass; trace `#14` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-010`: pass; mechanical verification and
  governance gate both passed.
- UI review: shared components and tokens used; responsive grids and
  keyboard-focusable actions present; no live values or permissions invented.
- Browser E2E is not configured and remains inconclusive rather than passed.
