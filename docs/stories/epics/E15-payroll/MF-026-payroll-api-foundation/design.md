# Design

## Domain Model

`TaskRate`:

- `taskType`
- `rate`
- `currency`
- `isActive`
- timestamps

`AssistantEarning`:

- `assistantId`
- `taskId`
- `seriesId`
- `taskType`
- `basePayment`
- `bonusRate`
- `bonusAmount`
- `penaltyAmount`
- `revisionFee`
- `finalPayment`
- `timingStatus`
- `status`
- timestamps

## Application Flow

1. Admin creates active TaskRate records per Task type.
2. Mangaka/Admin calculates earning for a Task after approval.
3. Service reads active TaskRate for Task type, or falls back to Task
   `baseRate` when no rate record exists.
4. Service determines deadline timing from `dueDate` and approval/submission
   timestamps.
5. Service creates or updates a `PENDING` AssistantEarning.
6. Mangaka/Admin confirms pending earnings.
7. Admin marks confirmed earnings as paid.

## Interface Contract

Payroll routes:

- `GET /api/payroll/me`
- `GET /api/payroll`
- `GET /api/payroll/series/:seriesId`
- `GET /api/payroll/assistants/:assistantId`
- `GET /api/payroll/monthly`
- `POST /api/payroll/tasks/:taskId/calculate`
- `POST /api/payroll/tasks/:taskId/confirm`
- `POST /api/payroll/:earningId/mark-paid`

Task rate routes:

- `GET /api/task-rates`
- `POST /api/task-rates`
- `GET /api/task-rates/:taskRateId`
- `PATCH /api/task-rates/:taskRateId`
- `DELETE /api/task-rates/:taskRateId`

## Data Model

Mongo collections:

- `taskrates`
- `assistantearnings`

Indexes:

- active task rate lookup by `{ taskType, isActive }`
- unique earning per `taskId`
- earnings by `assistantId`, `seriesId`, `status`

## UI / Platform Impact

No UI changes in MF-026. Payroll UI is a future story.

## Observability

No new logs. Harness trace records validation proof and explicit non-goals.

## Alternatives Considered

1. Implement monthly payout confirmation now. Rejected because MF-026 focuses
   on task-level earning records and transitions.
2. Integrate Stripe/PayPal. Rejected because the MVP spec explicitly excludes
   real payment.
