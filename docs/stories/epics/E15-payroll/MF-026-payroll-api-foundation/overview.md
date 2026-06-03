# MF-026 Payroll API Foundation

## Current Behavior

Tasks can be assigned, submitted, reviewed, and approved, but there is no
payroll model or API. `server/src/modules/payroll/index.ts` is currently an
empty placeholder.

## Target Behavior

The backend supports payroll tracking:

- Admin can create and maintain active TaskRate records.
- Mangaka/Admin can calculate AssistantEarning for approved Tasks.
- Assistants can view their own earnings.
- Mangaka/Admin can view payroll for a Series.
- Mangaka/Admin can confirm earnings.
- Admin can mark confirmed earnings as paid.

## Affected Users

- Assistant.
- Mangaka.
- Admin.

## Affected Product Docs

- `docs/06_mvp_task_breakdown.md`
- `docs/03_api_endpoints.md`
- `docs/01_complete_spec.md`
- `docs/product/mvp-roadmap.md`
- `docs/product/workflow.md`

## Non-Goals

- Real payment integration.
- Monthly payout batching.
- Payroll UI.
- Revision fee configuration UI.
