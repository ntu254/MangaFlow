---
version: 1
slug: "tend-src-routes-app-mangaka-submissions-review-tsx"
primary_target: "frontend/src/routes/app.mangaka.submissions..review.tsx"
related_targets: ["frontend/src/entities/submission/ui/submission-review-workspace.tsx","frontend/src/features/editor/submission-review/components/editor-submission-review.tsx"]
---

# Surface — submission review workspace (mangaka + editor)

## Scope and mode
The single-submission review workspace, shared by the mangaka review route
(`/app/mangaka/submissions/$submissionId/review`) and the editor reference route
(`/app/editor/review/$submissionId`). Operate mode: a deciding workspace.

## Audience / job
Reviewer decides one page asset with full context: original vs edited
comparison, submission note, prior feedback, task comments, version history,
then acts (approve / request revision / reject) with a reason when required, and
returns to the queue.

## Direction
Light register world shared with /app/proposals, /app/series, the dashboards,
and the review queue: standard tokens, serif page title with a status pill,
white cards with serif card titles, tinted decision buttons (ink / amber /
destructive) gated behind `isReviewable`, amber and rose notice boxes,
dashed-light missing state, muted uppercase tracked info labels. Deliberately
refuses the cream admin-* palette in its own markup.

## Constraints
- Entity components (`SubmissionReviewWorkspace/Loading/Missing`,
  `SubmissionHistoryList`) and `ImageCompare` are SHARED between the mangaka and
  editor routes — both render the same light world; porting touched both.
- Decision buttons render only when `isReviewable` (PENDING/SUBMITTED);
  otherwise the processed message. Approve is disabled for self-submissions
  (rose notice explains). Reason textarea is required (>= 3 chars) for
  request-revision and reject.
- Back links, decision mutations, comparison conditions, and history ordering
  are unchanged from the previous implementation.

## Unresolved
- The reviewable branch (enabled buttons + reason flow) could not be exercised
  end-to-end in dev data: every chapter is PUBLISHED or TANTOU_REVIEW-locked, so
  the backend refuses new submissions. Code path is gated identically to the
  audited processed branch.
- The editor workspace still sits in an otherwise cream editor world; when the
  editor surfaces are ported, this page is already done.
