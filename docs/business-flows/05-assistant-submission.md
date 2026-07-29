# Assistant Submission Flow

## Description

An Assistant is assigned a Task, starts work, submits work via POST /api/tasks/:taskId/submit,
and the Mangaka reviews (approve/reject/request-revision). On Mangaka approval, an
Earning record is created. The Assistant can reopen revision-requested tasks.

## Flowchart

```mermaid
graph TD
    A[Task assigned to Assistant<br/>status: TODO] --> B[Assistant starts<br/>POST .../tasks/:taskId/actions/START]
    A -- blocked: true --> A1[Assistant opens Task Studio<br/>and UNBLOCKS task]
    A1 --> B
    B --> C[Task status: IN_PROGRESS<br/>Region locked]

    C --> D[Assistant does work]
    D --> E[Assistant submits<br/>POST /api/tasks/:taskId/submit]
    E --> F{Guards}
    F -- Not assigned assistant --> G[HTTP 403 TASK_NOT_ASSIGNED]
    F -- Task not IN_PROGRESS --> H[HTTP 409 INVALID_TRANSITION]
    F -- Missing Idempotency-Key --> I[HTTP 400 IDEMPOTENCY_KEY_REQUIRED]
    F -- Missing expectedCurrentSubmissionId --> J[HTTP 400 EXPECTED_CURRENT_SUBMISSION_REQUIRED]
    F -- Stale currentSubmissionId --> K[HTTP 409 CURRENT_SUBMISSION_CONFLICT]
    F -- All pass --> L[Create Submission<br/>status: PENDING<br/>Task status: SUBMITTED]

    L --> M[Mangaka reviews submission]

    M --> N{Mangaka decision}
    N -- APPROVE --> O[Submission: MANGAKA_APPROVED<br/>Task: MANGAKA_APPROVED<br/>Region: APPROVED, UNLOCKED]
    O --> P[Earning record created<br/>sourceKey: TASK_APPROVAL:taskId:submissionId]
    P --> Q[OutboxEvent: earning.earned]

    N -- REQUEST_REVISION --> R[Submission: REVISION_REQUESTED<br/>Task: REVISION_REQUESTED<br/>Region: REVISION_REQUIRED]
    R --> S{Assistant reopens?}
    S -- POST /api/tasks/:taskId/reopen --> T[Task: IN_PROGRESS<br/>blocked: false]
    T --> D

    N -- REJECT --> U[Submission: REJECTED<br/>Task: REJECTED<br/>Region: CONFIRMED, UNLOCKED]

    L --> V{Supersedes old submissions?}
    V -- Yes --> W[Old submissions: SUPERSEDED]

    C --> X{Assistant blocks task?}
    X -- BLOCK --> Y[blocked: true, blockedReason set]
    Y --> Z[UNBLOCK to resume]

    C --> AA{Task cancelled?}
    AA -- MANGAKA cancels --> AB[Task: CANCELLED<br/>Region: UNLOCKED]
```

## Submission Status Values (from `backend/src/types.ts:203-212`)

| Status               | Description                             |
| -------------------- | --------------------------------------- |
| `PENDING`            | Just submitted, awaiting Mangaka review |
| `MANGAKA_APPROVED`   | Mangaka approved                        |
| `REVISION_REQUESTED` | Mangaka requested changes               |
| `SUPERSEDED`         | Replaced by a newer submission          |
| `REJECTED`           | Mangaka rejected                        |

## Task Status Values (from `backend/src/types.ts:163-176`)

| Status               | Description                 |
| -------------------- | --------------------------- |
| `TODO`               | Task created, not started   |
| `IN_PROGRESS`        | Assistant working           |
| `SUBMITTED`          | Work submitted (pre-review) |
| `REVISION_REQUESTED` | Mangaka requested revision  |
| `MANGAKA_APPROVED`   | Mangaka approved            |
| `REJECTED`           | Mangaka rejected            |
| `CANCELLED`          | Cancelled by Mangaka        |

## Role Access

**Genuine Task lifecycle actions** (via `POST /api/tasks/:taskId/actions/:action`):

| Action                        | Allowed Roles      | Guard                        |
| ----------------------------- | ------------------ | ---------------------------- |
| START, BLOCK, UNBLOCK, REOPEN | Assigned ASSISTANT | `task-submission.service.ts` |
| CANCEL, REASSIGN              | MANGAKA            | `task-submission.service.ts` |

(`SUBMIT` via the actions endpoint is deprecated → use `POST /api/tasks/:taskId/submit`.)

**Submission decisions** use dedicated Submission endpoints, not the generic Task
action endpoint:

| Decision         | Canonical endpoint                                     | Actor                     |
| ---------------- | ------------------------------------------------------ | ------------------------- |
| Approve          | `POST /api/submissions/:submissionId/approve`          | Owning MANGAKA (not self) |
| Request revision | `POST /api/submissions/:submissionId/request-revision` | Owning MANGAKA            |
| Reject           | `POST /api/submissions/:submissionId/reject`           | Owning MANGAKA            |

The generic Task-action aliases `APPROVE`, `MANGAKA_APPROVE`, `REQUEST_REVISION`,
`REJECT`, and `EDITOR_APPROVE` have been removed from `TASK_ACTIONS`. Requests using
them return `400 INVALID_ACTION`; the canonical Submission endpoints remain the
only submission decision contract
([TECH-FINDING-04](#tech-finding-04--deprecated-decision-aliases-in-task_actions)).

## Idempotency

Submissions use `Idempotency-Key` header + `requestFingerprint` (SHA-256 of sorted payload)
to prevent duplicate submissions. If same key + same fingerprint: returns existing submission.
If same key + different fingerprint: HTTP 409 `IDEMPOTENCY_KEY_REUSED`.

## Earning Creation (on MANGAKA_APPROVED)

Before a Task can be created, the owning Mangaka selects an active `rateCode` and
quantity. The backend resolves the Admin-owned `RateTable` entry and stores the
rate snapshot on the Task; `rateSnapshot` and `estimatedAmount` are never accepted
from the client. `EarningModel.findOneAndUpdate({ sourceKey })` with `$setOnInsert`:

- `sourceKey = "TASK_APPROVAL:{taskId}:{submissionId}"`
- `amount = quantity * rateSnapshot` (server-resolved immutable Task snapshot)
- `status = "EARNED"`
- `OutboxEvent` emitted: `earning.earned`

## Submission Error Codes

| Condition                                 | HTTP | Code                                   | Status                                   |
| ----------------------------------------- | ---- | -------------------------------------- | ---------------------------------------- |
| Missing `Idempotency-Key`                 | 400  | `IDEMPOTENCY_KEY_REQUIRED`             | Implemented (`workflow.service.ts:2238`) |
| Missing `expectedCurrentSubmissionId`     | 400  | `EXPECTED_CURRENT_SUBMISSION_REQUIRED` | Implemented (`:2240-2245`)               |
| Current submission changed since read     | 409  | `CURRENT_SUBMISSION_CONFLICT`          | Implemented (`workflow.service.ts:2291`) |
| Idempotency key reused, different payload | 409  | `IDEMPOTENCY_KEY_REUSED`               | Implemented (`:2303-2307`)               |
| Task not assigned to actor                | 403  | `TASK_NOT_ASSIGNED`                    | Implemented                              |
| START while task is blocked               | 409  | `TASK_BLOCKED`                         | Implemented                              |
| Invalid Task/Submission transition        | 409  | `INVALID_TRANSITION`                   | Implemented (`:2285`)                    |

## Region Locking (see [14-regions.md](14-regions.md))

A Task locks its Region at **creation** (`ASSIGNED` + `LOCKED` + `activeTaskId`,
`studio.controller.ts:300-306`) and the Region stays `LOCKED` through `START`,
`SUBMIT`, and `REQUEST_REVISION` (revision only changes the display status to
`REVISION_REQUIRED`, `workflow.service.ts:3132-3138`). The lock is released only on
`APPROVE`, `REJECT`, or `CANCEL`. One Region has at most one active Task
(`studio.controller.ts:271-311`).

## Verified frontend lifecycle

Live E2E exercises the Assistant-scoped Studio and Mangaka Review Queue:

1. Assigned Assistant opens a blocked task, performs `UNBLOCK -> START`, and uploads a real file.
2. `POST /api/tasks/:taskId/submit` returns `201`; the task becomes `SUBMITTED`
   and the Studio upload panel becomes read-only.
3. The submission appears in the owning Mangaka's Review Queue.
4. Mangaka approves through the review UI; the canonical Submission endpoint returns `200`
   and the item leaves the pending queue.

## Canonical Decisions & Required Code Changes

### TECH-FINDING-04 — Deprecated decision aliases in `TASK_ACTIONS`

**Status: Resolved.** `TASK_ACTIONS` now contains only task lifecycle actions;
`APPROVE`, `MANGAKA_APPROVE`, `REQUEST_REVISION`, `REJECT`, and `EDITOR_APPROVE`
are rejected with `400 INVALID_ACTION` before task workflow execution. Canonical
Submission and Chapter review endpoints remain separate. → `CODE-TODO` CT-10 (Done).

### TECH-FINDING-05 — Generic `CONFLICT` code

**Status: Resolved.**

The stale-current-submission check (`workflow.service.ts:2291`) now throws the
canonical `CURRENT_SUBMISSION_CONFLICT` code (HTTP 409). The prior generic
`CONFLICT` response is retired. → `CODE-TODO` P2 (Done).

## Key Files

- `backend/src/services/task-submission.service.ts` — `submitTaskWork()`
- `backend/src/services/task-submission.service.ts` — `submissionDecision()`
- `backend/src/services/task-submission.service.ts` — `applyTaskAction()`
- `backend/src/services/task-submission.service.ts` — `reopenTaskForRevision()`
- `backend/src/controllers/submission.controller.ts` — route handlers
- `backend/src/routes/submission.routes.ts` — route registration
