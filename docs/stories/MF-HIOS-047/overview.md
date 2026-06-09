# MF-HIOS-047 Publication Scheduling and Publish Actions

## Current Behavior

The codebase now has a backend-owned readiness service, but there is still no publication schedule/publish flow that uses it to move a chapter to `PUBLISHED`.

## Target Behavior

Editors can create or schedule a publication record and publish only when readiness passes. Publish transitions the chapter to `READY_FOR_PUBLICATION` and then `PUBLISHED` through backend service logic.

## Affected Users

- Editor.
- Admin.

## Affected Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/publication-ranking.md`
- `docs/contracts/workflow-status.md`
- `docs/architecture/api.md`
- `docs/architecture/database.md`
- `docs/validation/test-plan.md`

## Non-Goals

- No public chapter reader.
- No publish scheduling UI.
- No frontend wiring yet.
- No at-risk logic.
