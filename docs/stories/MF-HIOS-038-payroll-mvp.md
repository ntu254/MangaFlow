# MF-HIOS-038 Payroll MVP Module

## Status

implemented

## Lane

high-risk

## Product Contract

Track Assistant earnings by task after Editor production final approval. Payroll
is tracking only and does not execute real payments.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/payroll.md`
- `docs/contracts/submission-review.md`
- `docs/contracts/workflow-status.md`
- `docs/architecture/api.md`
- `docs/architecture/database.md`
- `docs/architecture/auth.md`
- `docs/architecture/security.md`
- `docs/validation/test-plan.md`

## Acceptance Criteria

- Approved task can create a `PENDING` Assistant earning.
- Rejected task calculates payment as `0`.
- `finalPayment = baseRate * deadlineMultiplier`.
- `baseRate` comes from the Task snapshot.
- `revisionFee` is not implemented.
- Assistant can list only own earnings.
- Assistant cannot confirm payroll.
- Earning status transitions follow `PENDING -> CONFIRMED -> PAID`.

## Design Notes

- API uses explicit POST action endpoints.
- Calculation is idempotent only while earning remains `PENDING`.
- `updatedAt` on the approved/rejected Task is used as the completion timestamp
  for MVP deadline multiplier calculation.
- Admin can calculate and mark paid; active Series Mangaka can calculate and
  confirm earnings for their Series.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Formula, zero rejected payment, Assistant own earnings, Assistant confirm blocked. |
| Integration | Deferred; no live Mongo fixture in CI. |
| E2E | Not configured. |
| Platform | `npm run build --prefix server`, root build if server passes. |
| Release | N/A |

## Harness Delta

Story number avoids the existing `MF-HIOS-036` manuscript upload task.

## Evidence

- `npm test --prefix server`: pass on 2026-06-08, 13 files / 61 tests.
- `npm run build --prefix server`: pass on 2026-06-08.
- `npm run lint --prefix server`: pass on 2026-06-08.
- `npm run build`: pass on 2026-06-08; Vite emitted an existing chunk-size warning.
