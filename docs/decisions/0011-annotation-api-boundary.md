# 0011 Annotation API Boundary

Date: 2026-06-03

## Status

Accepted

## Context

EPIC-08 needs page-level review markers before editor comments, revision
requests, and full comment lifecycle can be implemented. The product spec
mentions annotations, comments, page targets, task targets, and submission
targets, but the current implemented stack only has verified Page, Region, and
Page Workspace foundations.

## Decision

MangaFlow implements Annotation as a page-scoped MongoDB record for this slice.
The MVP Annotation target is fixed to `PAGE`, with normalized `RECTANGLE`
coordinates, optional `regionId`, optional review `comment`, and
`OPEN | RESOLVED` status.

Annotation authorization resolves Page -> Chapter -> Series before access.
Admins can access globally. Series members can list/detail annotations.
Mangaka owners/co-mangakas, assigned Editors, and Admins can create
annotations. Mutation is limited to the creator, assigned Editors, and Admins.

The full comment lifecycle remains a separate domain and will be implemented
through a dedicated Comment API story.

## Alternatives Considered

1. Implement Annotation and Comment lifecycle together. Rejected because comment
   lifecycle has additional role-specific transitions and should have separate
   proof.
2. Support Task and Submission annotation targets immediately. Rejected because
   those target modules are not implemented enough to validate ownership and
   authorization safely.

## Consequences

Positive:

- Page review markers can be stored and verified before building UI panels.
- Future comments can link to stable annotation ids.
- Authorization follows the same series-scope pattern as Region.

Tradeoffs:

- Task/submission annotations remain unsupported until their domains are
  implemented.
- `POST /api/annotations/:annotationId/comment` is still out of scope.

## Follow-Up

- Add frontend annotation panel in Page Workspace.
- Add Comment API lifecycle with mark-fixed, verify-fixed, resolve, and reopen.
- Add task/submission annotation targets after their ownership boundaries exist.
