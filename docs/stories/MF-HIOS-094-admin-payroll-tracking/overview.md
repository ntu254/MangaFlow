# Overview

## Story

MF-HIOS-094 Admin Payroll Tracking

## Status

implemented

## Lane

high-risk

## Goal

Wire `/app/admin/payroll` to backend payroll earnings so Admin can monitor pending, confirmed, and paid assistant earnings without changing MVP payroll calculation rules.

## Scope

In scope:

- Admin Payroll page at `/app/admin/payroll`.
- `GET /api/payroll/earnings` client wiring.
- Admin action wiring for existing `POST /api/payroll/tasks/:taskId/confirm`.
- Admin action wiring for existing `POST /api/payroll/earnings/:earningId/mark-paid`.
- Summary counts and totals for pending, confirmed, paid, and late earnings.
- Backend regression proof that Admin lists all earnings.

Out of scope:

- Payroll formula changes.
- Real payment execution.
- Revision fee implementation.
- Payroll recalculation UI.
- New payroll schema fields.
- New backend payroll routes.

## High-risk reason

Payroll is a high-risk product area. This story must preserve tracking-only MVP semantics, backend-owned action endpoints, and the formula `finalPayment = baseRate * deadlineMultiplier`.
