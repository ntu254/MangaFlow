# Requirements Document

## Introduction

The `ProposalStatus` type currently carries two statuses — `"SUBMITTED"` and `"RESUBMITTED"` — that are either redundant aliases or transient labels with no distinct behavior in the state machine. `"SUBMITTED"` is a legacy value: the `SUBMIT` action already writes `"PENDING_EDITOR"`, and the status has no unique transitions or display semantics beyond what `"PENDING_EDITOR"` already provides. `"RESUBMITTED"` is set after a mangaka resubmits following `CHANGES_REQUESTED`, but the editor review queue groups it with the other editor-review statuses and the frontend maps it to the `"EDITOR_REVIEW"` display label — so it is also a transient alias that adds enum surface area without distinct behavior.

This feature consolidates the `ProposalStatus` enum by:

1. Removing `"SUBMITTED"` as a distinct value and normalizing it to `"PENDING_EDITOR"` everywhere.
2. Removing `"RESUBMITTED"` as a distinct value and normalizing it to `"PENDING_EDITOR"` everywhere (since after resubmission an editor must review again — i.e., the proposal re-enters the editor queue).
3. Updating the type definition, state machine, filter allowlists, frontend constants, and seed data to reflect the reduced enum.
4. Providing a MongoDB migration that upgrades any persisted documents still carrying the legacy values.

The consolidated canonical enum will be:

```
"DRAFT" | "PENDING_EDITOR" | "EDITOR_REVIEWING" | "CHANGES_REQUESTED" |
"PENDING_BOARD" | "BOARD_VOTING" | "TIE_BREAK" |
"APPROVED" | "REJECTED" | "WITHDRAWN" | "ARCHIVED"
```

(11 values, down from 13)

## Glossary

- **ProposalStatus**: The union type in `backend/src/types.ts` that enumerates every valid lifecycle state for a manga proposal.
- **Canonical status**: A status value that belongs to the consolidated 11-value enum and is safe to write to the database.
- **Legacy status**: A status value (`"SUBMITTED"` or `"RESUBMITTED"`) that existed before this consolidation and may still exist in persisted documents.
- **State machine**: The `applyProposalAction` function in `backend/src/services/workflow.service.ts` that enforces valid transitions and writes `patch.status`.
- **Status allowlist**: The `PROPOSAL_STATUSES` set in `backend/src/controllers/proposal.controller.ts` used to validate query-string filter parameters.
- **Frontend constants**: `PROPOSAL_STATUSES` array and `PROPOSAL_STATUS_LABEL` map in `src/shared/constants/status-constants.ts`.
- **Seed data**: The `seedProposals` array in `backend/src/seed/data.ts`.
- **Migration**: A one-off MongoDB update script that rewrites documents in the `proposals` collection that carry `"SUBMITTED"` or `"RESUBMITTED"` to `"PENDING_EDITOR"`.
- **Read normalizer**: A utility function that maps a legacy status string to its canonical equivalent at read time, used as a defense-in-depth layer for any documents not yet migrated.
- **RESUBMIT action**: The `"RESUBMIT"` case in the state machine, triggered when a mangaka responds to `"CHANGES_REQUESTED"`.
- **Editor review phase**: The group of statuses representing a proposal that is in the editor's hands — canonically `"PENDING_EDITOR"` and `"EDITOR_REVIEWING"`.

## Requirements

---

### Requirement 1: Remove `"SUBMITTED"` from the ProposalStatus type

**User Story:** As a backend developer, I want `"SUBMITTED"` removed from the `ProposalStatus` union type, so that the type system prevents any code from writing or accepting that value.

#### Acceptance Criteria

1. THE `ProposalStatus` type SHALL NOT include `"SUBMITTED"` as a member value.
2. WHEN the `SUBMIT` action is applied to a `"DRAFT"` proposal, THE State_Machine SHALL set `patch.status` to `"PENDING_EDITOR"`.
3. THE `ProposalStatus` type SHALL contain exactly the 11 canonical values: `"DRAFT"`, `"PENDING_EDITOR"`, `"EDITOR_REVIEWING"`, `"CHANGES_REQUESTED"`, `"PENDING_BOARD"`, `"BOARD_VOTING"`, `"TIE_BREAK"`, `"APPROVED"`, `"REJECTED"`, `"WITHDRAWN"`, `"ARCHIVED"`.

---

### Requirement 2: Remove `"RESUBMITTED"` from the ProposalStatus type

**User Story:** As a backend developer, I want `"RESUBMITTED"` removed from the `ProposalStatus` union type, so that after a mangaka resubmits a changed proposal the proposal immediately re-enters the standard editor queue under `"PENDING_EDITOR"`.

#### Acceptance Criteria

1. THE `ProposalStatus` type SHALL NOT include `"RESUBMITTED"` as a member value.
2. WHEN the `RESUBMIT` action is applied to a `"CHANGES_REQUESTED"` proposal, THE State_Machine SHALL set `patch.status` to `"PENDING_EDITOR"`.
3. WHEN the `CLAIM` action guard checks valid source statuses, THE State_Machine SHALL accept `"PENDING_EDITOR"` as the only required source status (unchanged), ensuring a resubmitted proposal can be claimed by an editor without additional guard changes.

---

### Requirement 3: Update the status filter allowlist in the proposal controller

**User Story:** As a backend developer, I want the `PROPOSAL_STATUSES` allowlist in the proposal controller to reflect only canonical statuses, so that API clients cannot filter by legacy status strings that no longer exist.

#### Acceptance Criteria

1. THE `PROPOSAL_STATUSES` set in `backend/src/controllers/proposal.controller.ts` SHALL contain exactly the 11 canonical `ProposalStatus` values and SHALL NOT contain `"SUBMITTED"` or `"RESUBMITTED"`.
2. WHEN a client sends a request with `?status=SUBMITTED`, THE Proposal_Controller SHALL return a `400` error with code `"VALIDATION_ERROR"`.
3. WHEN a client sends a request with `?status=RESUBMITTED`, THE Proposal_Controller SHALL return a `400` error with code `"VALIDATION_ERROR"`.

---

### Requirement 4: Update frontend status constants

**User Story:** As a frontend developer, I want the `PROPOSAL_STATUSES` array and `PROPOSAL_STATUS_LABEL` map in `src/shared/constants/status-constants.ts` to reflect the consolidated enum, so that the UI never renders or offers legacy status strings as options.

#### Acceptance Criteria

1. THE `PROPOSAL_STATUSES` array in `src/shared/constants/status-constants.ts` SHALL contain exactly the 11 canonical values and SHALL NOT contain `"SUBMITTED"` or `"RESUBMITTED"`.
2. THE `PROPOSAL_STATUS_LABEL` map SHALL NOT contain entries for `"SUBMITTED"` or `"RESUBMITTED"`.
3. THE `ProposalStatusV2` TypeScript type (derived from `PROPOSAL_STATUSES`) SHALL reflect the 11-value consolidated union.
4. WHERE a `PROPOSAL_LEGACY_STATUS_MAP` constant is introduced in `src/shared/constants/status-constants.ts`, THE Frontend_Constants SHALL map `"SUBMITTED"` → `"PENDING_EDITOR"` and `"RESUBMITTED"` → `"PENDING_EDITOR"` for display-time normalization of any data not yet migrated.

---

### Requirement 5: Update the editor review queue query

**User Story:** As a backend developer, I want the editor review queue query and all other backend filters that reference `"RESUBMITTED"` or `"SUBMITTED"` to use only canonical statuses, so that the editor queue continues to surface all proposals awaiting review after the enum reduction.

#### Acceptance Criteria

1. THE `editorReviewQueue` function in `backend/src/services/workflow.service.ts` SHALL query proposals with `status: { $in: ["PENDING_EDITOR", "EDITOR_REVIEWING", "CHANGES_REQUESTED"] }` and SHALL NOT include `"RESUBMITTED"` or `"SUBMITTED"` in that filter.
2. THE `reviewQueue` count in the admin dashboard aggregation SHALL use only canonical status values for its proposal filter.
3. WHEN the `editorReviewQueue` function maps a proposal status to a display label, THE function SHALL NOT branch on `"RESUBMITTED"` as a special case.

---

### Requirement 6: Provide a MongoDB migration for persisted legacy documents

**User Story:** As a system operator, I want a migration script that upgrades any existing proposal documents in the database from `"SUBMITTED"` or `"RESUBMITTED"` to `"PENDING_EDITOR"`, so that persisted data remains consistent with the consolidated enum after deployment.

#### Acceptance Criteria

1. THE Migration_Script SHALL update all proposal documents where `status` is `"SUBMITTED"` to `status: "PENDING_EDITOR"`.
2. THE Migration_Script SHALL update all proposal documents where `status` is `"RESUBMITTED"` to `status: "PENDING_EDITOR"`.
3. THE Migration_Script SHALL also update history entries within proposal documents where a `toStatus` of `"SUBMITTED"` or `"RESUBMITTED"` is present, normalizing them to `"PENDING_EDITOR"`.
4. THE Migration_Script SHALL be idempotent — running it multiple times SHALL NOT corrupt documents that have already been migrated.
5. WHEN the Migration_Script completes, THE Migration_Script SHALL log the count of documents updated for each legacy status value.

---

### Requirement 7: Provide a read normalizer utility

**User Story:** As a backend developer, I want a `normalizeProposalStatus` utility function that maps `"SUBMITTED"` and `"RESUBMITTED"` to `"PENDING_EDITOR"`, so that any documents not yet reached by the migration are handled gracefully at read time.

#### Acceptance Criteria

1. THE `Normalizer` SHALL export a `normalizeProposalStatus(status: string): ProposalStatus` function.
2. WHEN `normalizeProposalStatus` is called with `"SUBMITTED"`, THE `Normalizer` SHALL return `"PENDING_EDITOR"`.
3. WHEN `normalizeProposalStatus` is called with `"RESUBMITTED"`, THE `Normalizer` SHALL return `"PENDING_EDITOR"`.
4. WHEN `normalizeProposalStatus` is called with any canonical `ProposalStatus` value, THE `Normalizer` SHALL return that value unchanged.
5. IF `normalizeProposalStatus` is called with an unrecognized string, THE `Normalizer` SHALL return the input value unchanged (pass-through).

---

### Requirement 8: Update seed data

**User Story:** As a developer, I want the seed data in `backend/src/seed/data.ts` to use only canonical status values, so that a freshly seeded database does not immediately contain legacy status values.

#### Acceptance Criteria

1. THE seed proposals in `backend/src/seed/data.ts` SHALL NOT set any proposal's `status` field to `"SUBMITTED"` or `"RESUBMITTED"`.
2. THE seed manuscript helper function (`manuscript()`) in `backend/src/seed/data.ts` SHALL NOT set a manuscript's `status` field to `"SUBMITTED"` — IF that field is a `ProposalStatus` reference, THE Seed SHALL use a canonical value; IF the field belongs to a separate manuscript status type, it SHALL be left unchanged.
3. THE history entries in seed proposals SHALL NOT contain `toStatus` or `fromStatus` values of `"SUBMITTED"` or `"RESUBMITTED"` — any such entries SHALL be rewritten to use `"PENDING_EDITOR"`.
