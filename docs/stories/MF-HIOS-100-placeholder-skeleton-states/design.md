# Design

## Contract Alignment

- Placeholder routes remain registered but do not claim unsupported backend behavior.
- Skeletons use shared MangaFlow components and design tokens.
- Light pastel UI style is preserved.

## UI

Registered placeholder routes show:

- `PageShell`.
- `MFCard` hero with registered-route and backend-boundary badges.
- Summary cards for status, permission model, and next step.
- Boundary text explaining backend remains the source of truth.

Lazy route loading shows:

- Shared route-level skeleton with hero, KPI cards, and main content placeholder.

## Backend

No backend changes.

## Data

No schema changes.
