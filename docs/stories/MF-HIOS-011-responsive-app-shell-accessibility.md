# MF-HIOS-011 Responsive App Shell Accessibility

## Status

implemented

## Lane

normal

## Product Contract

Complete the authenticated MangaFlow app shell for mobile and keyboard users
without changing route authorization or role navigation rules.

The desktop sidebar remains the canonical navigation. On small screens it
becomes an accessible drawer controlled from the shared top bar.

## Current Frontend Patterns

- `DashboardLayout` owns shared shell composition and page-title state.
- `RoleSidebar` owns role-filtered navigation.
- `DashboardTopBar` owns search, notification, settings, and user identity.
- Tailwind design tokens provide light surfaces, focus shadows, spacing, and
  responsive breakpoints.

## Selected Skill Pack

- Build Web Apps React best practices
- UI
- HI-OS Governance
- Validation

## Selected Docs

- `docs/design/navigation.md`
- `docs/design/layout-patterns.md`
- `docs/design/responsive-rules.md`
- `docs/design/accessibility-rules.md`
- `docs/design/interaction-states.md`
- `docs/design/ui-do-dont.md`
- `docs/contracts/ui-main.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- Desktop role sidebar behavior and filtering remain unchanged.
- Mobile top bar exposes a keyboard-focusable navigation trigger.
- Mobile sidebar renders as a labeled drawer with a dismissible overlay.
- Drawer closes from its close button, overlay, navigation selection, and
  Escape key.
- Icon-only controls have accessible labels and minimum touch targets.
- Search input has an accessible label and compact responsive behavior.
- Shared `MFIconButton` is used instead of duplicated icon-button styling.
- Logout uses the shared `MFButton`.
- No auth redirects, route permissions, or business rules change.
- Existing user deletion of `DashboardPage.tsx` is not reverted.
- Existing `client/tsconfig.tsbuildinfo` modification is not committed.
- Client build and lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Drawer state could remain open after route navigation.
- Overlay stacking could cover the drawer or top bar incorrectly.
- Mobile changes could alter desktop layout.
- Existing uncommitted user changes must remain outside the story commit.

## Implementation Plan

1. Add a shared token-based icon button primitive.
2. Let `DashboardLayout` own mobile navigation state.
3. Make `RoleSidebar` responsive with overlay and dismissal behavior.
4. Add menu trigger and accessible top-bar controls.
5. Validate responsive classes, keyboard behavior, build, lint, and HI-OS
   gates.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Strict TypeScript no-emit lint |
| Integration | Vite production build |
| E2E | Not configured; manual responsive/accessibility matrix documented |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- At widths below `md`, the sidebar starts off-canvas.
- The menu button opens the drawer and exposes the overlay.
- Close button, overlay click, Escape, and a navigation link close the drawer.
- At `md` and above, the sidebar remains visible without an overlay.
- Menu, close, notification, and settings controls have visible focus and
  accessible labels.
- Search is hidden on very small screens and visible from `sm` upward.

## Evidence

- `cd client && npm run build`: pass; Vite built 784 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `git diff --check`: pass.
- `harness-cli context --story MF-HIOS-011`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-011`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-011`: pass; trace `#15` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-011`: pass; mechanical verification and
  governance gate both passed.
- UI review: drawer visibility removes closed mobile navigation from keyboard
  focus; menu state, icon labels, touch targets, focus styles, and responsive
  search behavior match the selected docs.
- Browser E2E is not configured and remains inconclusive rather than passed.
