# Exec Plan

## Goal

Lock MangaFlow workflow status enums, transitions, Board voting rules,
Assistant access security invariants, readiness service ownership, Payroll MVP
formula, and action endpoint conventions before deeper backend/API work.

## Scope

In scope:

- Add canonical workflow status contract.
- Reconcile affected feature contracts.
- Update API architecture with action endpoint convention.
- Update database architecture with status source-of-truth expectations.
- Update validation plan with backend/security tests.
- Record high-risk HI-OS proof and story evidence.

Out of scope:

- Backend code.
- Schema/migration code.
- Frontend components.
- Auth runtime behavior.
- Payment execution.

## Risk Classification

Risk flags:

- Authorization.
- Public contracts.
- Existing behavior.
- Weak proof.
- Multi-domain.

Hard gates:

- Assistant access security invariant.
- Board decision logic.
- Publication readiness logic.
- Payroll calculation.

## Work Phases

1. Discovery: read business workflow spec and affected contracts.
2. Design: define canonical enum and transition contract.
3. Validation planning: update backend/security test plan.
4. Implementation: edit docs/contracts and architecture docs.
5. Verification: run diff check, targeted contract checks, context,
   arch-check, trace, and story verify.
6. Harness update: update durable story evidence.

## Stop Conditions

Pause for human confirmation if:

- Runtime backend changes become necessary.
- Database migration or deletion risk appears.
- Board decision or payroll behavior conflicts with the user's requested
  rules.
- Validation requirements would need to be weakened.
