# Overview

## Story

MF-HIOS-093 Admin Task Rates Config

## Status

implemented

## Lane

high-risk

## Goal

Wire `/app/admin/task-rates` to a real Admin-only page for auditing and updating default TaskType base-rate references used by future task assignments.

## Scope

In scope:

- Admin Task Rates page at `/app/admin/task-rates`.
- Backend-enforced Admin route reuse through existing `/api/admin/task-types` endpoints.
- Rate-focused table, status badges, zero-rate warning count, active-rate count, and average default rate.
- Rate-only edit dialog for TaskType `baseRate`.
- Regression proof that task creation snapshots the current TaskType `baseRate` into `Task.baseRate`.

Out of scope:

- Payroll formula changes.
- Retroactive changes to existing `Task.baseRate` snapshots.
- Revision fee support.
- Payroll confirmation or payout workflow.
- TaskType lifecycle actions; those remain on `/app/admin/task-types`.
- New database schema or rate history/versioning.

## High-risk reason

This story is adjacent to payroll configuration. It must preserve the contract that payroll calculates from the Task snapshot and must not reinterpret existing tasks when Admin changes a TaskType default rate.
