# MF-HIOS-046 Publication Readiness Service Foundation

## Current Behavior

Chapter detail and review UI show local readiness samples only. The publication contract requires a backend-owned `PublicationReadinessService`, but no `GET /api/chapters/:id/readiness` endpoint or service existed.

## Target Behavior

Editors/Admin/Mangaka can request a backend-owned readiness result for a chapter. The service returns overall pass/fail plus item-level reasons for the contract checklist.

## Affected Users

- Editor.
- Mangaka.
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

- No publish endpoint.
- No publication schedule creation endpoint.
- No chapter status mutation to `READY_FOR_PUBLICATION`.
- No frontend readiness API wiring.
- No public catalog or reader behavior.
