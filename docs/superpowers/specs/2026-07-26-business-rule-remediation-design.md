# Business-rule remediation design

## Scope

Correct the eight confirmed workflow findings on `main` without adding
production-platform features such as external queues, rate limiting, cookie
authentication, or payroll.

## Task and earnings integrity

`START` is valid only from `TODO`; `REOPEN` is valid only from
`REVISION_REQUESTED`. Both transitions use conditional updates so concurrent
requests fail rather than overwrite a newer state. Earnings are idempotent per
`taskId`, not per submission version, so a task can never create a second
payment record. A unique sparse `Earning.taskId` index enforces that rule.

Before adding the index, a repair migration retains the earliest earning for a
task. It marks later duplicates `REVERSED`, clears their `taskId`, and records
`originalTaskId` plus `reversalOf` in metadata for auditability. This is safe in
the current tracking-only earnings model.

## Comments and editorial authority

Only the assigned Tantou may create or raise a blocking comment. Blocking
comment detection considers only comments meeting that authority rule. Only
that Tantou may resolve or reopen the comment; reopen is valid only from
`ADDRESSED` or `RESOLVED`.

## Governance and production mutations

Cancelling an open voting session atomically marks the session `CANCELLED` and
returns linked proposals to `PENDING_BOARD`.

The legacy bulk task patch endpoint is removed. The canonical patch cannot
change task status, assignee, or region. `regionId` is immutable after task
creation: changing scope cancels the old task and creates a new one. Reassignment
is an explicit action and requires an active Assistant member of the series.

## Outbox and at-risk decisions

The server starts a bounded in-process outbox interval with an overlap guard
and stops it during shutdown. It uses the existing retry/dead-letter processor
and a structured-log delivery handler; `SENT` means the configured handler
accepted the event, not that an email was sent. In-app notifications remain
direct writes, so no duplicate notification is produced. No separate worker or
queue is introduced.

At-risk decisions require `rankingId`. The service verifies that this ranking
belongs to the route's `seriesId` and is at risk, then persists the decision,
note, actor, and timestamp in that exact ranking before audit and notification
side effects.

## Errors and compatibility

Reuse existing error codes: `FORBIDDEN`, `INVALID_TRANSITION`, `CONFLICT`, and
`REGION_HAS_ACTIVE_TASK`. Deprecated task decision endpoints remain HTTP 410.
No client contract is widened unless a focused client distinction is necessary.

## Verification

Add focused regression tests for each P0 and P1 finding: task restart/payment
duplication, comment authority and transitions, voting cancellation, safe task
patching/assignment, scheduler delivery, and at-risk persistence. Verify the
earning repair migration and unique index; verify the outbox success, retry,
dead-letter, interval, and shutdown paths; and verify missing, cross-series,
and non-at-risk ranking decisions fail safely.
Run backend tests and TypeScript lint; run existing E2E tests where the local
environment supports them.

## Data handling

Run the conditional earning repair migration before creating the unique task
index. If production-like data exists, also inspect and repair stale region
locks before enabling the changed guards.
