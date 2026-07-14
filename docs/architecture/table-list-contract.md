# Table and List Contract

Every table/list in MangaFlow must follow this contract.

## Backend

- Server-side pagination.
- Global search across primary text columns.
- Column filters using the correct type:
  - text
  - select
  - date range
  - number range
  - boolean
- Sort ascending/descending on data columns.
- Never sort an Actions column.
- Validate `sortBy` and filter fields against a per-endpoint allowlist.
- Return `data`, `pagination`, and `meta`.
- Scope data by actor before returning results.

## Frontend

- Keep `page`, `pageSize`, `q`, `filters`, `sortBy`, and `sortDir` in the URL.
- Render loading, empty, and error states.
- Provide Reset Filters.
- Render row actions only when role, ownership, and workflow status allow them.
- Use shared table state helpers so URL behavior is consistent across roles.

## Validation

Each important list endpoint needs tests for:

- pagination
- global search
- column filter
- sort
- authorization scope
