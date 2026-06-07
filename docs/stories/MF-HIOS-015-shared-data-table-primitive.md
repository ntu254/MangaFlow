# MF-HIOS-015 Shared Data Table Primitive

## Status

implemented

## Lane

normal

## Product Contract

Add a reusable MangaFlow data table primitive for production screens that need
row comparison, including Admin, Board, Ranking, and Audit surfaces.

The table renders supplied data only. It does not fetch, sort, paginate,
select, mutate, or enforce permissions.

## Current Frontend Patterns

- Shared primitives use typed props, `cn()`, design tokens, and accessible
  focus states.
- Shared feedback components provide empty and loading presentation.
- Tables are required by UI contracts but existing Admin content uses one-off
  table styling.
- Mobile/tablet contracts allow horizontal scrolling for comparison tables.

## Selected Skill Pack

- Build Web Apps React best practices
- UI
- HI-OS Governance
- Validation

## Selected Docs

- `docs/design/component-system.md`
- `docs/design/components.md`
- `docs/design/layout-patterns.md`
- `docs/design/responsive-rules.md`
- `docs/design/accessibility-rules.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-admin.md`
- `docs/contracts/ui-board.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- `MFTable` accepts generic typed rows and typed column definitions.
- Columns support headers, cell renderers, alignment, and optional width
  classes.
- Rows use a caller-provided stable key function.
- The table supports an accessible caption.
- Loading state renders semantic rows with shared skeletons.
- Empty state renders inside the table with visible title and description.
- Header remains readable and rows use soft token-based hover styling.
- The wrapper uses `MFCard` and horizontal overflow for narrow screens.
- The primitive contains no API, sorting, pagination, selection, mutation, or
  permission logic.
- Existing uncommitted shell/dashboard/build-info changes are not modified or
  committed.
- Client build and lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Generic column types can become awkward or unsafe.
- Loading and empty content can break table semantics.
- Long content can overflow on small screens.
- Existing uncommitted changes must remain outside the story commit.

## Implementation Plan

1. Define generic typed row and column props.
2. Implement card-wrapped responsive table markup.
3. Add semantic loading and empty states.
4. Export the primitive and public column type.
5. Validate TypeScript, semantics, responsive behavior, and HI-OS gates.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Strict TypeScript no-emit lint |
| Integration | Vite production build |
| E2E | Not configured; static/manual semantics review documented |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- A table with rows renders each typed cell and stable row key.
- A table with no rows displays its empty title and description.
- Loading state displays the configured number of skeleton rows.
- A long table scrolls horizontally without clipping content.
- Caption is available to screen readers and optionally visible.
- Cell alignment classes apply consistently.

## Evidence

- `cd client && npm run build`: pass; Vite built 796 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `git diff --check`: pass.
- `harness-cli context --story MF-HIOS-015`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-015`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-015`: pass; trace `#19` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-015`: pass; mechanical verification and
  governance gate both passed.
- Static semantics review: caption, scoped headers, stable row keys,
  `aria-busy`, semantic loading/empty rows, horizontal overflow, sticky header,
  and visible text alignment are implemented.
- Browser E2E is not configured and remains inconclusive rather than passed.
