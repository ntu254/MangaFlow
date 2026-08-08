# Chapter delivery deadlines — TDD evidence

## Behaviour

- A Chapter may be created without a delivery plan.
- A provided draft-ready or Tantou-review deadline must be a valid ISO timestamp
  and must not be in the past.
- If both dates are provided, Tantou review must complete at least one full day
  after draft delivery.
- The rule applies when a PATCH changes only one of the two dates; the server
  validates the merged plan rather than only the request body.

## Red

`validation-guardrails.test.ts` added two API regression cases. Before the
implementation, an invalid draft date reached MongoDB and produced HTTP 500,
and PATCH could move `reviewDueAt` onto the stored `draftDueAt` and return 200.

## Green

The schema now accepts only ISO timestamps with an offset. Create and PATCH
validate the same past-date and one-day-buffer rules. `patchChapter` merges a
deadline edit with the persisted Chapter before validation.

## Verification

```text
cd backend && npm test -- --run src/__tests__/validation-guardrails.test.ts
```

The two deadline regression tests pass. The suite still has one pre-existing
fixture failure in `rejects task assignment when the selected page has no
durable source asset`: its fixture now supplies a `https://picsum.photos/...`
URL while the test expects a `metadata:` URL.

```text
cd frontend && npm run typecheck
```

Passed.
