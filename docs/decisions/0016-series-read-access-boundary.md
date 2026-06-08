# 0016 Series Read Access Boundary

Date: 2026-06-08

## Status

Accepted

## Context

MF-HIOS-035 adds read endpoints for Series list/detail. This changes API shape and authorization behavior. The Assistant access model was clarified by the user: Production Team membership means assignment eligibility only, while real access is granted through Task Access Scope and context pages.

## Decision

Series read access is enforced by backend services:

- Mangaka can list and view only owned Series.
- Admin and Editor can list and view all Series.
- Board can list and view Board-stage Series only.
- Assistant cannot list Series. Assistant workspace/page access remains task-scoped and is handled by later Task Access Scope work.

Board-visible statuses are `BOARD_REVIEW`, `APPROVED`, `ONGOING`, `AT_RISK`, `REJECTED`, `CANCELLED`, and `COMPLETED`.

## Alternatives Considered

1. Allow Assistant to list Production Team Series. Rejected because Production Team is assignment eligibility, not access.
2. Allow Board to see all proposal drafts. Rejected because Board should enter after Editor proposal review.
3. Keep frontend mocked until all Board workflow is ready. Rejected because Series vertical slice needs real read API first.

## Consequences

Positive:

- Backend owns Series read authorization.
- Assistant is not granted broad Series access by membership.
- Frontend can move from presentation-only to real data without inventing permissions.

Tradeoffs:

- Board visibility is status-filtered before the full Board module exists.
- Task-scoped Assistant access still needs a separate story.

## Follow-Up

- Implement Task Access Scope values: `REGION_ONLY`, `PAGE_ONLY`, `PAGE_WITH_CONTEXT`, `CHAPTER_READ_ONLY`.
- Add integration/E2E authorization proof when test infrastructure exists.
