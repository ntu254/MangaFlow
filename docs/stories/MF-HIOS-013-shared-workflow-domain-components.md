# MF-HIOS-013 Shared Workflow Domain Components

## Status

implemented

## Lane

normal

## Product Contract

Add reusable presentation components for workflow status, pending actions, and
chapter progress.

These components render data passed by feature modules. They do not fetch data,
change workflow state, enforce permissions, or infer business eligibility.

## Current Frontend Patterns

- Shared UI primitives use typed props, `forwardRef`, `cn()`, and design tokens.
- `status-ui.ts` is the canonical mapping for task, series, chapter, page, and
  vote status presentation.
- Shared feedback components provide contract-aligned empty states.
- Feature screens should compose shared domain components before adding
  one-off layouts.

## Selected Skill Pack

- Build Web Apps React best practices
- UI
- HI-OS Governance
- Validation

## Selected Docs

- `docs/design/component-system.md`
- `docs/design/components.md`
- `docs/design/screen-patterns.md`
- `docs/design/accessibility-rules.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-dashboard.md`
- `docs/contracts/ui-task.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- `StatusBadge` renders any supplied status mapping with a neutral fallback.
- `TaskStatusBadge` always uses `taskStatusUI`.
- `ActionItemList` renders typed action items, optional metadata/status, a
  keyboard-accessible action, and a shared empty state.
- `ChapterProgressCard` renders chapter identity, mapped chapter status,
  clamped progress, counts, and an optional action.
- Status and progress meaning is communicated with visible text, not color
  alone.
- Components use shared UI primitives and design tokens.
- Components contain no API calls, permission checks, or workflow transitions.
- Existing uncommitted shell/dashboard/build-info changes are not modified or
  committed.
- Client build and lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Unknown status values could render misleading colors.
- Invalid progress totals could produce `NaN` or overflow.
- Generic actions could become inaccessible if rendered as non-semantic rows.
- Existing uncommitted changes must remain outside the story commit.

## Implementation Plan

1. Add generic and task-specific mapped status badges.
2. Add a typed action-item list with empty-state fallback.
3. Add a chapter progress card with safe progress calculation.
4. Export domain components from a dedicated index.
5. Validate TypeScript, accessibility, responsive layout, and HI-OS gates.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Strict TypeScript no-emit lint |
| Integration | Vite production build |
| E2E | Not configured; static/manual component review documented |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- Known task statuses show the configured label and tone.
- Unknown statuses show their text with neutral tone.
- Empty action arrays render `MFEmptyState`.
- Action buttons are keyboard-focusable and have visible labels.
- Chapter progress remains between 0% and 100% for invalid or excessive
  values.
- Cards stack cleanly at mobile width and long titles wrap.

## Evidence

- `cd client && npm run build`: pass; Vite built 789 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `git diff --check`: pass.
- `harness-cli context --story MF-HIOS-013`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-013`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-013`: pass; trace `#17` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-013`: pass; mechanical verification and
  governance gate both passed.
- Static UI review: known statuses use canonical mappings, unknown statuses use
  visible neutral fallback text, progress is clamped, empty state is shared,
  and actions use semantic buttons with visible focus.
- Browser E2E is not configured and remains inconclusive rather than passed.
