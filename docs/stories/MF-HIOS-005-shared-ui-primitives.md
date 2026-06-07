# MF-HIOS-005 Shared UI Primitives and Frontend Scaffolding

## Status

in_progress

## Lane

normal

## Task Type

Frontend project scaffolding and shared UI component implementation.

## Product Contract

Scaffold the MangaFlow React + Vite + TypeScript frontend project, configure Tailwind CSS with MangaFlow design tokens, and implement all required shared UI primitives (MFButton, MFCard, MFBadge, MFIconCircle, MFProgress, MFTabs, MFSection, MFPagePreviewCard, MFUploadBox) before any feature screen implementation begins.

## Selected Skill Pack

- Frontend Component Skill
- UI Design System
- Build Web Apps

## Selected Docs

- `docs/architecture/folder-structure.md`
- `docs/design/design-tokens.md`
- `docs/design/component-system.md`
- `docs/contracts/ui-main.md`
- `docs/design/ui-style-guide.md`
- `docs/design/layout-patterns.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- `client/` exists with React + Vite + TypeScript + Tailwind CSS.
- Tailwind config uses MangaFlow design tokens (colors, radius, shadows, spacing, font).
- `cn()` utility function exists for class composition.
- All shared UI components listed in `ui-main.md` exist under `client/src/shared/components/ui/`.
- Every component is typed with TypeScript props.
- Components use design tokens, not hardcoded colors.
- Status UI maps through `status-ui.ts`.
- No dark theme as default.
- `npm run build` passes.
- No reader, library, catalog, or reading-progress code is introduced (production-only MVP).

## Risks

- Hardcoding colors or radius values instead of using design tokens.
- Creating one-off component styles instead of reusable primitives.
- Introducing reader/library scope despite production-only MVP.
- Missing TypeScript types on props.
- Build failure due to misconfigured Vite or Tailwind.

## Implementation Plan

1. Scaffold React + Vite + TypeScript project in `client/`.
2. Install dependencies: Tailwind CSS, Tailwind plugins, react-router-dom.
3. Configure Tailwind with MangaFlow design token colors, radius, shadows, spacing, font.
4. Create global CSS with Plus Jakarta Sans and base styles.
5. Create `client/src/shared/lib/utils.ts` with `cn()` helper.
6. Create `client/src/shared/lib/status-ui.ts` with all status mappings.
7. Implement `MFButton` with variants (primary, secondary, outline, ghost, danger) and sizes.
8. Implement `MFCard` with optional header/footer.
9. Implement `MFBadge` with tone variants (neutral, primary, secondary, success, warning, danger).
10. Implement `MFIconCircle` with size variants.
11. Implement `MFProgress` with value, label, and color variant.
12. Implement `MFTabs` with tab items and active state.
13. Implement `MFSection` with title and actions.
14. Implement `MFPagePreviewCard` with page thumbnail and status.
15. Implement `MFUploadBox` with drag-and-drop area.
16. Create barrel exports from `client/src/shared/components/ui/index.ts`.
17. Add App.tsx that renders component showcase for visual verification.
18. Run `npm run build` and fix any issues.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Components render with expected props |
| Integration | App builds without errors |
| Platform | Tailwind tokens match design docs |
| E2E | Not applicable (no feature screens yet) |

Commands:
```powershell
cd client; npm run build
cd client; npm run lint (if available)
```
