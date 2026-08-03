# Mobile Editor Reliability and Workflow UX Design

## Goal

Make the approved mobile Editor workflow dependable and explainable: diagnose
inbox failures without exposing internal payloads, make the six-item editorial
checklist explicit, distinguish Editor activity from Board governance history,
and make notifications a real fifth navigation tab for both roles.

## Scope

- Preserve one authenticated Editor inbox endpoint (`GET /editor/inbox`) for
  Today, Reviews, and Publish. The three tabs remain backend-order-preserving
  filters over that single inbox.
- Normalize inbox read failures so the UI can show a role-aware message and a
  copyable support diagnostic containing HTTP status, backend code, and request
  ID when available.
- Redesign the Editor checklist as six visible checkbox controls with saved
  state, progress, and a manual save action.
- Gate Forward to Board in the client only when the last successfully saved
  checklist is complete (6/6). The backend remains the authoritative guard.
- Give Editor history and Board history distinct role-specific presentation
  models and visual language without changing either existing read endpoint.
- Replace the decorative header notification bell with a fifth bottom tab for
  authenticated Editor and Board notifications.

## Non-goals

- No new per-tab inbox APIs, queue sorting, or client-owned workflow rules.
- No role, permission, proposal-transition, or audit-data changes.
- No demo fallback after a live inbox failure.
- No exposure of response payloads, bearer tokens, or stack traces in support
  diagnostics.
- No automatic navigation through notification action URLs in this scope.

## Queue reliability and diagnostics

`getMobileInbox()` continues to validate the backend payload with the shared
Zod contract and fails closed on invalid data. The mobile API layer must
preserve the following safe diagnostic fields for both HTTP and contract/network
errors:

| Field | UI treatment |
| --- | --- |
| Role/context | Friendly message, for example “Could not load Editor work.” |
| HTTP status | Support details only |
| Backend error code | Support details only |
| Request ID | Support details only, with copy action |
| Contract/network category | Support details only; no payload or stack trace |

The common error state exposes Retry and a collapsed **Support details** action.
The user-facing title stays non-technical. Retry repeats the authenticated
query; `401` remains handled by the existing refresh flow. A request never
falls back to demo data.

## Editorial checklist and Forward gating

The proposal detail renders six real checkbox controls and a progress display
(`x/6`). It maintains two values:

- `savedChecklist`: the value returned by the backend detail read or last
  successful save.
- `draftChecklist`: the user's in-progress checkbox selection.

The screen labels unsaved changes and provides an explicit **Save checklist**
action. A successful save updates `savedChecklist`; a failed save retains the
draft and explains the failure.

Forward to Board is enabled only if every item in `savedChecklist` is true. If
not, it stays visible but disabled with: `Cần hoàn tất checklist: x/6.` The
client does not treat unsaved ticks as complete. The existing backend
`EDITORIAL_CHECKLIST_INCOMPLETE` validation remains mandatory, covering stale
state and direct API calls.

## Role-specific history

### Editor: My Editorial Activity

The Editor screen describes work performed by that Editor: proposal review,
chapter review, comments, and publication actions. Each row maps the existing
Editor summary payload to a presentation item with a human-readable action,
affected workflow area, outcome/status where present, and timestamp. Its empty
state refers only to completed Editorial activity.

### Board: Governance Decision Ledger

The Board screen remains a read-only, immutable governance record. Its rows
describe voting sessions, finalizations, cancellation, re-vote lineage, and
at-risk decisions. It retains status-oriented tones and audit language. It is
not labelled as a personal activity feed.

The two screens may reuse low-level layout primitives but must use separate
mapper functions, labels, icons, metrics, and empty states. Editor summary data
and Board decision-history data are never mapped through one shared business
activity model.

## Notifications tab

Both Editor and Board bottom navigation gains **Notifications** as its fifth
tab, positioned after History. The existing decorative bell and hard-coded
header count are removed; the header retains only identity and account controls.

The tab reads the authenticated `GET /notifications` endpoint and renders the
notification title, message, kind, priority, time, and read/unread state. The
bottom-tab bell shows the server-derived unread count. It refreshes with the
tab and pull-to-refresh state; a notification list has explicit loading, empty,
and recoverable error surfaces.

Tapping an unread notification sends `POST /notifications/:id/read`. On
success, React Query updates or invalidates the notification list and unread
badge. On failure, the notification remains unread and the user receives a
retryable error. Entering the tab alone never marks all notifications read.
`actionUrl` is displayed neither as a deep link nor as a navigation command in
this scope, because mobile has no approved destination contract for every
notification kind.

## Testing and verification

- Unit-test normalized inbox diagnostics for HTTP, network, and Zod-contract
  failures without exposing response bodies.
- Screen-test friendly error content, collapsed/copyable support details, and
  retry behavior.
- Test Today, Reviews, and Publish as filters over a single Editor inbox.
- Test checklist states: incomplete, complete-but-unsaved, successful 6/6 save,
  failed save, and Forward disabled/enabled behavior.
- Test the server rejection remains visible if a stale client attempts Forward.
- Test Editor and Board history mappers/screens independently, including their
  empty states and Board re-vote lineage.
- Test both role tab sets contain Notifications as the fifth entry, the header
  has no decorative bell, unread badge derivation, read mutation success and
  failure, and notification loading/empty/error states.
- Run mobile tests, TypeScript lint, Expo web build, and `git diff --check`.

## Acceptance criteria

1. An Editor inbox failure is diagnosable through safe support details while
   the main UI remains understandable to an Editor.
2. No live failure shows demo content or a silent empty queue.
3. Forward cannot be initiated from the mobile UI until a successfully saved
   checklist is 6/6, and the backend still rejects incomplete/stale attempts.
4. Editor and Board History visibly communicate different business purposes and
   consume separate role-specific presentation models.
5. Editor and Board can read and explicitly mark their own notifications from
   the fifth bottom tab; unread badge counts come from live notification data,
   not a hard-coded header value.
