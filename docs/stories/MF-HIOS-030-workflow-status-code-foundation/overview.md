# MF-HIOS-030 Workflow Status Code Foundation

## Status

implemented

## Current Behavior

`docs/contracts/workflow-status.md` defines canonical workflow status enums and
transitions, but server code still duplicates Series status unions in the
Series model and repository. The Mongoose Series enum is narrower than the
contract and the client Series API type is also narrower.

## Target Behavior

Server code has a shared workflow status constants module that exposes
canonical status arrays and types. Series model and repository import the
shared `SeriesStatus` and `SERIES_STATUSES` instead of duplicating values.

Client Series API type and Series status UI are aligned with canonical Series
status values.

## Affected Users

- Mangaka
- Tantou Editor
- Editorial Board
- Future backend implementers

## Affected Product Docs

- `docs/contracts/workflow-status.md`
- `docs/contracts/main.md`
- `docs/contracts/series-proposal.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Non-Goals

- No status transition guard implementation.
- No Board vote implementation.
- No PublicationReadinessService implementation.
- No payroll implementation.
- No database migration.
- No new API routes.
