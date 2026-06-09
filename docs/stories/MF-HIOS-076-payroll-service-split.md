# MF-HIOS-076 Payroll Service Split

## Status

implemented

## Lane

normal

## Product Contract

Payroll MVP formula, calculation timing, confirmation, paid marking, and actor access behavior remain unchanged while payroll service internals are split into focused policy, calculation, command, and query modules.

## Relevant Product Docs

- `docs/product/requirements.md`
- `docs/contracts/payroll.md`
- `docs/contracts/submission-review.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/main.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Make `payroll.service.ts` a thin barrel export.
- Move payroll access checks into a policy.
- Move deadline multiplier and rounding into a calculation utility.
- Split calculate, confirm/paid, and list responsibilities.
- Preserve controller imports and API behavior.

Out of scope:

- Formula changes.
- New payroll endpoints.
- Payment/provider integration.
- Revision fee support.
- Schema changes.

## Acceptance Criteria

- Payroll service facade is small and stable.
- Payroll formula remains `finalPayment = baseRate * deadlineMultiplier`.
- Rejected task payment remains zero.
- Assistant cannot confirm payroll.
- Only Admin can mark earnings paid.
- Server/client lint/build and related tests pass.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Existing payroll tests pass. |
| Integration | Not required; API contract unchanged. |
| E2E | Not configured. |
| Platform | Server/client lint/build plus docs verifiers. |
| Release | Not applicable. |

## Manual QA

1. Calculate payroll after Editor approval.
2. Calculate rejected task payment and confirm zero payment.
3. Confirm earning as Mangaka/Admin.
4. Confirm Assistant cannot confirm payroll.
5. Mark confirmed earning paid as Admin only.
6. List payroll as Admin, Assistant, and Mangaka.

## Evidence

- `npm run lint --prefix server` -> PASS.
- `npm run build --prefix server` -> PASS.
- `npm run test --prefix server -- payroll dashboard admin series manuscript chapter task submission comment publication board ranking accessPolicy env` -> PASS (20 files, 94 tests).
- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS (bundle-size warning only).
- Product contract, architecture docs, and UI design-system verifiers -> PASS.
- `server/src/modules/payroll/payroll.service.ts` reduced from 120 to 5 lines.
