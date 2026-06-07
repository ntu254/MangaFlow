# MF-HIOS-012 Shared Form and Dialog Primitives

## Status

implemented

## Lane

normal

## Product Contract

Add the missing shared form and dialog primitives required by MangaFlow
production screens.

This story is visual and interaction infrastructure only. It does not add a
Series, Task, Review, or Admin form and does not invent API data or validation
business rules.

## Current Frontend Patterns

- Shared primitives use typed props, `forwardRef`, `cn()`, and design tokens.
- Focus styles use the shared purple focus shadow.
- Buttons and icon controls already use shared MangaFlow wrappers.
- Feature screens compose shared components instead of styling raw controls.

## Selected Skill Pack

- Build Web Apps React best practices
- UI
- HI-OS Governance
- Validation

## Selected Docs

- `docs/design/component-system.md`
- `docs/design/components.md`
- `docs/design/accessibility-rules.md`
- `docs/design/interaction-states.md`
- `docs/design/design-tokens.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-task.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- `MFInput`, `MFSelect`, and `MFTextarea` expose typed native-control props.
- Form controls support visible labels, hints, required state, errors, disabled
  state, and visible keyboard focus.
- Labels and descriptions are programmatically associated with controls.
- `MFDialog` is controlled by `open`, restores focus on close, supports Escape
  and overlay dismissal, traps Tab focus, and has an accessible title.
- Dialog content is mobile-safe and uses shared buttons/icon controls.
- New primitives use design tokens and `cn()`.
- Primitives contain no feature business rules or API behavior.
- Existing user deletion of `DashboardPage.tsx` is not reverted.
- Existing `client/tsconfig.tsbuildinfo` modification is not committed.
- Client build and lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Label, hint, and error IDs can become disconnected.
- Dialog focus can escape behind the overlay.
- Global body scroll state can remain locked after unmount.
- Existing uncommitted user changes must remain outside the story commit.

## Implementation Plan

1. Add shared field label/message helpers.
2. Add input, select, and textarea primitives with consistent states.
3. Add a portal-based controlled dialog with focus lifecycle.
4. Export the primitives from the shared UI index.
5. Validate TypeScript, accessibility behavior, and HI-OS gates.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Strict TypeScript no-emit lint |
| Integration | Vite production build |
| E2E | Not configured; static/manual accessibility review documented |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- Clicking a visible label focuses its control.
- Hint and error text are referenced by `aria-describedby`.
- Invalid controls expose `aria-invalid` and visible error text.
- Disabled controls are visually muted and non-interactive.
- Dialog focuses its close button when opened.
- Tab and Shift+Tab remain inside the dialog.
- Escape and overlay click close the dialog.
- Focus returns to the previously focused trigger after close.

## Evidence

- `cd client && npm run build`: pass; Vite built 789 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `git diff --check`: pass.
- `harness-cli context --story MF-HIOS-012`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-012`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-012`: pass; trace `#16` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-012`: pass; mechanical verification and
  governance gate both passed.
- Accessibility review: labels, descriptions, invalid state, disabled state,
  visible focus, dialog title, focus trap, Escape, overlay close, scroll lock,
  and focus restoration are implemented.
- Browser E2E is not configured and remains inconclusive rather than passed.
