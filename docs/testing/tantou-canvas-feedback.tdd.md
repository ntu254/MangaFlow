# Tantou Review Canvas feedback — TDD evidence

## Public seam

`POST /api/comments` is the persisted feedback seam. An assigned Tantou creates
a Page-targeted comment with normalized canvas coordinates; content editing
remains out of scope for the Editor role.

## Red

The assigned-Tantou API contract added `x: 0.25` and `y: 0.75` to a blocking
comment. The request returned `400` because strict comment validation rejected
those coordinates.

## Green

The comment contract and persistence model accept coordinates from `0` through
`1`. The Review Canvas records the click as a page feedback pin and uses the
existing comment authority checks, so only the assigned Tantou can create a
blocking pin. Page assets and production Regions remain read-only.

## Verification

```text
cd backend && npm test -- --run src/__tests__/comment-authority.test.ts
```

Passed: 12 tests.

```text
cd frontend && npm run typecheck
```

Passed.
