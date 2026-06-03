# Exec Plan

## Goal

Create the frontend task assignment slice for EPIC-09 over the MF-013 backend
Task API.

## Scope

In scope:

- Task API client for list/create-from-region/start/delete.
- Page Workspace task assignment form for a selected Region.
- Page Workspace task list filtered to the current Page.
- Assistant dashboard route that lists assigned Tasks and starts `TODO` Tasks.
- Client API tests and build/typecheck proof.

Out of scope:

- Upload/submission.
- Approval/revision workflow.
- Comments/history.
- Payroll.
- Backend assistant directory picker.

## Risk Classification

Risk flags:

- Authorization.
- Public contracts.
- Existing behavior.
- Weak proof.
- Multi-domain.

Hard gates:

- Authorization-visible behavior.

## Work Phases

1. Discovery of EPIC-09 and current frontend/API route patterns.
2. Story packet and durable story creation.
3. Task API client implementation.
4. Page Workspace task form/list integration.
5. Assistant dashboard route implementation.
6. Client validation and Harness proof update.

## Stop Conditions

Pause for human confirmation if:

- Backend Task API shape needs to change.
- A data migration or destructive behavior appears.
- Validation requirements need to be weakened.
- A full Assistant selector becomes mandatory for acceptance.
