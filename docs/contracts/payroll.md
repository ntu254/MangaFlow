# Payroll Contract

## Scope

Track assistant earnings by task. Payroll in MVP is tracking only and does not
execute real payments.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

`revisionFee` is future scope and must not be implemented in the MVP formula
unless a later story updates this contract.

## Actors

Mangaka, Assistant, Admin, System

## Business rules

- Status names and transitions must follow `docs/contracts/workflow-status.md`.
- Payroll is tracking only.
- Calculate only after Editor production final approval.
- Rejected task has payment 0.
- MVP formula is `finalPayment = baseRate * deadlineMultiplier`.
- `baseRate` comes from the Task snapshot, not the current TaskType default.

## Deadline multiplier

| Condition | Multiplier |
| --- | ---: |
| Early by at least 24h | `1.10` |
| On time | `1.00` |
| Late by 24h or less | `0.95` |
| Late by more than 24h | `1.00` and mark late |
| Rejected task | `0.00` |

## API surface

`POST /api/payroll/tasks/:taskId/calculate`
`POST /api/payroll/tasks/:taskId/confirm`
`POST /api/payroll/earnings/:earningId/mark-paid`
`GET /api/payroll/earnings`

## Acceptance criteria

- Approved task creates earning.
- Rejected task has 0 payment.
- Assistant sees own earnings.
- Revision fee is not included in MVP calculation.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
