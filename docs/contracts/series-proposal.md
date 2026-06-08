# Series Proposal Contract

## Scope

Mangaka creates and submits a Series proposal.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Mangaka, Editor

## Business rules

- Status names and transitions must follow `docs/contracts/workflow-status.md`.
- Series starts as DRAFT.
- Owner Mangaka is auto-created as SeriesMember.
- Required fields must be present before submit.
- Submit moves Series into Tantou Editor proposal review, not production final
  approval.

## API surface

`POST /api/series`
`POST /api/series/:seriesId/submit`

## Acceptance criteria

- Mangaka creates Series.
- Missing manuscript blocks submit.
- Submit changes status to EDITOR_REVIEW.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
