# Payroll Contract

## Scope

Track assistant earnings by task.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Mangaka, Assistant, Admin, System

## Business rules

- Payroll is tracking only.
- Calculate only after Editor approval.
- Reject = payment 0.

## API surface

`POST /api/payroll/tasks/:taskId/calculate`
`POST /api/payroll/tasks/:taskId/confirm`

## Acceptance criteria

- Approved task creates earning.
- Reject task has 0 payment.
- Assistant sees own earnings.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
