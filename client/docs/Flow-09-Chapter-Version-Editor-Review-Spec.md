# Flow 09: Mangaka Chapter Version Editor Review

## Summary

Flow 09 defines the chapter-level review loop where Mangaka submits a complete
chapter package as version `v1`, `v2`, or later for Tantou Editor review.

This flow is separate from Assistant task submissions. Assistant `Submission`
versions remain task-level. `ChapterVersion` is the canonical chapter-level
submission version used for direct final-page review and publication candidate
locking. The system does not create separate `SubmissionVersion` or
`PageVersion` entities in MVP.

## Version Loop

```
Mangaka submits chapter v1
-> Editor opens v1 and writes overall review
-> Editor adds page annotations if needed
-> Editor approves or requests revision
-> If revision requested, Mangaka updates pages and submits v2
-> Editor reviews again
-> Repeat until approved
-> Approved version is locked and becomes publishing candidate
```

Rules:

- Do not overwrite old versions.
- Every resubmit creates `ChapterVersion.version = max(existing) + 1`.
- `ChapterVersion.pageSnapshots[]` is the canonical immutable page-version
  snapshot package for the submitted version.
- Editor overall review is stored in `ChapterVersion.reviewerNote` and is
  required for both approval and revision request.
- Editor annotations attach to `chapterVersionId + pageId`, where `pageId` must
  exist in the version's `pageSnapshots[]`.
- Only `SUBMITTED` versions can be approved or sent back for revision.
- Approved versions are locked (`isLocked = true`) and cannot be annotated as
  active work.
- Reject is out of MVP for chapter version review. Editor decisions are
  `Approve` or `Request Revision` only.
- Board does not approve individual chapters in MVP.

## Backend Entities

`ChapterVersion`

- `seriesId`
- `chapterId`
- `version`
- `status`: `SUBMITTED`, `REVISION_REQUESTED`, `APPROVED`
- `submittedBy`, `submittedAt`
- `reviewedBy`, `reviewedAt`, `reviewerNote`
- `isLocked`, `lockedAt`, `lockedBy`
- `pageSnapshots[]` (page version snapshots): `pageId`, `pageNumber`, `fileAssetId`,
  `originalFileAssetId`, `workingFileAssetId`, `thumbnailFileAssetId`, `status`

`ChapterReviewAnnotation`

- `chapterVersionId`
- `chapterId`
- `pageId`
- `body`
- `geometry`
- `isBlocking`
- `status`: `OPEN`, `RESOLVED`
- `authorId`

`Chapter`

- `publishingCandidateVersionId`

`Publication`

- `chapterVersionId`

## API

Mangaka:

```
POST /api/chapters/:chapterId/review-versions
GET  /api/chapters/:chapterId/review-versions
```

Editor:

```
GET  /api/editor/chapter-review-queue
GET  /api/chapter-review-versions/:versionId
POST /api/editor/chapter-review-versions/:versionId/request-revision
POST /api/editor/chapter-review-versions/:versionId/approve
```

Annotations:

```
GET   /api/chapter-review-versions/:versionId/annotations
POST  /api/chapter-review-versions/:versionId/annotations
PATCH /api/chapter-review-annotations/:annotationId
```

## UI

Mangaka chapter screen:

- Shows `Chapter review versions`.
- Submit button creates `v1` or next version.
- Version history shows status, reviewer note, lock state and page count.
- If a version is `SUBMITTED`, another version cannot be submitted until Editor
  requests revision.

Editor:

- `/app/editor/chapter-reviews` lists submitted chapter packages.
- `/app/editor/chapter-reviews/:versionId` shows page snapshots, annotations,
- required overall review, request revision, and approve actions.
- Decision actions are disabled until the overall review has text.
- Approve is disabled while open blocking annotations exist.
- Reject is not shown in MVP.

Publication:

- Publication creation uses the approved locked `ChapterVersion` as source.
- A chapter without an approved locked version is not a publication candidate.

## Acceptance Criteria

- Submit v1 creates a `ChapterVersion` with page snapshots.
- Revision request leaves v1 intact and lets Mangaka submit v2.
- Approval and revision request require `reviewerNote` as the overall review.
- Approved version is locked and stored on `Chapter.publishingCandidateVersionId`.
- Publication stores `chapterVersionId`.
- Annotation records always point to a specific `chapterVersionId + pageId`, and
  the page must belong to that version's `pageSnapshots[]`.
- No Reject API or UI is required in MVP.
