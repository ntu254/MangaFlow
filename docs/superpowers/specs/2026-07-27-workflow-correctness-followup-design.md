# Workflow Correctness Follow-up Design

**Date:** 2026-07-27  
**Status:** Approved for implementation by continuation request  
**Scope:** Backend workflow authorization, assignment safety, Postman workflow coverage, and contract documentation

## Context

The previous workflow remediation already aligned the main Mangaka → Assistant → Mangaka → Tantou → publish flow and removed the most dangerous bypasses. The remaining review findings are mostly contract and lifecycle-safety gaps:

- removing a contributor or Tantou can orphan active work;
- comment route middleware advertises roles broader than the controller policy;
- the Postman collection is route-complete but not executable as a multi-role workflow;
- Material `IN_REVIEW` is represented by the API but its transition semantics are not explicit in the business docs.

The existing canonical decisions remain authoritative: Proposal approval goes through VotingSession, generic submissions are deprecated, Chapter readiness is backend-owned, earnings are tracking-only and become `EARNED` on Mangaka approval, and the broad Admin surface remains a separate CT-11 scope.

## Decision

Implement incremental workflow hardening with explicit contracts and regression coverage. Do not introduce a new payroll workflow, remove Admin routes, or run a production migration as part of this change.

### Material lifecycle

The canonical status transition matrix is:

```text
DRAFT → ACTIVE → IN_REVIEW → APPROVED → ARCHIVED
                  ↘ ACTIVE
```

- The owning Mangaka or assigned Tantou may activate a draft.
- The owning Mangaka or assigned Tantou may submit an active material for review.
- The owning Mangaka or assigned Tantou may return an in-review material to active when revision is needed.
- Only the assigned Tantou may approve an active or in-review material.
- The owning Mangaka or assigned Tantou may archive any non-archived material.
- An already approved version is immutable. A later edit must create or use a non-approved working version; it must not silently downgrade the approved version.

The implementation must make these transitions explicit rather than allowing an unrestricted generic status patch. If the current persistence model cannot represent working and approved versions independently, the implementation must preserve the approved record and return a clear conflict instead of mutating it.

### Assignment removal

Member removal is a lifecycle operation, not a simple membership delete:

- Assistant removal returns `409 ACTIVE_ASSIGNMENTS_EXIST` when the Assistant still owns non-terminal tasks in the Series. The response includes task identifiers and statuses for reassignment or cancellation.
- Tantou removal returns `409 EDITOR_WORKLOAD_EXISTS` when the Series still has open editorial workload: chapters in review/revision states, unresolved blocking comments, materials in review, or submissions awaiting Editor review.
- No operation silently transfers or deletes active work. Removal succeeds only after the workload is reassigned or explicitly cancelled through its canonical workflow.

### Comment and editorial permissions

- `resolve` and `reopen` are assigned Tantou actions and are exposed as Editor-only routes because the assigned Tantou is the Editor assigned to the Series.
- `address` is an owning Mangaka action for Tantou blocking comments.
- Chapter editorial actions remain assigned-Editor/EIC guarded by the domain service. Route descriptions must not imply that Assistant can mutate Chapter lifecycle.
- VotingSession tie-break remains restricted to an Editor with `isEditorInChief=true`.

### Postman contract

The collection will have role-specific tokens and entity variables, explicit actor switching, happy-path workflow folders, and negative authorization/state cases. Deprecated compatibility endpoints remain visible but are grouped and labelled as deprecated. Collection route parity must remain exact against mounted backend routes.

## Alternatives considered

### A — Incremental contract hardening (selected)

Strengths: fixes the confirmed safety gaps, preserves existing canonical APIs, minimizes migration and UI risk, and provides executable evidence. Cost: some compatibility aliases and the broad Admin surface remain until their separately documented decisions are approved.

### B — Replace generic actions with command-only APIs

Strengths: a cleaner long-term API. Cost: a larger breaking change across web, mobile, Postman, and compatibility clients; it is not required to close the current findings.

### C — Redesign Admin and payroll together

Strengths: resolves the remaining open product-scope questions in one project. Cost: conflicts with the current CT-11 boundary and would require new business decisions, payroll states, UI, migration, and audit rules. It is explicitly out of this remediation.

## Architecture and data flow

The controllers remain thin. Each mutation follows:

```text
route role perimeter → controller input validation → domain authorization/transition guard
→ transactionally mutate lifecycle + audit → canonical response
```

Assignment-removal checks are implemented as focused workload queries/services shared by the Series member and Tantou controllers. Material transitions use one transition policy/service so PATCH and any future command endpoint cannot diverge. Postman scripts only capture response IDs and tokens; they do not encode business rules that belong to the backend.

## Error handling

- `401` remains unauthenticated.
- `403` is used for role, ownership, assignment, and EIC authorization failures.
- `409 ACTIVE_ASSIGNMENTS_EXIST` and `409 EDITOR_WORKLOAD_EXISTS` identify blocking work and recovery identifiers.
- `409` is also used for immutable approved-version conflicts and invalid state transitions where the resource exists but cannot move from its current state.
- Deprecated bypass endpoints continue to return their documented `410` code.

## Verification

The implementation is accepted only when all of the following are demonstrated:

- focused backend tests cover every new actor/state guard and the already-fixed bypasses;
- frontend tests cover readiness, comment actions, and top-level Material status mapping;
- Postman JSON parses, route parity is exact, and a seeded multi-role smoke run is executable where the local runner is available;
- backend full suite, web lint/typecheck/build, mobile tests/build, E2E/architecture checks where configured, and `git diff --check` pass;
- docs, Postman descriptions, and runtime authorization agree with one another.

## Non-goals

- Do not change earnings creation from Mangaka approval to Editor approval.
- Do not add hard-coded rate values or allow Mangaka to configure platform rates.
- Do not remove or redesign Admin CT-11 routes.
- Do not execute production migrations.
- Do not introduce a second Chapter review implementation or a new generic workflow bypass.
