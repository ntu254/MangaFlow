# MF-HIOS-020 Shared Task Creation and Context Components

## Status

implemented

## Lane

normal

## Product Contract

Add reusable task scope, read-only context page, and create-task form
presentation components for MangaFlow task screens.

The components render caller-supplied task data, page context, task types,
assistant options, and submit callbacks only. They do not fetch data, enforce
roles, validate assistant Production Team membership, validate active TaskType
configuration, create tasks through the API, send notifications, or bypass the
chapter approval gate.

## Current Frontend Patterns

- Shared domain components compose typed MangaFlow UI primitives.
- Feature dialogs compose `MFDialog`, `MFInput`, `MFSelect`, `MFTextarea`, and
  `MFButton`.
- Status labels map through `status-ui.ts` and are visible as text.
- Empty states use shared feedback components.
- Workflow/business enforcement stays outside shared display components.

## Selected Skill Pack

- Build Web Apps React best practices
- UI
- HI-OS Governance
- Validation

## Selected Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/chapter-production.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-task.md`
- `docs/design/*`
- `docs/validation/test-plan.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- `TaskScopeCard` accepts typed caller-supplied task scope data.
- Task status uses centralized task status mapping and visible labels.
- Task scope identifies page-level or region-level work.
- Due date, priority, and assignee metadata are visible when supplied.
- `ContextPageList` renders caller-supplied context pages as read-only.
- Context pages use visible `READ ONLY` labels and shared page preview cards.
- Empty context state uses a shared honest empty state.
- `CreateTaskDialog` uses shared form and dialog primitives.
- Assistant and TaskType dropdowns render only caller-supplied options.
- Form submit invokes only a caller-supplied callback and performs no API call.
- Components contain no permission checks, assistant eligibility enforcement,
  TaskType activation rules, task assignment API calls, notifications, or
  chapter approval gate logic.
- Client build and lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Assistant eligibility and active TaskType rules are backend/high-risk and
  must not become client-only enforcement.
- Read-only context pages must not imply Assistant full-chapter access.
- Create-task form could be mistaken for task creation API implementation.
- Browser E2E is unavailable until concrete task screens mount these
  components.

## Implementation Plan

1. Add centralized task priority UI mapping.
2. Implement typed `TaskScopeCard`.
3. Implement typed `ContextPageList`.
4. Implement feature-level typed `CreateTaskDialog`.
5. Export shared domain and task feature component types.
6. Validate TypeScript, build, static UI review, and HI-OS gates.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Strict TypeScript no-emit lint |
| Integration | Vite production build |
| E2E | Not configured; static/manual interaction review documented |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- Task scope card renders page and region scope labels.
- Task due date, priority, assignee, and status are visible as text.
- Context page list displays each context page with a visible `READ ONLY`
  badge.
- Empty context page list renders a shared empty state.
- Create task dialog renders labels, hints, errors, disabled/loading states,
  and mobile-stacked actions.
- Submit calls only the supplied callback with form values.

## Evidence

- `cd client && npm run build`: pass; Vite built 796 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `git diff --check`: pass.
- `harness-cli context --story MF-HIOS-020`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-020`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-020`: pass; trace `#24` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-020`: pass; mechanical verification and
  governance gate both passed.
- Static UI review: task status and priority are visible as text badges; page
  and region scope labels are text-visible; context pages have repeated
  `READ ONLY` labels; create task form uses shared labeled fields and mobile
  stacked dialog actions.
- Static contract review: components accept caller-supplied values and
  callbacks only; no API calls, permission checks, assistant eligibility
  enforcement, active TaskType validation, notifications, or chapter approval
  gate logic are implemented.
- Browser E2E is not configured and remains inconclusive rather than passed.
