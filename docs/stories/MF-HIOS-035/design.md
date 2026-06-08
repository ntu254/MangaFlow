# Design

## Domain Model

**Series**: the core proposal entity with title, synopsis, genres, owner, status.

**SeriesMember**: join table linking Users to Series with role (MANGAKA, ASSISTANT, EDITOR).

**Authorization rules**:

- Mangaka: can list/view only owned Series.
- Board: can list/view Series in Board-stage statuses (`BOARD_REVIEW`, `APPROVED`, `ONGOING`, `AT_RISK`, `REJECTED`, `CANCELLED`, `COMPLETED`).
- Admin/Editor: can list/view all Series.
- Assistant: cannot list Series; detail access forbidden unless owner (task-scoped enforcement deferred).

## Application Flow

**List Series**:

1. User authenticated via `requireAuth`.
2. Service checks role, builds filter.
3. Repository queries Series with filter + sort.
4. Controller wraps result in success envelope.

**Get Series Detail**:

1. User authenticated via `requireAuth`.
2. Service fetches Series by ID.
3. Service enforces owner/role access rules.
4. Controller wraps result in success envelope.

## Interface Contract

### `GET /api/series`

**Auth**: Required  
**Roles**: MANGAKA, BOARD, ADMIN, EDITOR (Assistant blocked with 403)

**Response** (200):

```json
{
  "success": true,
  "message": "Series retrieved successfully",
  "data": [
    {
      "id": "...",
      "title": "...",
      "slug": "...",
      "synopsis": "...",
      "genres": ["..."],
      "ownerId": "...",
      "status": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**Error** (403 for Assistant):

```json
{
  "success": false,
  "message": "Assistants cannot list Series; access is task-scoped only"
}
```

### `GET /api/series/:seriesId`

**Auth**: Required  
**Roles**: Any authenticated user (access enforced by ownership/role)

**Response** (200):

```json
{
  "success": true,
  "message": "Series retrieved successfully",
  "data": {
    "id": "...",
    "title": "...",
    "slug": "...",
    "synopsis": "...",
    "genres": ["..."],
    "ownerId": "...",
    "status": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Error** (403):

```json
{
  "success": false,
  "message": "Series access denied"
}
```

**Error** (404):

```json
{
  "success": false,
  "message": "Series not found"
}
```

## Data Model

Uses existing `series`, `series_members`, `manuscripts` collections. No schema changes.

## UI / Platform Impact

**Frontend**:

- `SeriesListPage` calls `listSeries()` API, renders `SeriesCard` grid, handles empty/loading/error states.
- `SeriesDetailPage` calls `getSeries(id)` API, renders detail view, handles 403/404/loading/error.
- `CreateSeriesDialog` remains local (backend creation deferred).

**States**:

- Loading: skeleton or spinner.
- Empty: "No Series proposals yet" message.
- Error: API error banner with retry option.
- Forbidden: "You don't have permission to view this Series" message.

## Observability

No audit logging for read-only Series list/detail in MVP.

## Alternatives Considered

1. **Task-scoped Assistant access in this story**: Deferred; requires Task → Chapter → Page linkage and workspace boundary enforcement (separate story).
2. **E2E authorization tests**: Out of scope; no E2E infrastructure exists yet.
3. **Backend Series creation in this story**: Out of scope; frontend Create dialog remains local for now.
