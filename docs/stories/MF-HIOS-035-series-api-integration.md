# MF-HIOS-035 Series API Integration

## Status

implemented

## Scope

Wire Series list/detail reads into backend and frontend without changing Series proposal workflow decisions.

## Selected docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/series-proposal.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Access rules implemented

- Mangaka lists and views owned Series only.
- Editor and Admin can read all Series.
- Board can read Board-stage Series only.
- Assistant cannot list Series; Assistant access remains task-scoped.

## Out of scope

- Manuscript upload.
- Editor proposal review.
- Board voting.
- Chapter creation.
- Assistant task workspace access scopes.

## Validation

- `npm run test --prefix server`
- `npm run build`

## Manual QA

- Login as Mangaka; open `/app/series`; create Series; list refreshes from backend.
- Open Series detail link; persisted Series detail loads.
- Login as Assistant; `/app/series` shows safe error because Series access is task-scoped.
- Verify manuscript upload panel still says local preview only.
