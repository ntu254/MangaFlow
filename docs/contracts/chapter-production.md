# Chapter Production Contract

## Scope

Create chapters and upload pages after approval.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Mangaka, Editor, System

## Business rules

- Status names and transitions must follow `docs/contracts/workflow-status.md`.
- Series must be APPROVED/ONGOING/AT_RISK.
- Board does not vote every chapter.
- Chapter status starts as `DRAFT` and moves into `IN_PRODUCTION` after page
  production begins.
- Page upload creates `UPLOADED` Page records after file validation and private
  storage processing.

## API surface

`POST /api/series/:seriesId/chapters`
`POST /api/chapters/:chapterId/pages`

## Acceptance criteria

- Chapter creation blocked before approval.
- Approved series can create chapter.
- At-risk series can create chapter with warning.
- Cancelled or completed series cannot create chapter.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
