# Design

## Contract Alignment

- Payroll remains tracking only.
- The Admin page displays backend-calculated `baseRate`, `deadlineMultiplier`, and `finalPayment`.
- The page does not calculate earnings or expose revision fees.
- Confirm and mark-paid actions call existing backend action endpoints.
- Mark-paid is a tracking status transition, not payment execution.

## UI

`/app/admin/payroll` shows:

- Admin/backend/tracking badges.
- Copy that states payroll is tracking-only.
- Summary cards for pending confirmations, confirmed amount, paid amount, and late earnings.
- Earnings table with task, assistant, base rate, multiplier, final payment, status, late flag, calculated date, and actions.
- Confirmation prompts before state-changing actions.

## Backend

No new route is required. Existing payroll services enforce:

- Admin can list all earnings.
- Admin can confirm pending earnings.
- Only Admin can mark confirmed earnings paid.

## Data

No schema changes. Existing `AssistantEarning` records remain the source of truth.
