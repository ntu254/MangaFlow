# Mobile Editor and Board Core Workflow Alignment

**Status:** Approved design

**Date:** 2026-07-30

**Scope:** MangaFlow mobile application only, with supporting backend projections and shared workflow-service reuse

## Summary

MangaFlow mobile will support the essential decision workflows for two authenticated audiences:

- Tantou Editor.
- Board member, including Board Chair capabilities when the authenticated user has that designation.

The mobile experience will not copy the complete web application. It will use a queue-first information architecture optimized for fast review and auditable decisions. Business status, permissions, readiness, quorum, vote results, transition eligibility, and side effects remain backend-owned and must match the same workflow services used by the web application.

## Problem

The current mobile implementation has grown from a mock-oriented shell into a partially live client. It now calls real endpoints, but it still has several alignment risks:

- Mobile-specific mapping code uses loosely typed payloads and reconstructs presentation state from ad hoc fields.
- Some mobile copy and screen ownership do not reflect canonical governance. New ties no longer expose an Editor-in-Chief action; closing a tied round atomically opens a fresh Board re-vote.
- Several source-based tests assert strings and endpoint hints rather than executable behavior.
- The app can present fallback reference data near live data, which risks making unavailable or stale workflows look actionable.
- The current dashboard-first structure gives equal visual weight to summaries and actions, while the primary mobile need is resolving the next important decision.

This design replaces those assumptions with a small, explicit mobile contract backed by canonical services.

## Goals

1. Give Editors and Board users the minimum complete set of high-value workflows needed away from the web application.
2. Preserve exact backend role, assignment, status, transition, quorum, readiness, and audit rules.
3. Present the most urgent actionable work first.
4. Make every consequential action understandable and confirmable before submission.
5. Prevent stale mobile state from overwriting newer workflow state.
6. Provide clean loading, empty, permission, conflict, and retry behavior.
7. Replace source-regex coverage with contract, unit, integration, and end-to-end behavior tests.

## Non-goals

The following remain web-only:

- Admin, Mangaka, and Assistant application surfaces.
- Studio canvas, detailed annotation workspace, page-region editing, AI processing, and material upload management.
- CSV ranking import.
- Bulk administration and workflow configuration.
- Full parity with every web report, filter, table column, or dashboard KPI.
- Client-side readiness, ranking, quorum, vote-result, or transition calculations.

## Sources of Truth

When behavior differs between surfaces, precedence is:

1. Backend workflow and authorization services.
2. Canonical business-flow documentation under `docs/business-flows/`.
3. Backend API contract and executable backend tests.
4. Web behavior that consumes the same backend contract.
5. Mobile presentation behavior.

Mobile-specific endpoints may aggregate data for small screens, but they must delegate mutations to the same services as canonical web endpoints. A mobile controller must not implement a second state machine.

## Product Principles

### Queue-first

The default screen answers: “What requires my decision now?” Summary counters support that question; they do not replace the work queue.

### Capability-driven

The authenticated identity and backend response determine which actions are visible or enabled. The mobile app does not offer a manual role switch.

### Evidence before action

A user opens a work item, reviews its evidence and blockers, then uses a sticky action area. Destructive or consequential actions are never executed from a queue card.

### Backend-owned decisions

Mobile displays readiness, quorum, vote progress, permitted actions, and transition effects returned by the backend. It never recomputes them.

### Safe freshness

Actions include the current entity/session version where applicable. A conflict refreshes the work item instead of overwriting newer state.

## Role and Capability Matrix

| Audience | Included capabilities |
| --- | --- |
| Tantou Editor | Proposal queue and detail; claim/start review; request changes; reject; forward to Board |
| Tantou Editor | Consolidated chapter review; page/readiness/blocker evidence; request revision; reject; Editor approve |
| Assigned Tantou | Create/reply to comments; resolve or reopen eligible blocking comments |
| Tantou Editor | Publication queue; schedule, postpone, or publish when the backend permits the action |
| Board member | View open voting sessions and proposal evidence; cast `APPROVE`, `REJECT`, or `NEEDS_REVISION` votes |
| Board Chair | Create, update, close, cancel, and finalize eligible voting sessions |
| Board Chair | Record manual at-risk decisions |
| Board member | Read rankings and immutable decision history |

Explicit boundaries:

- Assistant submissions are supporting evidence for Editor chapter review. Editor mobile does not replace Mangaka submission approval.
- New tie-break actions are retired. A tied session is immutable history and the backend opens a fresh empty Board re-vote using the same proposal snapshot, electorate, and quorum.
- Only a Board Chair sees Chair session and at-risk actions.
- Ranking import remains web-only.
- The backend may remove an action between load and submit; mobile must handle that as a normal permission or conflict response.

## Information Architecture

### Shared shell

The authenticated user sees:

- A compact role/designation label in the header.
- An avatar menu for profile, session information, and logout.
- Four primary tabs.
- No role-switch control.

### Editor navigation

| Tab | Purpose |
| --- | --- |
| Today | Cross-workflow priority queue for proposals, chapters, comments, and publication actions |
| Reviews | Proposal and chapter queues with filters and search |
| Publish | Readiness, scheduled, postponed, and ready-to-publish chapters |
| History | Completed decisions, comments, and publication actions |

### Board navigation

| Tab | Purpose |
| --- | --- |
| Today | Votes due, Chair finalization tasks, and at-risk decisions |
| Sessions | Open and historical voting sessions; Chair creation and management actions |
| Ranking | Read-only ranking and at-risk context |
| History | Immutable Board decisions and audit-oriented summaries |

### Queue ordering

The backend projection supplies priority and the reason for that priority. The mobile client displays the returned order. Typical reasons include:

- Action is due or overdue.
- A blocking comment is waiting for the assigned Tantou.
- A voting session closes soon and the member has not voted.
- A closed session is ready for Chair finalization.
- A publication item passed readiness and awaits scheduling.
- A ranking is explicitly marked at risk.

The client may apply presentation-only filters, but it must not recalculate business priority.

## Interaction Model

Every primary decision follows the same sequence:

1. Queue card.
2. Full detail.
3. Sticky action area.
4. Action-specific confirmation sheet.
5. Server response.
6. Queue, detail, counters, and history refresh.

### Queue cards

Cards contain only:

- Workflow kind and canonical status label.
- Title and concise context.
- Deadline or freshness when relevant.
- At most two high-signal badges.
- Priority reason or blocker count.

Cards do not contain destructive buttons. Tapping a card opens the full detail.

### Detail screens

Detail screens use progressive disclosure:

- Header: entity, workflow type, current status, version, deadline.
- Evidence summary: recommendation, cadence, vote progress, readiness, or ranking context.
- Collapsible or tabbed secondary evidence: versions, pages, comments, history.
- Blockers and disabled-action reasons.
- Sticky action area.

Large files and signed downloads remain explicit, permission-checked actions. Mobile preview does not infer access from a series relationship.

### Sticky actions

The sticky area shows only backend-described actions. A disabled action must include a human-readable reason, such as unresolved blockers, missing quorum, stale version, or insufficient designation.

Primary and destructive actions use distinct hierarchy:

- One primary action per current task.
- Secondary actions use outline treatment.
- Reject, cancel, postpone, or other destructive choices require an explicit confirmation and the backend-required reason.

### Confirmation sheets

Every consequential mutation shows:

- Action name and target.
- Current entity/session version.
- Plain-language decision effect.
- Required inputs and validation.
- Whether the action records a vote, changes workflow state, schedules publication, or finalizes a decision.
- Cancel and confirm controls with unambiguous labels.

Confirmation copy must distinguish voting from finalization. Casting a vote does not imply that the proposal is approved or that the series is activated.

## Editor Workflows

### Proposal review

The Editor Today/Reviews queue contains proposals the backend says the user may read or act on.

Detail includes:

- Current proposal version and prior revision context.
- Pitch, requested publication cadence, materials summary, and Mangaka identity.
- Claim/assignment state.
- Editorial checklist evidence when provided by the backend.
- Decision history and current permitted actions.

Supported actions:

- Claim/start review.
- Request changes with required comment and structured checklist data when required.
- Reject with required reason.
- Forward to Board with the backend-required publication cadence and note.

Self-review, claim, EIC, and assignment guards remain backend-owned.

### Chapter review

Editor mobile reviews the consolidated chapter state, not individual Assistant approval.

Detail includes:

- Current frozen snapshot and version.
- Page availability and compact previews.
- Backend readiness checks.
- Open and addressed comments.
- Submission/task evidence as read-only context.
- Current publication status.

Supported actions:

- Request revision with a target and reason.
- Reject with a reason.
- Editor approve only when the backend permits it.

An approve button may be visible but disabled when the backend supplies a blocker reason. Mobile does not count blockers to decide eligibility.

### Comments

Editor mobile supports:

- Create a comment on an eligible target.
- Reply to a visible parent comment.
- Resolve an eligible blocking comment.
- Reopen an eligible `ADDRESSED` or `RESOLVED` comment.

Only the assigned Tantou may set or clear the blocking editorial state where canonical rules require it. Reply scope and target readability come from the backend.

### Publication

The Publish queue displays backend readiness and publication state.

Supported actions:

- Schedule with the required date/time and publication metadata.
- Postpone with a required reason and replacement schedule when required.
- Publish only when the backend exposes the action.

Publication actions use high-friction confirmation. The client never changes readiness or publication status optimistically.

### Historical tied sessions

Editors may read governance history where the canonical authorization contract permits it, but mobile exposes no new tie-break mutation. Legacy `TIE_BREAK_REQUIRED` records are labeled historical. Current tied rounds are displayed as terminal `TIED` records linked to the fresh `OPEN` Board re-vote created by the backend.

## Board Workflows

### Session and voting queue

Board Today prioritizes sessions where:

- The member has not voted and the session closes soon.
- A Chair action is required.
- A session has an explicit governance exception.

Proposal detail includes:

- Frozen proposal version.
- Editor recommendation and requested cadence.
- Materials/proposal summary.
- Backend vote progress and quorum context.
- Existing vote by the current user.
- Session notes and history.

Voting supports:

- `APPROVE`
- `REJECT`
- `NEEDS_REVISION`

The confirmation explains that the action records one vote and does not finalize the session.

### Board Chair session management

The Sessions tab includes a compact creation/edit flow for the supported one-proposal session contract.

Chair actions:

- Create a session from an eligible pending proposal.
- Update supported session metadata.
- Close a session.
- Cancel a session with reason.
- Finalize a result when the backend returns `canFinalize`.

Closing, canceling, and finalizing are separate actions with distinct confirmation copy. Mobile does not derive `canFinalize`.

### At-risk decisions

At-risk items show ranking evidence and the backend-provided reason for review.

Supported Chair decisions:

- `CONTINUE`
- `WARNING`
- `REQUEST_IMPROVEMENT_PLAN`
- `CANCEL`

Cancellation is always manual and requires the appropriate confirmation/reason. Mobile never auto-cancels a series from a ranking.

### Rankings and decision history

Ranking is read-only on mobile. It displays backend values and descriptions without reproducing the ranking formula.

Decision history is immutable presentation data. Users cannot edit historical decisions from the history screen.

## Backend Projection Contract

Two aggregated read projections support the queue-first home screens:

- Editor inbox projection.
- Board inbox projection.

They may extend the existing mobile route boundary, but they must call canonical query/workflow services rather than duplicate workflow rules.

Each item uses a versioned contract equivalent to:

```ts
type MobileWorkItem = {
  id: string;
  kind:
    | "PROPOSAL_REVIEW"
    | "CHAPTER_REVIEW"
    | "COMMENT_REVIEW"
    | "PUBLICATION"
    | "BOARD_VOTE"
    | "SESSION_FINALIZE"
    | "BOARD_REVOTE"
    | "AT_RISK";
  entityType: "PROPOSAL" | "CHAPTER" | "COMMENT" | "VOTING_SESSION" | "RANKING";
  entityId: string;
  status: string;
  version: number | null;
  title: string;
  subtitle: string;
  priority: {
    level: "URGENT" | "HIGH" | "NORMAL";
    reason: string;
    dueAt: string | null;
  };
  blockers: Array<{
    code: string;
    label: string;
    detail: string;
  }>;
  actions: Array<{
    action: string;
    enabled: boolean;
    disabledReason: string | null;
    requiresConfirmation: boolean;
    requiresReason: boolean;
  }>;
  summary: Record<string, unknown>;
};
```

The backend owns:

- Item inclusion.
- Priority reason and order.
- Action capability and disabled reason.
- Canonical status and version.
- Readiness, quorum, tally, and transition effects.

Mobile owns:

- Visual labels and icon mapping.
- Presentation filters.
- Selection and navigation state.
- Draft form input.
- Loading, error, confirmation, and retry UI.

The mobile client validates projection payloads with explicit runtime schemas before rendering. Invalid payloads produce a recoverable contract error rather than silently falling back to mock data.

## Mutation Contract

Mutations use canonical endpoints or thin aliases that delegate to canonical services.

Required rules:

- Include `expectedVersion` when the backend entity supports version conflict protection.
- Include action-specific required inputs without mobile defaults that change meaning.
- Use backend error codes as the control surface.
- Do not optimistically change workflow status.
- On success, invalidate and reload all affected inbox, detail, counter, and history data.

Any existing mobile alias that implements business persistence directly in a controller must be moved behind the same domain service used by web behavior before it is treated as aligned.

## Client Architecture

The mobile client keeps clear boundaries:

```text
screens/components
        ↓
role workflow hooks
        ↓
query/mutation adapters
        ↓
typed mobile data source
        ↓
auth-aware API client
```

Responsibilities:

- Screens render state and collect input.
- Focused hooks own selection, confirmation drafts, and workflow-specific orchestration.
- Query/mutation adapters own cache keys, loading, invalidation, and retry policy.
- The data source owns endpoint calls and contract decoding.
- The API client owns base URL, bearer token, refresh, request ID, and normalized errors.

Large role hooks and the current all-purpose data source should be split along inbox, detail, and mutation boundaries. Screen files remain thin and do not contain transition rules.

## Authentication and Security

- Authenticated role and designations come from `/auth/me`.
- The app does not allow a manual Board/Editor role switch.
- Access tokens stay in memory.
- Native refresh tokens use platform secure storage; the web preview uses session-scoped storage.
- Tokens, passwords, signed URLs, and sensitive response bodies are never logged.
- A `401` triggers one controlled refresh attempt, then returns to login.
- A `403` removes stale actions after refreshing current identity and detail.
- Signed file access always uses a permission-checked backend request.
- CORS configuration for the web preview remains an exact-origin development allowlist.

## Loading, Empty, Error, and Conflict States

### Loading

- First load uses skeletons matching the queue layout.
- Background refresh keeps existing data visible with a subtle refresh indicator.
- Mutation buttons show progress and prevent duplicate submission.

### Empty

Empty states describe the workflow outcome:

- “No decisions need your attention.”
- “You have voted in every open session.”
- “No publication items are ready.”

They do not substitute mock content.

### Errors

| Response | Mobile behavior |
| --- | --- |
| `400` / validation | Preserve form input and show field/action guidance |
| `401` | Attempt refresh once; otherwise return to login |
| `403` | Refresh identity and detail; remove actions no longer allowed |
| `404` | Remove stale queue item and return to queue with explanation |
| `409` | Show “This workflow changed,” reload detail and action capability |
| `422` | Show backend business validation without changing local status |
| `429` | Disable retry until the returned wait interval |
| `5xx` / network | Keep draft input, show retry, and do not display mock data |

## Mock and Offline Policy

- Live authenticated mode never silently falls back to mock workflow data.
- Mock mode is allowed only behind an explicit development flag.
- Mock mode displays a persistent “Demo data” label and disables production-sensitive assumptions.
- Offline mode may show the last successfully loaded read-only data with a stale timestamp.
- Mutations are never queued offline.

## Visual and Accessibility Rules

- Clean neutral surfaces with one dark primary color and restrained semantic colors.
- Minimum interactive target: 44 by 44 logical pixels.
- Text and icons communicate state; color is never the only signal.
- Queue titles use two lines at most; detail screens contain the full value.
- One primary action per task.
- Destructive actions are visually separated and explicitly named.
- Sticky action areas respect safe-area insets and keyboard height.
- Status chips, blockers, vote progress, and readiness rows use shared components.
- Screen reader labels include entity, action, status, and disabled reason.
- Dynamic text sizing must not hide action labels or confirmation effects.

## Testing Strategy

### Contract tests

- Validate every `MobileWorkItem` kind and action descriptor.
- Assert canonical status and action values.
- Reject missing versions, malformed blockers, or unknown action requirements where unsafe.

### Unit tests

- Projection-to-view-model mapping.
- Queue grouping and presentation-only filtering.
- Error-code normalization.
- Confirmation validation and draft preservation.
- Role/designation navigation visibility.

### Backend integration tests

- Mobile projections apply the same authorization and workflow-service results as canonical endpoints.
- Editor assignment and self-review guards.
- Board member versus Board Chair capabilities.
- Tied-session history and fresh Board re-vote lineage.
- Readiness and quorum values are returned, not client-derived.
- Conflict responses for stale versions.

### Mobile integration tests

- Load → select → detail → confirm → refresh for every mutation family.
- No mock fallback after an authenticated API failure.
- Disabled actions show backend reasons.
- Logout and refresh-token failure.

### End-to-end critical paths

1. Editor claims a proposal, requests changes, receives a revision, and forwards it.
2. Editor reviews a chapter, resolves the final blocker, and approves the eligible chapter.
3. Editor schedules an eligible publication item.
4. Board member opens a session and casts one vote.
5. Board Chair closes/finalizes an eligible session.
6. Board closes a tied round, sees the immutable `TIED` history, and votes in the linked fresh re-vote.
7. Board Chair records an at-risk decision.
8. A stale action returns a conflict and refreshes without overwriting server state.

## Delivery Slices

1. **Contract foundation:** typed API errors, runtime schemas, authenticated identity/designations, explicit mock policy.
2. **Shared Queue-first shell:** role-specific navigation, inbox projection, cards, detail shell, confirmation sheet, common states.
3. **Editor workflows:** proposals, chapters, comments, and publication.
4. **Board workflows:** voting, Chair session management/finalization, at-risk decisions, ranking, and history.
5. **Hardening:** contract parity tests, critical E2E paths, accessibility, narrow-width and stale-state QA.

Each slice must keep the app buildable and must not enable an action until its canonical backend integration test passes.

## Acceptance Criteria

- Authenticated Editor and Board users land on different Queue-first Today screens.
- Navigation and actions follow backend role/designation data; there is no manual role switch.
- Editor and Board mobile actions match canonical web/backend transitions and authorization.
- No new tie-break action is represented; tied rounds link to a fresh Board re-vote.
- Assistant submission approval is not offered to Editor mobile.
- Ranking import and studio-intensive functionality are absent.
- Every consequential action has detail evidence and confirmation.
- Disabled actions have a backend-provided reason.
- Readiness, quorum, tally, ranking, and transition results are never calculated on mobile.
- Stale versions cannot overwrite newer server state.
- Live API failures never display mock workflow content.
- Contract, integration, and E2E tests cover the listed critical paths.
- The interface meets the approved clean Queue-first layout and accessibility rules.

## Approved Design Decisions

- Audience: Editor, Board member, and Board Chair only.
- Product shape: focused mobile companion, not full web parity.
- Information architecture: Queue-first.
- Editor tabs: Today, Reviews, Publish, History.
- Board tabs: Today, Sessions, Ranking, History.
- Profile and logout: avatar menu.
- Detail pattern: progressive disclosure with sticky actions.
- Decision pattern: action-specific confirmation sheet.
- Business authority: backend workflow services and canonical business flows.
- Mock policy: explicit development mode only, never silent production fallback.
