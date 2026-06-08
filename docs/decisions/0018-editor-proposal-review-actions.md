# 0018 Editor Proposal Review Actions

Date: 2026-06-08

## Status

Accepted

## Context

MangaFlow distinguishes Editor proposal review from Editor production final approval. Once Mangaka submits a Series, the initial Manuscript/Series enters `EDITOR_REVIEW`. Editor needs explicit action endpoints before Board review can begin.

## Decision

Implement Editor proposal review through explicit POST action endpoints:

- `POST /api/manuscripts/:id/request-revision`
- `POST /api/manuscripts/:id/forward-to-board`
- `POST /api/manuscripts/:id/reject`

Only `EDITOR` can invoke these routes. Actions require both Manuscript and Series to be in `EDITOR_REVIEW`. Forwarding to Board sets Manuscript `APPROVED_TO_BOARD` and Series `BOARD_REVIEW`.

## Alternatives Considered

1. Generic PATCH status: rejected; workflow actions must be explicit.
2. Admin override endpoint: rejected by Board/Admin invariants.
3. Use submission review module: rejected because proposal review and production final approval are distinct.

## Consequences

Positive:

- Board workflow receives only Editor-forwarded proposals.
- Proposal review is distinct from production final approval.
- Backend owns transition rules.

Tradeoffs:

- No audit log yet.
- No frontend review integration yet.

## Follow-Up

- Add review queue UI wiring.
- Add Board voting module.
- Add audit events for proposal decisions.
