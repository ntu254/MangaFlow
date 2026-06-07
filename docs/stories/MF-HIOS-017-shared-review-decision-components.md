# MF-HIOS-017 Shared Review Decision Components

## Status

implemented

## Lane

normal

## Product Contract

Add reusable review action and publication-readiness presentation components
for MangaFlow review screens.

The components render caller-supplied labels, checks, and callbacks only. They
do not fetch data, enforce roles, transition workflow state, or calculate the
publication rules defined by the backend.

## Current Frontend Patterns

- Shared domain components compose typed MangaFlow UI primitives.
- Interactive components expose loading and disabled states to their caller.
- Status is communicated with visible text and shared badges, not color alone.
- Destructive workflow actions use the shared accessible confirmation dialog.

## Selected Skill Pack

- Build Web Apps React best practices
- UI
- HI-OS Governance
- Validation

## Selected Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/submission-review.md`
- `docs/contracts/comment-resolution.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-review.md`
- `docs/design/component-system.md`
- `docs/design/components.md`
- `docs/design/accessibility-rules.md`
- `docs/design/interaction-states.md`
- `docs/design/screen-patterns.md`
- `docs/validation/test-plan.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- `ReviewDecisionBar` exposes typed approve, request-revision, and reject
  callbacks.
- Action labels are configurable so caller context can distinguish Mangaka
  internal approval from Editor final approval.
- Actions support caller-controlled loading and disabled states.
- Reject requires confirmation before invoking its callback.
- `PublicationReadinessChecklist` accepts caller-supplied pass/block checks.
- Readiness items and summary communicate state with visible text and shared
  badges rather than color alone.
- An empty checklist displays an honest not-evaluated state.
- Components use shared MangaFlow primitives, design tokens, and responsive
  layouts.
- Components contain no API calls, permission checks, workflow transitions, or
  publication-readiness business rules.
- Existing uncommitted Admin/sidebar/build-info changes are not modified or
  committed.
- Client build and lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Reject could execute without an explicit confirmation step.
- Generic labels could blur Mangaka and Editor approval meaning.
- A frontend component could accidentally become a second source of truth for
  publication readiness.
- Existing uncommitted changes must remain outside the story commit.

## Implementation Plan

1. Define typed review action props and caller-controlled state.
2. Compose the action bar from `MFCard`, `MFButton`, and `MFDialog`.
3. Define typed caller-supplied readiness items.
4. Compose checklist summary, progress, empty state, and item status badges.
5. Export both domain components and validate the story contract.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Strict TypeScript no-emit lint |
| Integration | Vite production build |
| E2E | Not configured; static/manual interaction review documented |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- Approve and request-revision invoke their matching callback directly.
- Reject opens a dialog and invokes its callback only after confirmation.
- Loading disables competing actions and shows the matching button spinner.
- Caller labels can identify final Editor approval distinctly.
- Passing, blocked, and empty readiness states include visible text.
- Long labels wrap and action controls stack at mobile width.

## Evidence

- `cd client && npm run build`: pass; Vite built 796 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `git diff --check`: pass.
- `harness-cli context --story MF-HIOS-017`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-017`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-017`: pass; trace `#21` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-017`: pass; mechanical verification and
  governance gate both passed.
- Static interaction/accessibility review: action buttons are native
  non-submit buttons, competing actions disable while one is pending, reject
  requires the focus-managed shared dialog, state has visible labels, and
  controls stack at mobile width.
- Static contract review: readiness is derived only from caller-supplied check
  results; no publication gates, API calls, permissions, or workflow
  transitions are implemented.
- Browser E2E is not configured and remains inconclusive rather than passed.
