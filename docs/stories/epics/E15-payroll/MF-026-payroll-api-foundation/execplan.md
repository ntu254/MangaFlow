# Exec Plan

## Goal

Implement the backend payroll foundation for EPIC-15.

## Scope

In scope:

- TaskRate model/repository/service/routes.
- AssistantEarning model/repository/service/routes.
- Payroll calculation with deadline bonus/penalty.
- Task-level calculate, confirm, and mark-paid transitions.
- List endpoints for assistant, series, admin, and assistant detail.
- Unit and route integration tests.

Out of scope:

- Real payment.
- Monthly payout confirmation.
- Payroll UI.
- Revision fee configuration UI.

## Risk Classification

Risk flags:

- Authorization.
- Data model.
- Public contracts.
- Existing behavior.
- Weak proof.
- Multi-domain.

Hard gates:

- Authorization.

## Work Phases

1. Discovery of payroll spec and current route/module patterns.
2. Story packet and durable decision.
3. Model/repository/service implementation.
4. Route authorization and API wiring.
5. Unit and integration tests.
6. Validation and Harness updates.

## Stop Conditions

Pause for human confirmation if:

- Real payment integration becomes required.
- Existing Task approval semantics conflict with payroll calculation.
- Authorization has to be weakened.
- Data migration or destructive behavior appears.
