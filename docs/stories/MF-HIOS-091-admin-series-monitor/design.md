# Design

## Domain Model

No data model changes.

Existing Series fields are displayed as read-only monitor data:

- title
- status
- genres
- slug
- updated date
- owner id

## Application Flow

Admin opens `/app/admin/series`.

The page calls existing `GET /api/series`. Backend role rules already allow Admin to list all Series, while Assistant remains blocked and Mangaka remains owner-scoped.

The UI renders read-only summary cards and `SeriesListPanel` in monitor mode.

## Interface Contract

Existing route:

```txt
GET /api/series
```

No new backend route is introduced.

## Data Model

No schema, index, migration, or retention change.

## UI / Platform Impact

`/app/admin/series` changes from placeholder to real monitor page. It must not include create, submit, approve, reject, publish, or Board action controls.

## Observability

Validation proof is recorded through:

- server unit test
- server/client lint and build
- Harness story verification

## Alternatives Considered

1. Add `/api/admin/series`. Deferred because the existing `/api/series` route already has role-aware Admin listing behavior and this story does not need a new public contract.
2. Reuse the normal Series page. Rejected because that page includes Mangaka-oriented manuscript controls.

