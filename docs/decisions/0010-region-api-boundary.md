# 0010 Region API Boundary

Date: 2026-06-03

## Status

Accepted

## Context

EPIC-08 needs page-level work regions before annotation review, assistant task
assignment, AI detection, or canvas editing can be implemented safely. The
backend needed a stable API and storage boundary that preserves series-scoped
authorization without coupling Regions to future task/comment lifecycles.

## Decision

MangaFlow stores Regions as independent MongoDB records scoped to a Page.
Region authorization resolves Page -> Chapter -> Series before allowing access.
Admins can access globally. Series members can read Regions. Region mutations
are limited to Admin, Mangaka owner/co-mangaka, and assigned Editor roles.

MVP Region geometry is a normalized `RECTANGLE` with `x`, `y`, `width`, and
`height` constrained to the page bounds. `source` defaults to `MANUAL`; AI
sources can be stored later through the same contract.

## Alternatives Considered

1. Store Regions embedded inside Page documents. Rejected because future task
   assignment and annotation history need stable Region ids and independent
   lifecycle.
2. Build Region, Annotation, and task creation in one API slice. Rejected to
   keep coordinate validation and RBAC proof focused before adding review/task
   workflows.

## Consequences

Positive:

- Region APIs can be tested without the future Page Workspace UI.
- Region ids are stable for future annotation and task records.
- Authorization follows existing series membership patterns.

Tradeoffs:

- Annotation comments and task creation need follow-up stories.
- Non-rectangular shapes remain unsupported until product demand requires them.

## Follow-Up

- Add Page Workspace canvas UI against the Region API.
- Add Annotation/comment APIs once editor review behavior is selected.
- Add `POST /api/regions/:regionId/create-task` in a dedicated task story.
