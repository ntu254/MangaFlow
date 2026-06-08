# Publication and Ranking Contract

## Scope

Publish ready chapters, import ranking data, and handle at-risk Series review.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Editor, Board, System

## Business rules

- Status names and transitions must follow `docs/contracts/workflow-status.md`.
- Editor manages concrete chapter publication schedule.
- Board approves Series publication type, but does not vote every Chapter.
- Publication readiness is owned by backend `PublicationReadinessService`.
- Controllers and frontend screens must not duplicate readiness logic.
- Board imports ranking data.
- Ranking final score is `voteCount * 0.7 + (readerScore * 10) * 0.3`.
- Series is not auto-cancelled.
- At-risk cancellation is a manual Board decision.

## PublicationReadinessService

Input:

- Chapter.
- Pages.
- Tasks.
- Submissions.
- Comments.
- Editor final approval evidence.
- Publication date/schedule.

Required checklist:

| Check | Pass condition |
| --- | --- |
| `allPagesUploaded` | All required pages exist and are uploaded. |
| `allTasksApproved` | Every required task is `EDITOR_APPROVED`. |
| `allSubmissionsApproved` | Required submissions are `EDITOR_APPROVED`. |
| `allCommentsResolved` | Every blocking comment is `RESOLVED_BY_EDITOR`. |
| `editorFinalApprovalExists` | Editor final approval evidence exists. |
| `publicationDateExists` | Publication date/schedule exists. |

Output:

- Overall pass/fail.
- Item-level pass/fail.
- Human-readable reason for every failed item.

## API surface

`GET /api/chapters/:id/readiness`
`POST /api/publications`
`POST /api/publications/:id/schedule`
`POST /api/publications/:id/publish`
`POST /api/rankings/import`
`POST /api/rankings/:id/finalize`
`POST /api/board/series/:seriesId/at-risk-decisions`

## Acceptance criteria

- Readiness checklist returns pass/fail with item-level reasons.
- Chapter cannot publish when readiness is blocked.
- Ranking formula is correct.
- At-risk requires Board decision.
- Series cancellation is manual and auditable.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
