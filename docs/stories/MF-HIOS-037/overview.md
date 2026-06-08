# Overview

## Current Behavior

Manuscript upload records can exist and Series submit moves Series into `EDITOR_REVIEW`. Editor proposal review action endpoints are missing.

## Target Behavior

Tantou Editor can review an `EDITOR_REVIEW` manuscript/proposal and perform one of three backend-owned workflow actions:

- request revision
- forward to Board
- reject

The action updates both Manuscript and Series statuses according to `docs/contracts/workflow-status.md`.

## Affected Users

- Editor: can make proposal review decisions.
- Mangaka: receives revision/rejection/Board handoff result.
- Board: receives Series only after Editor forwards it.

## Affected Product Docs

- `docs/contracts/manuscript-review.md`
- `docs/contracts/workflow-status.md`
- `docs/architecture/auth.md`
- `docs/architecture/security.md`

## Non-Goals

- Board voting.
- Editor production final approval.
- Audit event persistence.
- Frontend review page integration.
