# Overview

## Current Behavior

MangaFlow frontend Series list and detail screens render mock data. No real Series API exists.

Assistant role has undefined Series access boundary.

## Target Behavior

After MF-HIOS-035:

- `GET /api/series` returns owned Series for Mangaka, Board-visible Series for Board, all Series for Admin/Editor.
- `GET /api/series/:seriesId` enforces owner/role access rules.
- Assistant is explicitly blocked from Series list; detail access is forbidden unless the Assistant owns the Series (task-scoped access enforcement is a separate story).
- Frontend `SeriesListPage` and `SeriesDetailPage` call real API and handle empty/loading/error states.
- Create Series dialog remains local until backend Series creation is implemented.
- Manuscript upload boundary remains disabled.

## Affected Users

- Mangaka: can list and view only owned Series.
- Board: can list and view Series in Board-stage statuses.
- Admin/Editor: can list and view all Series.
- Assistant: explicitly denied Series list; detail forbidden unless owner.

## Affected Product Docs

- `docs/product/requirements.md`
- `docs/contracts/series-proposal.md`
- `docs/contracts/ui-series-chapter.md`

## Non-Goals

- Manuscript upload signed URL generation.
- Task-scoped Assistant chapter/page access.
- Board approval gate enforcement beyond list/detail filtering.
