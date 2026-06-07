# MF-HIOS-004 UI Design System Reconciliation

## Status

in_progress

## Lane

normal

## Task Type

UI design-system documentation reconciliation.

## Product Contract

Align MangaFlow UI design docs and UI contracts with the accepted
production-only MVP and Clean Pastel Creative SaaS design direction before any
frontend implementation story begins.

This story does not implement React components, install packages, or restore
deleted app source.

## Selected Skill Pack

- Build Web Apps UI guidance
- Design System
- UI Design System
- HI-OS Governance
- Validation

## Relevant Docs

- `docs/design/ui-style-guide.md`
- `docs/design/design-tokens.md`
- `docs/design/component-system.md`
- `docs/design/layout-patterns.md`
- `docs/design/screen-patterns.md`
- `docs/design/interaction-states.md`
- `docs/design/responsive-rules.md`
- `docs/design/accessibility-rules.md`
- `docs/design/ui-do-dont.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-dashboard.md`
- `docs/contracts/ui-workspace.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/contracts/ui-task.md`
- `docs/contracts/ui-review.md`
- `docs/contracts/ui-board.md`
- `docs/contracts/ui-admin.md`
- `docs/contracts/ui-marketing.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- UI docs state the production-only MVP boundary.
- `ui-main.md` defines the canonical UI contract map.
- Every UI contract has validation expectations.
- Required shared UI components are documented.
- Design token docs include color, typography, radius, spacing, shadow, and
  status token rules.
- UI docs reject dark default theme, one-off styling, hardcoded status colors,
  and duplicated navigation/sidebar logic.
- UI review checklist covers shared components, token usage, responsive
  behavior, accessibility, and state handling.
- Validation is docs-only and does not claim frontend build proof while app
  packages are absent.

## Risks

- Accidentally defining reader/library UI despite production-only MVP.
- Changing visual direction without product approval.
- Claiming frontend implementation validation with no current app package
  entrypoints.

## Current Outcome

UI design-system docs are reconciled, but final HI-OS governance verification
is inconclusive because the current sandbox cannot spawn the required Python
verifier or Harness CLI commands and escalation is disabled.
