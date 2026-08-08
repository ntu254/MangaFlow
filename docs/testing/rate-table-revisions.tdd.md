# Rate-table revisions - TDD evidence

## User journeys

1. As an Admin, I can schedule a replacement rate without creating an overlap or a pricing gap.
2. As a task creator, a rate policy always resolves to at most one effective version.

## RED / GREEN evidence

| Guarantee | Test | RED evidence | GREEN evidence |
| --- | --- | --- | --- |
| Updating an active window cannot overlap another active version | `rate-table.test.ts` | PATCH returned 200 | PATCH returns `409 RATE_WINDOW_OVERLAP` |
| A scheduled revision closes its predecessor at the new start date | `rate-table.test.ts` | revision route returned 404 | revision is created as version 2 and predecessor ends at the revision start |

Commands run:

```text
cd backend && npm test -- --run src/__tests__/rate-table.test.ts
cd frontend && npm run typecheck
```

Initial RED: 2 failures (overlap accepted; revision endpoint missing).
Final GREEN: backend file passed all 10 tests; frontend typecheck passed.

Coverage is not available because `@vitest/coverage-v8` is not installed in this repository.
