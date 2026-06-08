# MF-HIOS-029 Workflow Status Enum Reconciliation

## Status

implemented

## Current Behavior

MangaFlow has strong business workflow documentation, but status values,
status transitions, Board voting edge cases, Assistant access invariants,
publication readiness ownership, payroll formula scope, and action endpoint
conventions are spread across product docs, feature contracts, and the business
workflow specification.

This creates a risk that future backend/API implementation will encode
conflicting status names or incomplete business rules.

## Target Behavior

MangaFlow has a canonical workflow status contract before deeper backend work:

- Official enum tables exist for each workflow entity.
- Status transitions are documented for Series, Manuscript, Chapter, Page,
  Task, Submission, Comment, BoardDecision, Ranking, and AssistantEarning.
- Editor proposal review and Editor production final approval are separate
  workflow responsibilities.
- Board voting rules define minimum votes, chair voting, tie-break behavior,
  three-option majority, and deadline behavior.
- Publication readiness is owned by a backend
  `PublicationReadinessService`.
- Assistant access is a security invariant, not a UI-only rule.
- Backend test plan includes Assistant access proof.
- Payroll MVP formula is simplified; revision fee is future scope.
- Action-style mutations use `POST` endpoints.

## Affected Users

- Admin
- Mangaka
- Assistant
- Tantou Editor
- Editorial Board
- Board Chair

## Affected Product Docs

- `docs/MangaFlow-Business Workflow Specification.md`
- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/README.md`
- `docs/contracts/workflow-status.md`
- `docs/contracts/series-proposal.md`
- `docs/contracts/manuscript-review.md`
- `docs/contracts/board-approval.md`
- `docs/contracts/chapter-production.md`
- `docs/contracts/page-workspace.md`
- `docs/contracts/production-team.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/submission-review.md`
- `docs/contracts/comment-resolution.md`
- `docs/contracts/publication-ranking.md`
- `docs/contracts/payroll.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Non-Goals

- No backend implementation.
- No database migration.
- No frontend route/component implementation. Existing frontend status display
  values may be aligned to the canonical enum if drift is found.
- No change to authentication runtime behavior.
- No weakening of Board, Assistant access, file storage, publication, or
  payroll validation requirements.
