# Production Team Contract

## Scope

Manage SeriesMember team.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Mangaka, Editor, Assistant

## Business rules

- Adding Assistant to team only makes them eligible for assignment.
- It does not grant full chapter access.

## API surface

`GET /api/series/:seriesId/members`
`POST /api/series/:seriesId/members`

## Acceptance criteria

- Assistant appears in task dropdown.
- Assistant cannot view all pages.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
