# 0009 - Tantou Editor Assignment Owns Series Review

## Status

Accepted

## Context

The proposal flow needs a single Tantou Editor to follow a series from proposal review through production. The previous behavior allowed any `EDITOR` role user to see proposal review items, which made it unclear who owned the series and caused later production queues to depend on incomplete membership data.

## Decision

MangaFlow stores Tantou Editor assignment as an active `SeriesMember` with `role = EDITOR` and `accessScope = FULL`.

Admin assigns the Tantou Editor after Mangaka creates the proposal and before Mangaka submits it to Editor review. Mangaka submission is blocked until the assignment exists.

Editor proposal queues and proposal review actions are scoped to the assigned Tantou Editor. Reassigning the Tantou Editor removes the previous active Editor membership for that series in MVP.

## Consequences

- `POST /api/series/:seriesId/assign-editor` is the Admin assignment endpoint.
- `POST /api/series/:seriesId/submit` requires an active Editor `SeriesMember`.
- `GET /api/editor/manuscripts/review-queue` returns only proposals assigned to the current Editor.
- Editor review decisions reject users who are not the assigned Tantou Editor.
- Existing production dashboards continue to use `SeriesMember(role = EDITOR)` as the source of truth.
