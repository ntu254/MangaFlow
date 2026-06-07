# Chapter Production Contract

## Scope

Create chapters and upload pages after approval.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Mangaka, Editor, System

## Business rules

- Series must be APPROVED/ONGOING/AT_RISK.
- Board does not vote every chapter.

## API surface

`POST /api/series/:seriesId/chapters`
`POST /api/chapters/:chapterId/pages`

## Acceptance criteria

- Chapter creation blocked before approval.
- Approved series can create chapter.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
