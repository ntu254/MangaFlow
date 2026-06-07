# MF-HIOS-002 Product Contract Reconciliation

## Status

implemented

## Lane

high-risk

## Task Type

New spec reconciliation.

## Product Contract

Reconcile the Phase 1 feature-contract list with MangaFlow's accepted product
scope before implementation begins.

No reader, library, catalog, or reading-progress behavior may be invented while
the source documents disagree.

## Conflict

The supplied build plan names these Phase 1 feature contracts:

- `docs/contracts/manga-catalog.md`
- `docs/contracts/library-management.md`
- `docs/contracts/chapter-reader.md`
- `docs/contracts/reading-progress.md`

All four files are empty. At the same time:

- `docs/product/overview.md` defines MangaFlow as a manga production workflow
  and publishing management system.
- `docs/product/requirements.md` contains production workflow requirements and
  no public-reader or personal-library requirements.
- `docs/product/out-of-scope.md` explicitly excludes a public manga reader for
  end users from the MVP.
- Existing non-empty contracts cover series proposals, production, tasks,
  reviews, board approval, publication, ranking, payroll, and AI processing.

## Decision

The user selected production-only MVP. Public reader and personal library
behavior remains out of scope, the four empty contracts are retired, and the
existing production contracts form the canonical MVP contract map.

The durable decision is recorded in
`docs/decisions/0015-production-only-mvp-boundary.md`.

## Acceptance Criteria

- The selected direction is explicit and recorded in product docs.
- The four empty contracts are either removed from the required MVP contract
  set or completed from approved requirements.
- `README.md`, `README.vi.md`, product docs, architecture docs, and contracts
  describe the same product boundary.
- Every MVP feature contract has scope, out-of-scope behavior, product rules,
  acceptance criteria, and validation expectations.
- No application code is implemented before this story is resolved and
  verified.

## Relevant Docs

- `AGENTS.md`
- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/CONTEXT_RULES.md`
- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/product/feature-list.md`
- `docs/product/out-of-scope.md`
- `docs/contracts/main.md`
- `docs/validation/test-plan.md`

## Risks

- Public contract change.
- Existing product behavior redefinition.
- Weak proof because application entrypoints are absent.
- Multi-domain scope across product, API, data ownership, and UI.
- Reader progress and personal libraries introduce user-private data rules.

## Current Outcome

The scope blocker is resolved. Product-contract validation and the final HI-OS
governance gate pass.
