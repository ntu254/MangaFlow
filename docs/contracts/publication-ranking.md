# Publication and Ranking Contract

## Scope

Publish ready chapters and rank series.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Editor, Board, System

## Business rules

- Editor manages concrete chapter schedule.
- Board imports ranking.
- Series is not auto-cancelled.

## API surface

`GET /api/chapters/:id/readiness`
`POST /api/publications`
`POST /api/rankings/import`

## Acceptance criteria

- Readiness checklist returns pass/fail.
- Ranking formula is correct.
- At-risk requires Board decision.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
