# Design

## Domain Model

Add a Publication record that tracks the chapter, series, scheduled date, and publish audit fields.

## Application Flow

1. Editor creates a Publication record for a chapter.
2. Editor schedules the publication date.
3. Editor calls publish.
4. Service loads readiness from `PublicationReadinessService`.
5. If readiness passes, chapter status is advanced to `READY_FOR_PUBLICATION` and then `PUBLISHED`.
6. Publication record stores `publishedAt` and `publishedBy`.

## Interface Contract

Routes:

```txt
POST /api/publications
POST /api/publications/:id/schedule
POST /api/publications/:id/publish
```

Errors:

- `404` for missing chapter/publication.
- `403` for non-Editor access or non-series Editor membership.
- `409` when readiness is blocked or a publication is already published.

## Data Model

New `Publication` collection with chapter uniqueness and audit fields.

## UI / Platform Impact

No UI change in this story.

## Observability

Harness trace and service unit tests prove behavior.

## Alternatives Considered

1. Publish directly from chapter readiness endpoint. Rejected because publication is a separate workflow action.
2. Store schedule only on Chapter. Rejected because publication needs its own audit record.
