# Design

## Domain Model

No new collection is introduced. Readiness derives from existing collections:

- Chapter
- Page
- Task
- Submission
- Comment

## Application Flow

1. Caller requests `GET /api/chapters/:chapterId/readiness`.
2. Route applies `requireAuth` and role guard for `ADMIN`, `MANGAKA`, and `EDITOR`.
3. Repository loads the chapter and related pages/tasks/submissions/unresolved blocking comments.
4. Service evaluates the publication readiness checklist.
5. Controller returns standard API envelope.

## Interface Contract

Route:

```txt
GET /api/chapters/:chapterId/readiness
```

Response data:

```ts
{
  chapterId: string
  chapterStatus: string
  ready: boolean
  items: Array<{
    key:
      | "allPagesUploaded"
      | "allTasksApproved"
      | "allSubmissionsApproved"
      | "allCommentsResolved"
      | "editorFinalApprovalExists"
      | "publicationDateExists"
    passed: boolean
    reason: string
  }>
}
```

## Checklist Rules

- `allPagesUploaded`: every existing page is `UPLOADED` or `APPROVED`, and at least one page exists.
- `allTasksApproved`: every task is `EDITOR_APPROVED`, and at least one task exists.
- `allSubmissionsApproved`: every submission is `EDITOR_APPROVED`, and at least one submission exists.
- `allCommentsResolved`: no blocking unresolved comments exist.
- `editorFinalApprovalExists`: at least one task or submission has `EDITOR_APPROVED`.
- `publicationDateExists`: chapter has `draftSchedule`.

## Data Model

No migration. Query uses existing chapter-level indexes.

## UI / Platform Impact

No frontend route is changed in this story. Existing UI can later consume this endpoint instead of sample readiness data.

## Observability

Harness trace captures proof. Persistent audit logs for readiness checks remain future scope.

## Alternatives Considered

1. Duplicate readiness logic in frontend. Rejected by contract.
2. Mutate Chapter status to `READY_FOR_PUBLICATION` immediately when readiness passes. Rejected for this foundation slice; status mutation needs a separate explicit action story.
