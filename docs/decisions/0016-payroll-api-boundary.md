# 0016 Payroll API Boundary

## Status

Accepted.

## Context

EPIC-15 requires payroll tracking by Task type, deadline timing, and payout
confirmation. The MVP explicitly excludes real payment integrations such as
Stripe or PayPal.

## Decision

MF-026 implements payroll as internal product evidence only. It stores task
rates and assistant earnings, calculates task-level earnings from approved
Tasks, supports confirmation and paid transitions, and exposes read endpoints
for Assistants, Mangakas, and Admins.

MF-026 does not implement real payment, monthly payout confirmation, payroll UI,
or configurable revision fees beyond a fixed default used by the calculation
service.

## Consequences

- Payroll can be proven with deterministic unit and route tests.
- Future payroll UI can consume stable task-rate and earning contracts.
- Real payment and monthly payout operations remain separate, explicit stories.

## Non-Goals

- Stripe, PayPal, or bank transfers.
- Monthly payout batching.
- Payroll UI.
- Revision fee configuration UI.
