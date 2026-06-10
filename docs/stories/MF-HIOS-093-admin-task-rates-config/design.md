# Design

## Contract Alignment

- Default rates live on `TaskType.baseRate`.
- Future task assignments snapshot that value into `Task.baseRate`.
- Payroll calculation uses `Task.baseRate * deadlineMultiplier`.
- Zero is allowed by the non-negative rate rule, but the Admin UI can surface zero-rate references as warnings.

## UI

`/app/admin/task-rates` shows:

- Admin/backend enforcement badges.
- Copy explaining that default changes affect future assignments only.
- Summary cards for active rate references, zero-rate warnings, and average default rate.
- Rate-focused table with TaskType, current default rate, status, updated date, and an edit action.
- Rate-only dialog for updating the TaskType default base rate.

## Backend

No new route is required. The page reuses Admin-only TaskType routes already protected by `requireAuth` and `requireRole("ADMIN")`.

## Data

No schema changes. Existing tasks keep their stored `baseRate` values.
