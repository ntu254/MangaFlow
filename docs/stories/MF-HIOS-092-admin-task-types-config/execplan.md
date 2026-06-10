# Exec Plan

## Goal

Provide a safe Admin Task Types configuration surface without weakening Task assignment or Payroll contracts.

## Scope

In scope:

- Add server tests for TaskType safe-delete and status behavior.
- Add Admin controller methods and `/api/admin/task-types` routes.
- Reuse existing Admin task-type service/repository functions where possible.
- Add client API helpers, hook, table, dialog, and page.
- Replace the placeholder route for `/app/admin/task-types`.
- Add a verification script for MF-HIOS-092.

Out of scope:

- Changing existing `/api/tasks/types` semantics.
- Adding revision fees, rate history, or payroll recalculation.
- Adding audit-log persistence.

## Risk Classification

Risk flags:

- Authorization.
- Data model.
- Public contracts.
- Existing behavior.
- Weak proof.

Hard gates:

- Admin-only workflow configuration.
- TaskType deletion behavior.

## Work Phases

1. Add failing server tests for Admin TaskType service behavior.
2. Implement Admin task-type routes/controllers with validation.
3. Add frontend API and Admin Task Types page.
4. Add verification script.
5. Run server/client validation.
6. Update Harness evidence and trace.

## Stop Conditions

Pause for human confirmation if:

- A schema migration is needed.
- TaskType deletion would require data loss.
- Payroll formula or task assignment eligibility rules need to change.
- Validation requirements need to be weakened.

