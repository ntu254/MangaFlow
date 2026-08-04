# Mobile Editor Activity Integrity Design

## Goal

Ensure **My Editorial Activity** is a truthful, actor-and-role-scoped audit feed with real chapter and series context for every supported comment target.

## Decisions

- `GET /api/editor/activity` reads immutable `AuditEntry` records where both `actorId` equals the authenticated user and `actorRole` is exactly `EDITOR`. The current account role authorizes endpoint access; the persisted audit role proves the role held when the action occurred.
- Only actions classified as editorial proposal, chapter, comment, or publication work are returned. Records made under Mangaka, Board, or another historical role never appear after a role change.
- Comment context resolves in this order: direct `chapterId`; direct CHAPTER target; TASK/REGION via their `chapterId`; SUBMISSION via its `chapterId`; PAGE by locating the owning chapter. A missing or deleted target remains a safe fallback rather than inventing context.
- Existing activity endpoint shape and the Editor/Board presentation separation remain unchanged. No new UI copy or navigation flow is introduced.

## Verification

- An integration test seeds matching actor IDs with different immutable `actorRole` values and proves only the `EDITOR` record is returned.
- Integration tests cover each non-direct comment target supported by comment authorization: PAGE, REGION, TASK, and SUBMISSION; each returned activity row includes the real series title and chapter number.
- Existing mobile activity mapper/screen tests and backend lint/build remain green.
