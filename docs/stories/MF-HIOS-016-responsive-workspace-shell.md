# MF-HIOS-016 Responsive WorkspaceShell Foundation

## Status

implemented

## Lane

normal

## Product Contract

Add the reusable three-panel `WorkspaceShell` required by MangaFlow page,
review, task, and bubble-translation workspaces.

The shell controls layout only. Feature modules and backend APIs remain
responsible for deciding which page, task, context, comment, and submission
data may be supplied to each slot.

## Current Frontend Patterns

- Authenticated routes render inside the shared `DashboardLayout`.
- Shared UI primitives provide cards, icon buttons, tabs, and empty states.
- Workspace routes are placeholders because page/task workspace APIs are not
  implemented.
- Responsive rules require desktop panels and a one-panel-at-a-time mobile
  experience.

## Selected Skill Pack

- Build Web Apps React best practices
- UI
- HI-OS Governance
- Validation

## Selected Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/page-workspace.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-workspace.md`
- `docs/design/component-system.md`
- `docs/design/layout-patterns.md`
- `docs/design/responsive-rules.md`
- `docs/design/accessibility-rules.md`
- `docs/design/screen-patterns.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- `WorkspaceShell` exposes typed left, canvas, and right panel slots.
- The center canvas remains the flexible primary desktop panel.
- Desktop users can collapse and restore left and right panels.
- Mobile users switch between one visible panel at a time.
- Panel controls are labeled, keyboard-focusable, and communicate state.
- Panel regions have accessible labels.
- Missing slot content renders a shared honest empty state.
- The shell uses design tokens and shared MangaFlow primitives.
- The shell contains no API calls, permission checks, task/page data, or
  workflow transitions.
- Existing uncommitted shell/dashboard/build-info changes are not modified or
  committed.
- Client build and lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Hidden mobile panels could remain keyboard-focusable.
- Collapsed side panels could leave no way to restore them.
- Slot content could overflow and obscure workspace actions.
- Existing uncommitted changes must remain outside the story commit.

## Implementation Plan

1. Define typed workspace panel slots and labels.
2. Add desktop flex layout with collapsible side panels.
3. Add mobile panel tabs with one rendered panel at a time.
4. Add accessible panel controls and empty slot fallbacks.
5. Export the shell and validate responsive/accessibility behavior.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Strict TypeScript no-emit lint |
| Integration | Vite production build |
| E2E | Not configured; static/manual responsive review documented |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- Desktop shows left, canvas, and right panels with the canvas taking remaining
  width.
- Left and right controls collapse and restore their respective panels.
- Mobile renders only the selected panel.
- Mobile tab buttons expose selected state and visible focus.
- Missing content shows a shared empty state.
- Long panel content scrolls inside its own region.

## Evidence

- `cd client && npm run build`: pass; Vite built 796 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `git diff --check`: pass.
- `harness-cli context --story MF-HIOS-016`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-016`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-016`: pass; trace `#20` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-016`: pass; mechanical verification and
  governance gate both passed.
- Static responsive/accessibility review: native toggle buttons communicate
  selected and expanded state; labeled regions are used; desktop collapse does
  not remove mobile panels; inactive mobile panels use `display: none`; each
  panel owns its overflow.
- Browser E2E is not configured and remains inconclusive rather than passed.
