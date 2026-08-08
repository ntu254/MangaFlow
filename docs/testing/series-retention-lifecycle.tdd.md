# Series retention lifecycle â€” TDD evidence

## Source and user journeys

Derived from the soft-delete defect review on 2026-08-08.

1. As a Mangaka, I cannot delete a Board-approved pre-production Series and break its Proposalâ€“Series audit link.
2. As any authorized user, I do not see a legacy soft-deleted Series as a normal, actionable production record.

## RED / GREEN evidence

| Guarantee | Test | RED evidence | GREEN evidence |
| --- | --- | --- | --- |
| A pre-production Series has no destructive delete endpoint | `series-retention.test.ts` | `DELETE /api/series/s-retention-delete` returned 200 | returned 404; record stayed `PRE_PRODUCTION` without `deletedAt` |
| Legacy soft-deleted Series is not actionable | `series-retention.test.ts` | `GET /api/series?mine=true` included the legacy record; PATCH returned 409 | list excludes it; detail and PATCH return 404 |

Commands run:

```text
npm test -- --run src/__tests__/series-retention.test.ts
```

Initial RED: 2 failing tests (DELETE returned 200; list included the soft-deleted Series).

Final GREEN: 1 passed file, 2 passed tests.

## Additional verification

```text
cd frontend && npm run typecheck
cd frontend && npm run build
```

Both frontend checks passed.

`npm run lint` in `backend` remains blocked by pre-existing TypeScript errors in
`migrate-page-on-planned.ts`, `migrate-series-member-scope.ts`, and
`task-orchestrator.ts`. The unrelated `admin-scope.test.ts` also deterministically
fails its Proposal ARCHIVE success case with 409; the retention test passes on its own.

Coverage could not be generated because this repository does not install
`@vitest/coverage-v8`; the behavior change is covered directly by its API integration test.
