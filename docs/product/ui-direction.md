# UI Direction

## Current Direction

MangaFlow uses a bright pastel creative studio direction:

- Fresh Pastel Creative
- Manga Studio Workspace
- Friendly Production Dashboard
- Bright Editorial Management System

This overrides the older dark technology direction mentioned in the complete
spec. The current product direction is intentionally not dark, navy, black, or
cyberpunk as a dominant theme.

See `docs/decisions/0007-mangaflow-ui-direction.md` for the recorded decision.

## Visual Goals

- Each role sees the work that matters to them.
- Workflow status is always visible.
- Manga page, annotation, and task assignment workflows are efficient.
- Manuscript and page assets feel private and protected.
- The interface feels creative and production-ready without becoming a
  marketing page.

## Core Palette

| Token | Hex | Usage |
| --- | --- | --- |
| `primary` | `#9065d5` | Primary action and active state |
| `pinkPurple` | `#e560bc` | Creative accent and badges |
| `rosePink` | `#ff7196` | Important highlight |
| `coral` | `#ff9971` | Secondary CTA and deadline signal |
| `softYellow` | `#ffc95e` | Warning, ranking, attention |
| `pastelLime` | `#f9f871` | Positive accent |
| `bgMain` | `#fff9fb` | Main app background |
| `bgSoft` | `#fff3f8` | Soft sections |
| `bgCard` | `#ffffff` | Cards and surfaces |
| `bgSidebar` | `#f8f1ff` | Sidebar |
| `bgPanel` | `#fff7ec` | Work panels |
| `bgCanvas` | `#f7f3ff` | Page canvas |

## Text and Borders

| Token | Hex | Usage |
| --- | --- | --- |
| `textPrimary` | `#2f243a` | Primary text |
| `textSecondary` | `#5f5270` | Secondary text |
| `textMuted` | `#8a7a99` | Helper text |
| `borderDefault` | `#eadff6` | Cards and inputs |
| `borderSoft` | `#f3d7e7` | Low-emphasis borders |
| `borderActive` | `#9065d5` | Focus and active state |

## Layout Rules

- Protected app screens use an app shell with role-aware navigation.
- Complex workspaces, especially page review and annotation, should prioritize
  dense but readable task context over decorative layout.
- Cards are for repeated items, modals, and framed tools; avoid nesting cards
  inside cards.
- Status badges must be visible wherever workflow state affects next action.
- Dangerous actions require confirmation.
- Publish actions must be blocked when required workflow steps are incomplete.

## Responsive Rules

- Desktop is the primary production workspace.
- Tablet should preserve navigation and review context where possible.
- Mobile should support status review and lighter task management, but advanced
  page annotation may remain desktop-first for MVP.

## Phase 0 UI Scope

Phase 0 may show a minimal MangaFlow shell and service health/status links.
It must not imply finished role dashboards, auth state, production workflows, or
complete design system coverage.
