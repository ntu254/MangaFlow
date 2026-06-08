# Workflow Status Contract

## Scope

Canonical status enums and allowed workflow transitions for MangaFlow MVP.

This contract is the source of truth for backend services, API responses,
frontend status badges, validation tests, and feature contracts. Feature
contracts may add local context, but they must not introduce conflicting status
names or transitions.

## Out of scope

- Public catalog, reader, library, or reading-progress statuses.
- Runtime implementation.
- Database migrations.
- UI-only label variants.

## Global Rules

- Store canonical enum values exactly as listed below.
- Unknown status values are invalid.
- Status transitions must be performed by backend services, not by frontend
  display logic.
- State-changing workflow actions use `POST` action endpoints.
- Critical workflow transitions must be auditable in future backend stories.

## Entity Status Enums

### UserStatus

| Value | Meaning |
| --- | --- |
| `ACTIVE` | User can authenticate and use permitted workflows. |
| `SUSPENDED` | User is blocked from login and workflow actions. |
| `DEACTIVATED` | User is retained for audit but no longer active. |

### SeriesStatus

| Value | Meaning |
| --- | --- |
| `DRAFT` | Series profile exists but is not submitted. |
| `EDITOR_REVIEW` | Initial proposal/manuscript is under Tantou Editor proposal review. |
| `REVISION_REQUESTED` | Proposal needs Mangaka revision before proceeding. |
| `BOARD_REVIEW` | Proposal was forwarded to Editorial Board. |
| `APPROVED` | Board approved official production. |
| `ONGOING` | Approved Series is actively producing chapters. |
| `AT_RISK` | Series remains in production but requires Board attention. |
| `REJECTED` | Proposal was rejected before production. |
| `CANCELLED` | Board manually cancelled the Series after production/ranking review. |
| `COMPLETED` | Series is complete and no new chapters are created. |

### ManuscriptStatus

| Value | Meaning |
| --- | --- |
| `DRAFT` | Manuscript version is being prepared. |
| `SUBMITTED` | Manuscript version was submitted to Tantou Editor. |
| `EDITOR_REVIEW` | Manuscript is under proposal review. |
| `REVISION_REQUESTED` | Editor requested a new version. |
| `APPROVED_TO_BOARD` | Editor forwarded the Series to Board review. |
| `REJECTED` | Editor rejected the proposal/manuscript. |

### ChapterStatus

| Value | Meaning |
| --- | --- |
| `DRAFT` | Chapter exists but pages are not fully uploaded. |
| `IN_PRODUCTION` | Pages/tasks are actively being produced. |
| `IN_REVIEW` | Chapter has submitted work under review. |
| `READY_FOR_PUBLICATION` | `PublicationReadinessService` passed the checklist. |
| `PUBLISHED` | Chapter was published on the schedule. |
| `REVISION_REQUIRED` | Chapter-level production needs revision. |

### PageStatus

| Value | Meaning |
| --- | --- |
| `UPLOADED` | Page original was uploaded and variants are available. |
| `ASSIGNED` | One or more tasks are assigned on the page. |
| `IN_PROGRESS` | Work is in progress for page/region tasks. |
| `SUBMITTED` | Work was submitted and awaits review. |
| `APPROVED` | Page reached Editor-approved production state. |
| `REVISION_REQUESTED` | Page needs further work. |

### RegionStatus

| Value | Meaning |
| --- | --- |
| `ACTIVE` | Region can be used for task assignment. |
| `ARCHIVED` | Region is retained but no longer assignable. |

### TaskStatus

| Value | Meaning |
| --- | --- |
| `TODO` | Task is assigned but not started. |
| `IN_PROGRESS` | Assistant started work. |
| `SUBMITTED` | Assistant submitted a version for Mangaka review. |
| `MANGAKA_APPROVED` | Mangaka approved and sent to Editor final approval. |
| `EDITOR_APPROVED` | Editor final approval completed the task. |
| `REVISION_REQUESTED` | Mangaka or Editor requested revision. |
| `REJECTED` | Submission/task was rejected; payment is zero. |

### SubmissionStatus

| Value | Meaning |
| --- | --- |
| `SUBMITTED` | Version was submitted for Mangaka review. |
| `MANGAKA_APPROVED` | Mangaka approved this version. |
| `EDITOR_APPROVED` | Editor final-approved this version. |
| `REVISION_REQUESTED` | This version needs revision. |
| `REJECTED` | This version was rejected. |

### CommentStatus

| Value | Meaning |
| --- | --- |
| `OPEN` | Editor issue is open. |
| `FIXED_BY_ASSISTANT` | Assistant marked the issue fixed. |
| `VERIFIED_BY_MANGAKA` | Mangaka verified the fix internally. |
| `RESOLVED_BY_EDITOR` | Editor officially resolved the issue. |

### BoardVoteValue

| Value | Meaning |
| --- | --- |
| `APPROVE` | Board member votes to approve production. |
| `REJECT` | Board member votes to reject. |
| `NEEDS_REVISION` | Board member votes to return for revision. |

### BoardDecisionStatus

| Value | Meaning |
| --- | --- |
| `PENDING` | Board decision is still collecting votes. |
| `APPROVED` | Board finalized approval. |
| `REJECTED` | Board finalized rejection. |
| `NEEDS_REVISION` | Board finalized revision request. |
| `TIE_BREAK_REQUIRED` | Vote result requires Board Chair tie-break. |
| `FINALIZED` | Decision record is final and immutable except audit notes. |

### RankingStatus

| Value | Meaning |
| --- | --- |
| `DRAFT` | Ranking import is being prepared. |
| `IMPORTED` | Ranking data was imported. |
| `REVIEWED` | Board reviewed ranking data. |
| `FINALIZED` | Ranking period is finalized. |
| `WARNING` | Series needs warning/watch. |
| `AT_RISK` | Series is at risk and requires Board action. |

### AtRiskDecision

| Value | Meaning |
| --- | --- |
| `CONTINUE` | Continue publishing without additional action. |
| `WARNING` | Continue with a Board warning. |
| `REQUEST_IMPROVEMENT_PLAN` | Require Mangaka/Editor improvement plan. |
| `CANCEL` | Cancel the Series manually. |

### AssistantEarningStatus

| Value | Meaning |
| --- | --- |
| `PENDING` | Earning calculated but not confirmed. |
| `CONFIRMED` | Mangaka confirmed the payout record. |
| `PAID` | Payment was marked paid for tracking. |
| `VOID` | Earning was voided for audit-supported correction. |

## Allowed Status Transitions

### SeriesStatus

```txt
DRAFT -> EDITOR_REVIEW
EDITOR_REVIEW -> REVISION_REQUESTED
EDITOR_REVIEW -> BOARD_REVIEW
EDITOR_REVIEW -> REJECTED
REVISION_REQUESTED -> EDITOR_REVIEW
BOARD_REVIEW -> APPROVED
BOARD_REVIEW -> REVISION_REQUESTED
BOARD_REVIEW -> REJECTED
APPROVED -> ONGOING
ONGOING -> AT_RISK
AT_RISK -> ONGOING
AT_RISK -> CANCELLED
ONGOING -> COMPLETED
```

Chapter creation is allowed only when Series status is `APPROVED`, `ONGOING`,
or `AT_RISK`. `AT_RISK` must show a warning but can still create chapters.

### ManuscriptStatus

```txt
DRAFT -> SUBMITTED
SUBMITTED -> EDITOR_REVIEW
EDITOR_REVIEW -> REVISION_REQUESTED
EDITOR_REVIEW -> APPROVED_TO_BOARD
EDITOR_REVIEW -> REJECTED
REVISION_REQUESTED -> SUBMITTED
```

Manuscript versions must not overwrite previous versions.

### ChapterStatus

```txt
DRAFT -> IN_PRODUCTION
IN_PRODUCTION -> IN_REVIEW
IN_REVIEW -> REVISION_REQUIRED
REVISION_REQUIRED -> IN_PRODUCTION
IN_REVIEW -> READY_FOR_PUBLICATION
READY_FOR_PUBLICATION -> PUBLISHED
```

`READY_FOR_PUBLICATION` may be set only from
`PublicationReadinessService`.

### PageStatus

```txt
UPLOADED -> ASSIGNED
ASSIGNED -> IN_PROGRESS
IN_PROGRESS -> SUBMITTED
SUBMITTED -> APPROVED
SUBMITTED -> REVISION_REQUESTED
REVISION_REQUESTED -> IN_PROGRESS
```

### TaskStatus

```txt
TODO -> IN_PROGRESS
IN_PROGRESS -> SUBMITTED
SUBMITTED -> MANGAKA_APPROVED
SUBMITTED -> REVISION_REQUESTED
SUBMITTED -> REJECTED
MANGAKA_APPROVED -> EDITOR_APPROVED
MANGAKA_APPROVED -> REVISION_REQUESTED
REVISION_REQUESTED -> IN_PROGRESS
```

Only `EDITOR_APPROVED` can trigger payroll calculation. `REJECTED` means
payment is zero.

### SubmissionStatus

```txt
SUBMITTED -> MANGAKA_APPROVED
SUBMITTED -> REVISION_REQUESTED
SUBMITTED -> REJECTED
MANGAKA_APPROVED -> EDITOR_APPROVED
MANGAKA_APPROVED -> REVISION_REQUESTED
REVISION_REQUESTED -> SUBMITTED
```

Submitted versions are immutable. Revisions create a new version.

### CommentStatus

```txt
OPEN -> FIXED_BY_ASSISTANT
FIXED_BY_ASSISTANT -> VERIFIED_BY_MANGAKA
VERIFIED_BY_MANGAKA -> RESOLVED_BY_EDITOR
FIXED_BY_ASSISTANT -> OPEN
VERIFIED_BY_MANGAKA -> OPEN
```

Publication is blocked unless all comments are `RESOLVED_BY_EDITOR`.

### AssistantEarningStatus

```txt
PENDING -> CONFIRMED
CONFIRMED -> PAID
PENDING -> VOID
CONFIRMED -> VOID
```

## Editor Responsibility Split

Tantou Editor has two distinct responsibilities:

1. Proposal review before Board:
   - Review initial manuscript/proposal.
   - Request revision.
   - Reject.
   - Forward to Board.
2. Production final approval after Mangaka review:
   - Review page/task/submission after Mangaka approval.
   - Request revision.
   - Final approve.
   - Create/resolve comments.
   - Check publication readiness.

Future API handlers and permissions must not collapse these into a single
ambiguous "editor approve" action.

## Board Vote Rules

- Vote options are `APPROVE`, `REJECT`, and `NEEDS_REVISION`.
- A Board vote is valid only for Series in `BOARD_REVIEW`.
- Minimum valid votes: at least `3` active Board members or all active Board
  members if fewer than three exist in a seeded/dev environment.
- Board Chair votes normally as a Board member.
- Board Chair tie-break is a separate action only when normal votes do not
  produce a winning option.
- Three-option majority rule:
  - If one option has strictly more votes than every other option, it wins.
  - If two or more options tie for highest count after the deadline or after
    all eligible votes are submitted, result is `TIE_BREAK_REQUIRED`.
  - A single leading option can win even if it is not over 50 percent of all
    votes, because MVP uses plurality among three options.
- Vote deadline:
  - A Board decision may be finalized after all active eligible Board members
    voted or when the configured vote deadline passes.
  - Before the deadline, finalization is allowed only when all eligible votes
    are in.
  - Expired votes are still auditable but cannot be changed after finalization.
- Admin cannot override Board decisions.

## PublicationReadinessService Contract

Future backend implementation must expose a backend-owned
`PublicationReadinessService`.

Inputs:

- Chapter.
- Pages.
- Tasks.
- Submissions.
- Comments.
- Editor final approval evidence.
- Publication schedule/date.

Checklist output:

| Check | Pass condition |
| --- | --- |
| `allPagesUploaded` | All required pages exist and are uploaded. |
| `allTasksApproved` | Every required task is `EDITOR_APPROVED`. |
| `allSubmissionsApproved` | Required submissions are `EDITOR_APPROVED`. |
| `allCommentsResolved` | Every blocking comment is `RESOLVED_BY_EDITOR`. |
| `editorFinalApprovalExists` | Editor final approval evidence exists. |
| `publicationDateExists` | Publication date/schedule exists. |

The service returns pass/fail plus item-level reasons. Controllers and UI must
not duplicate readiness logic.

## Assistant Access Security Invariant

Assistant access is task-based.

```txt
SeriesMember(role=ASSISTANT, status=ACTIVE, accessScope=TASK_ONLY)
= eligibility for assignment only.

Task.assignedTo = actual workspace access.
```

Assistant cannot:

- Open page workspace directly by `pageId`.
- View an entire chapter by default.
- View pages outside the assigned task and explicitly supplied
  `contextPageIds`.
- View another assistant's task.
- View Board data.
- Confirm payroll.
- Create tasks.

Backend checks must enforce these rules. Frontend checks are never sufficient.

## Payroll MVP Formula

Payroll is tracking only.

```txt
finalPayment = baseRate * deadlineMultiplier
```

Deadline multipliers:

| Condition | Multiplier |
| --- | ---: |
| Early by at least 24h | `1.10` |
| On time | `1.00` |
| Late by 24h or less | `0.95` |
| Late by more than 24h | `1.00` and mark late |
| Rejected task | `0.00` |

`revisionFee` is future scope and must not be implemented in the MVP formula
unless a later story updates this contract.
