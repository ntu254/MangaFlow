# MF-HIOS-003 Architecture Docs Reconciliation

## Status

in_progress

## Lane

high-risk

## Task Type

Architecture documentation reconciliation.

## Product Contract

Align MangaFlow architecture docs with the accepted production-only MVP,
accepted technology decisions, and critical access/storage/security invariants.

This story does not implement application code, restore deleted app packages,
or change architecture direction.

## Selected Skill Pack

- Architecture
- HI-OS Governance
- Validation

## Relevant Docs

- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/README.md`
- `docs/architecture/overview.md`
- `docs/architecture/tech-stack.md`
- `docs/architecture/folder-structure.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/architecture/auth.md`
- `docs/architecture/storage.md`
- `docs/architecture/security.md`
- `docs/architecture/deployment.md`
- `docs/decisions/0001-tech-stack.md`
- `docs/decisions/0002-auth-strategy.md`
- `docs/decisions/0003-database-design.md`
- `docs/decisions/0015-production-only-mvp-boundary.md`
- `docs/validation/test-plan.md`

## Acceptance Criteria

- Architecture docs state the production-only MVP boundary.
- Tech stack docs match ADR 0001.
- Auth architecture matches custom-auth ADR and product roles, including Board
  Chair tie-break responsibility.
- Database architecture lists required production workflow collections and
  indexes without reader/library collections.
- API architecture lists production workflow route groups and no reader,
  library, catalog, or reading-progress route groups.
- Storage/security docs enforce signed URLs, no base64 AI output in MongoDB,
  assistant task-scoped access, and no Admin override of Board decisions.
- ADR 0001-0003 have accepted status.
- Validation is docs-only and does not claim application build/test proof.

## Risks

- Accidentally changing architecture direction instead of clarifying accepted
  decisions.
- Weak application proof because root `package.json`, `client/`, `server/`, and
  `mobile/` package entrypoints are absent from the working tree.
- Multi-domain architecture surface: API, database, auth, storage, deployment,
  and security.

## Current Outcome

Architecture docs are reconciled. Final HI-OS governance verification passes.
