> **Status:** Historical input brief.
> **Purpose:** Source requirements used by the reconstruction specification
> (`docs/superpowers/specs/2026-07-26-business-flow-doc-reconstruction-design.md`).
>
> The current canonical outputs are:
> - `docs/business-flows/INDEX.md`
> - `docs/DESIGN.md`
> - `docs/CODE-TODO.md`
>
> This file is retained for traceability and is **not** itself the current canonical
> workflow.

---

Act as a Senior Business Analyst, Software Architect, and Backend Engineer.

Your task is to review the current codebase and update the business-flow documentation, create the architecture document, and create a prioritized technical improvement plan.

## Primary objective

Produce documentation that is:

* faithful to the current codebase;
* internally consistent across all workflow files;
* secure at both role and record level;
* realistic for an internal manga production department;
* practical for a university project;
* free from unnecessary enterprise complexity.

The codebase is the source of truth for current behavior.

However, do not document an obviously incorrect workflow as the recommended canonical design merely because the code currently behaves that way.

For every conflict, clearly separate:

1. **Confirmed Current Behavior**
2. **Canonical Business Decision**
3. **Required Code Change**

Do not invent functionality that is not supported by either the current code or an explicitly documented target decision.

---

# Files in scope

Review these files:

```text
docs/business-flows/01-authentication.md
docs/business-flows/02-proposal-lifecycle.md
docs/business-flows/03-series-lifecycle.md
docs/business-flows/04-chapter-workflow.md
docs/business-flows/05-assistant-submission.md
docs/business-flows/06-board-governance.md
docs/business-flows/07-material-management.md
docs/business-flows/08-earnings.md
docs/business-flows/09-rankings.md
docs/business-flows/10-ai-processing.md
docs/business-flows/11-file-management.md
docs/business-flows/12-comments.md
docs/business-flows/13-pages.md
docs/business-flows/14-regions.md
docs/business-flows/INDEX.md
```

Create:

```text
docs/DESIGN.md
docs/CODE-TODO.md
```

---

# Task 0: Establish documentation rules

Before editing, inspect the relevant controllers, services, routes, validators, models, middleware, tests, and frontend API contracts.

Use these rules throughout the work:

* The codebase defines current implemented behavior.
* Business-flow documents define the canonical intended workflow.
* When code and canonical workflow differ, retain the canonical workflow and add a clearly labeled `Required Code Change`.
* Do not silently change a business decision merely to match an implementation bug.
* Do not introduce unrelated new modules or large enterprise patterns.
* Reuse the terminology already used by the project.
* Use actual route names, action names, statuses, models, and error codes found in the repository.
* Mark deprecated, legacy, unreachable, duplicate, or contradictory behavior explicitly.
* Update every document affected by a cross-module decision, not only the file where the issue was first found.

---

# Task 1: Fix the documented workflow inconsistencies

## 1. Blocking comment detection

Review:

```text
docs/business-flows/12-comments.md
docs/business-flows/04-chapter-workflow.md
docs/business-flows/INDEX.md
```

Canonical rule:

```text
A comment blocks Chapter review when:
- isBlocking = true;
- the comment has not reached a non-blocking status;
- the comment is associated with the Chapter or one of its related review targets.
```

Do not rely on `authorRole` as the primary business guard.

Instead, enforce the write permission:

```text
Only the assigned Tantou may create a blocking editorial comment or change
a comment from non-blocking to blocking.
```

Mangaka and Assistant comments must not be able to block Chapter submission merely by setting `isBlocking = true`.

If the current code still relies on `authorRole === EDITOR`, document that as current behavior and add the required authorization code change.

The canonical blocking status rule should be:

```text
Blocking while status is:
OPEN
REOPENED

Non-blocking after:
ADDRESSED
RESOLVED
```

Clearly describe the meaning:

* `ADDRESSED`: Mangaka states that the issue has been handled.
* `RESOLVED`: assigned Tantou verifies that the issue is actually resolved.
* `REOPENED`: assigned Tantou determines that the issue remains unresolved.

Remove or deprecate unused legacy statuses such as `FIXED` when they have no active transition.

Remove the legacy `blocking` field after migration and use only `isBlocking`.

---

## 2. Comment Resolve and Reopen authorization

Resolve and Reopen must not be available to every Editor or Mangaka.

Canonical authorization:

```text
Resolve:
- actor role is EDITOR;
- actor is the assigned Tantou of the related Series;
- comment is a Tantou blocking comment;
- actor may read and review the related target.

Reopen:
- actor role is EDITOR;
- actor is the assigned Tantou of the related Series;
- comment was previously ADDRESSED or RESOLVED.
```

Mangaka may only `ADDRESS` an editorial blocking comment belonging to a Chapter or Series they own.

Use explicit guard terminology such as:

```text
assertCanAddressBlockingComment
assertCanResolveTantouBlockingComment
assertCanReopenTantouBlockingComment
```

Do not describe this only as a role check.

---

## 3. VotingSession cancellation

Review:

```text
docs/business-flows/02-proposal-lifecycle.md
docs/business-flows/06-board-governance.md
docs/business-flows/INDEX.md
```

Canonical rule:

```text
CANCEL VotingSession
→ VotingSession.status = CANCELLED
→ Proposal.status = PENDING_BOARD
→ the frozen ProposalVersion remains immutable
→ previous votes remain available for audit
→ previous votes no longer count toward a future session
```

Do not leave the Proposal in `BOARD_REVIEW` after its only active VotingSession has been cancelled.

That would create an orphan workflow state:

```text
Proposal = BOARD_REVIEW
VotingSession = CANCELLED
No active session
```

If the current implementation leaves the Proposal unchanged, document:

```text
Required Code Change:
Cancelling a VotingSession must restore the Proposal to PENDING_BOARD.
```

Add these invariants:

* A Proposal has at most one active VotingSession.
* A cancelled VotingSession cannot receive new votes.
* A future VotingSession must use a new session record.
* Votes are scoped to their VotingSession.
* Editor recall is not allowed while an active VotingSession exists.
* The Chair must cancel the active session before the Proposal returns to editorial control.

---

## 4. Chapter material readiness guard

Review:

```text
docs/business-flows/04-chapter-workflow.md
docs/business-flows/07-material-management.md
```

Document the actual accepted material readiness rule.

Canonical usable material rule:

```text
status is ACTIVE or APPROVED
AND
the material has a valid current version
AND
the current version has an accessible file
AND
the material belongs to the expected Chapter, Page, Series, or review scope
AND
the referenced version has not been archived or invalidated
```

If `APPROVED` has no actual independent transition or approval workflow, identify it as a candidate for future removal.

Do not remove it from current-state documentation when the code actively accepts it.

---

## 5. Separate Task actions from Submission decisions

Review:

```text
docs/business-flows/05-assistant-submission.md
docs/business-flows/INDEX.md
```

Do not deprecate every generic Task action.

Retain genuine Task lifecycle actions such as:

```text
START
BLOCK
UNBLOCK
CANCEL
REASSIGN
REOPEN
```

Submission review decisions must use Submission-specific endpoints:

```http
POST /api/submissions/:submissionId/approve
POST /api/submissions/:submissionId/request-revision
POST /api/submissions/:submissionId/reject
```

Deprecate duplicate decision actions exposed through the generic Task action endpoint, including any aliases that perform:

```text
APPROVE
MANGAKA_APPROVE
REQUEST_REVISION
REJECT
```

If generic aliases must temporarily remain for compatibility:

* identify the canonical endpoint;
* mark the alias deprecated;
* ensure both paths call one shared domain service;
* avoid maintaining duplicate business logic;
* add a removal TODO.

For Task reopen, select one canonical endpoint and document all other forms as aliases or deprecated routes.

---

## 6. Region locking during revision

Review:

```text
docs/business-flows/05-assistant-submission.md
docs/business-flows/14-regions.md
docs/business-flows/INDEX.md
```

Canonical flow:

```text
Create Task
→ Region.status = ASSIGNED
→ Region.lockStatus = LOCKED
→ Region.activeTaskId = Task ID

Assistant START
→ Task.status = IN_PROGRESS
→ Region.status = IN_PROGRESS
→ Region remains LOCKED

Assistant SUBMIT
→ Task.status = SUBMITTED
→ Region.status = SUBMITTED
→ Region remains LOCKED

Mangaka REQUEST_REVISION
→ Submission.status = REVISION_REQUESTED
→ Task.status = REVISION_REQUESTED
→ Region.status = REVISION_REQUIRED
→ Region remains LOCKED
→ activeTaskId remains unchanged

Assistant REOPEN
→ Task.status = IN_PROGRESS
→ Region.status = IN_PROGRESS
→ Region remains LOCKED
```

Release the Region only after:

```text
APPROVE
REJECT
CANCEL
```

Enforce:

```text
One Region has at most one active Task.
```

If the current lock status enum contains `RELEASED`, explain whether it is current implementation or canonical design.

Preferred canonical lock values:

```text
UNLOCKED
LOCKED
```

Historical lock release information should live in audit data rather than as a permanent current lock state.

---

## 7. Submission error code

Add the missing error code:

```text
EXPECTED_CURRENT_SUBMISSION_REQUIRED
```

Use it when the submission request omits the required `expectedCurrentSubmissionId`.

Recommended error mapping:

| Condition                                     | HTTP | Error code                             |
| --------------------------------------------- | ---: | -------------------------------------- |
| Missing Idempotency-Key                       |  400 | `IDEMPOTENCY_KEY_REQUIRED`             |
| Missing expected current submission ID        |  400 | `EXPECTED_CURRENT_SUBMISSION_REQUIRED` |
| Current submission changed since client read  |  409 | `CURRENT_SUBMISSION_CONFLICT`          |
| Idempotency key reused with different payload |  409 | `IDEMPOTENCY_KEY_REUSED`               |
| Task not assigned to actor                    |  403 | `TASK_NOT_ASSIGNED`                    |
| Invalid Task or Submission transition         |  409 | `INVALID_TRANSITION`                   |

Use existing code names when they already exist. If a recommended code does not exist, mark it as a required code change instead of pretending it is implemented.

---

## 8. Separate generic permission errors from ownership errors

Review:

```text
docs/business-flows/04-chapter-workflow.md
docs/business-flows/05-assistant-submission.md
docs/business-flows/INDEX.md
```

Differentiate:

```text
FORBIDDEN
```

from explicit business ownership or assignment failures.

Recommended meanings:

| Error code                   | Meaning                                                                |
| ---------------------------- | ---------------------------------------------------------------------- |
| `FORBIDDEN`                  | Actor role or general resource access is not permitted                 |
| `TASK_NOT_ASSIGNED`          | Assistant is not assigned to the Task                                  |
| `MANGAKA_OWNER_REQUIRED`     | Action must be performed by the Mangaka who owns the Series or Chapter |
| `TANTOU_ASSIGNMENT_REQUIRED` | Editor is not the assigned Tantou                                      |
| `BOARD_CHAIR_REQUIRED`       | Board actor is not the Chair                                           |
| `EDITOR_IN_CHIEF_REQUIRED`   | Editor actor is not the EIC                                            |
| `SELF_APPROVAL_BLOCKED`      | Actor is attempting an invalid self-approval                           |

Canonical Chapter ownership rule:

```text
Mangaka owns the Chapter.
Assistant works only through Region → Task → Submission.
Assistant does not submit the entire Chapter to Tantou review.
```

Therefore:

```text
SUBMIT_REVIEW and RESUBMIT
→ owning Mangaka only
```

If current code uses Chapter `assigneeId` to allow an Assistant to submit the whole Chapter, identify that as a required code change.

---

# Task 2: Run a cross-document consistency review

After applying the eight fixes, compare all workflow documents.

Verify that all files agree on:

* actor names;
* role names;
* special role flags;
* canonical route names;
* canonical action names;
* status names;
* status meanings;
* transition guards;
* ownership rules;
* Tantou assignment rules;
* Board voting behavior;
* VotingSession cancellation behavior;
* Region locking;
* Task and Submission relationships;
* Chapter review readiness;
* material readiness;
* comment blocking;
* deprecated endpoints;
* error codes;
* transaction boundaries;
* terminal states.

Update `docs/business-flows/INDEX.md` as the canonical overview.

Do not leave a business decision updated in one file but contradicted by another.

---

# Task 3: Create `docs/DESIGN.md`

Create a concise but complete architecture overview.

Do not copy every detailed transition table from the business-flow documents. Link to the relevant files instead.

Use this structure.

## 1. Purpose and scope

Explain:

* what the system does;
* who uses it;
* the internal department context;
* the boundary between editorial governance and production execution;
* what is intentionally outside the system.

## 2. System context

Include a Mermaid system-context diagram covering:

```text
Frontend
Backend API
MongoDB
Cloudflare R2 or local storage
External Python AI service
Email or notification provider when implemented
```

Clearly distinguish required components from optional integrations.

## 3. Runtime architecture

Describe:

* frontend application;
* backend API;
* persistence;
* file storage;
* AI service proxy;
* background or outbox processing when present;
* environment-specific behavior.

Use a Mermaid container or component diagram.

## 4. Frontend architecture

Document:

* authentication state;
* API client;
* route protection;
* role-aware navigation;
* feature modules;
* form validation;
* server-state handling;
* how deprecated endpoints are avoided.

Only document patterns that exist in the codebase.

## 5. Backend architecture

Describe major bounded areas:

```text
Authentication
Proposal and editorial review
Board governance
Series and Chapter production
Studio Regions and Tasks
Submissions
Materials
Files
AI processing
Comments
Rankings
Earnings tracking
Administration
Notifications and outbox
```

Explain controller, service, validator, model, middleware, and route responsibilities.

## 6. Authentication flow

Document:

```text
Email/password login
Access token
Refresh token
RefreshSession
Session revocation
Refresh rotation
Logout
Inactive-user rejection
```

Include a Mermaid sequence diagram.

Clearly document where tokens are stored by the frontend.

Identify any current security gap without silently describing an unimplemented solution as current behavior.

## 7. Authorization model

Do not call the whole model only “three-layer RBAC”.

Use:

```text
Three-layer authorization model
```

Layers:

```text
Layer 1: Authentication
Layer 2: Role or capability authorization
Layer 3: Resource ownership, assignment, membership, and relationship authorization
```

Include examples:

```text
Mangaka role
AND owns the Series

Editor role
AND is assigned Tantou

Assistant role
AND is assigned the Task

Board role
AND belongs to the active VotingSession

Board Chair
AND isChair = true

Editor-in-Chief
AND isEditorInChief = true
```

Document reusable authorization guard expectations.

## 8. Domain model overview

Do not hard-code “25 models” as a permanent architectural claim.

Use a heading such as:

```text
Current domain model inventory
```

Group models by domain and explain key relationships.

At minimum include:

```text
User
RefreshSession
Proposal
ProposalVersion
VotingSession
ProposalVote
BoardDecision
Series
SeriesMember
Chapter
Page
StudioRegion
StudioTask
Submission
Comment
Material
MaterialVersion
Publication
Earning
Ranking
RankingImport
AiProcessing
Notification
OutboxEvent
Audit record if implemented
```

Include a Mermaid ER overview with only important relationships.

## 9. State-machine overview

Summarize and link to detailed files for:

* Proposal;
* VotingSession;
* Series;
* Chapter;
* Task;
* Submission;
* Region;
* Comment.

Do not redefine conflicting status machines.

## 10. API conventions

Document actual conventions for:

* route naming;
* action endpoints;
* response envelopes;
* pagination;
* validation;
* error shape;
* error codes;
* idempotency;
* optimistic concurrency;
* deprecated endpoints;
* HTTP status usage.

Do not invent a response envelope if the code does not consistently implement one.

## 11. Transaction boundaries

Document multi-entity actions that must be atomic.

At minimum:

### Board finalization

```text
VotingSession
Proposal
BoardDecision
Series
Outbox events
```

### Submission approval

```text
Submission
Task
Region
Earning
Outbox event
```

### Chapter submission for review

```text
Readiness validation
Chapter
Pages
Review snapshot
```

### Task creation

```text
Task
Region assignment
Region lock
```

### Publication

```text
Publication
Chapter
publication timestamps
outbox or notifications
```

Clearly separate the main transaction from external notifications and AI calls.

## 12. File and AI processing

Document:

* presigned upload;
* display/download tokens;
* storage keys;
* file ownership;
* file versioning;
* stale AI detection;
* Page version binding;
* AI-created Regions requiring human confirmation;
* cleanup and failure behavior.

## 13. Security model

Cover:

* authentication;
* authorization;
* password hashing;
* token expiry;
* refresh rotation;
* session revocation;
* input validation;
* file validation;
* rate limiting;
* CORS;
* auditability;
* secret handling;
* environment separation.

Clearly distinguish implemented controls from known gaps.

## 14. Testing strategy

Describe the existing and recommended test layers:

```text
Unit tests
Workflow transition tests
Authorization matrix tests
Integration tests
API contract tests
Concurrency and idempotency tests
File-access tests
AI integration contract tests
End-to-end tests
```

Include the most important business invariants that must have tests.

## 15. Deployment and environments

Document the actual development and production assumptions.

Include environment-specific behavior such as:

* local file storage;
* R2 storage;
* AI service URL;
* demo endpoints;
* test or Vitest behavior;
* required environment variables.

## 16. Known gaps

Include only real gaps.

Potential examples, only when supported by the code:

* missing audit query API;
* insufficient record-level authorization;
* missing rate limiting;
* oversized workflow service;
* loose schemas;
* missing transactional consistency;
* incomplete structured logging;
* stale deprecated fields.

Do not automatically list self-registration as a gap.

For an internal system, document:

```text
Self-registration is intentionally unsupported.
Accounts are provisioned by an Administrator.
```

unless the project requirements explicitly require public registration.

## 17. Architecture decisions

Add a concise ADR-style table containing:

```text
Decision
Reason
Trade-off
Status
Related documents
```

Include major decisions such as:

* Series created from approved Proposal;
* Assistant works through Task and Submission;
* Tantou owns editorial review;
* Board Chair finalizes voting outcomes;
* scheduling belongs to Publication;
* AI output requires human confirmation;
* earnings are tracking, not payroll.

---

# Task 4: Create `docs/CODE-TODO.md`

Create a prioritized, implementation-ready improvement backlog.

Do not rank tasks only by code cleanliness.

Use these priority groups:

```text
P0 — Security and business correctness
P1 — Data integrity and reliability
P2 — Maintainability and performance
P3 — Cleanup and quality improvements
```

Every item must contain:

```text
ID
Title
Priority
Problem
Business or technical impact
Affected files/modules
Required change
Acceptance criteria
Required tests
Dependencies
Estimated scope: Small, Medium, or Large
Status
```

Do not provide calendar time estimates.

---

## P0 — Security and business correctness

Include verified issues such as:

### Record-level authorization

* Proposal ownership.
* Series ownership.
* Chapter ownership.
* assigned Tantou enforcement.
* Task assignment.
* Submission review ownership.
* Comment blocking authority.
* file scope visibility.
* Material ownership.
* Board session eligibility.

### VotingSession cancellation

Ensure cancellation returns Proposal to `PENDING_BOARD`.

### Transaction consistency

Add atomic handling for:

* Board finalization.
* Submission approval.
* Chapter review submission.
* Task creation and Region locking.
* Publication.

### Uniqueness and active-record invariants

Enforce:

```text
One active VotingSession per Proposal
One vote per Board member per VotingSession
One Series per approved Proposal
One active Tantou assignment per Series
One active Task per Region
One current Submission per Task
One active Publication per Chapter
```

### Destructive operations

Prevent hard deletion of business records referenced by:

* reviews;
* votes;
* decisions;
* publications;
* submissions;
* earnings;
* audit history.

### Admin workflow boundaries

Remove or restrict workflow override, force-status, demo reset, and other dangerous administrative operations outside development or demo environments.

---

## P1 — Data integrity and reliability

Include:

* replace unsafe `strict: false` or loose schemas where they permit uncontrolled business data;
* standardize domain error codes;
* add missing indexes and partial unique indexes;
* guarantee idempotency for submission approval and Board finalization;
* ensure outbox records are created consistently;
* bind AI results to Page and file versions;
* invalidate stale AI results after Page replacement;
* validate uploaded content with size, MIME, and magic bytes;
* add rate limiting to login, refresh, upload, and expensive AI endpoints;
* prevent duplicate Submission decisions;
* ensure deprecated aliases call the canonical domain service.

---

## P2 — Maintainability and performance

Include:

* decompose `workflow.service.ts` by bounded context;
* split `models.ts` by domain;
* improve typed domain and persistence models;
* fix `dashboardSummary` N+1 queries;
* optimize repeated authorization queries;
* centralize authorization guards;
* centralize status-transition definitions;
* improve API contract typing;
* add structured logging and request correlation;
* improve observability around AI, files, and transactions.

Do not mark N+1 as Critical unless evidence shows severe production impact.

---

## P3 — Cleanup and quality

Include:

* remove deprecated fields;
* remove dead statuses;
* remove duplicate route aliases after migration;
* remove legacy `blocking` field;
* remove unused Earning payroll states;
* improve CORS configuration;
* replace `JSON.parse(JSON.stringify(...))` cloning;
* normalize naming;
* remove duplicate middleware aliases;
* clean outdated comments and docs;
* add deprecation headers before endpoint removal when appropriate.

---

# Task 5: Documentation quality requirements

For every modified business-flow file:

1. Keep a concise purpose and scope section.
2. Correct the Mermaid flowchart.
3. Provide the canonical status table.
4. Provide the transition table.
5. Include:

   * current status;
   * action;
   * actor;
   * role guard;
   * ownership or assignment guard;
   * additional business guards;
   * resulting status;
   * side effects;
   * transaction boundary.
6. Document terminal states.
7. Document concurrency and idempotency where relevant.
8. Document business invariants.
9. Document error codes.
10. Mark deprecated behavior.
11. Mark required code changes.
12. Avoid duplicate explanations already owned by another document.
13. Link to related workflow files.
14. Preserve actual code references using file and line references where possible.

---

# Task 6: Global invariants

Ensure these invariants are documented in `INDEX.md`, `DESIGN.md`, and the relevant workflow files:

1. One approved Proposal creates at most one Series.
2. One Proposal has at most one active VotingSession.
3. One Board member has at most one vote per VotingSession.
4. One Series has at most one active Tantou assignment.
5. One Region has at most one active Task.
6. One Task has one current Submission.
7. One Chapter has at most one active Publication.
8. Frozen ProposalVersions are immutable.
9. Frozen Chapter review snapshots are immutable.
10. Referenced business records cannot be hard-deleted.
11. Assistant work is performed through Task and Submission.
12. Only the owning Mangaka submits a Chapter to Tantou review.
13. Only the assigned Tantou resolves or reopens editorial blocking comments.
14. Notifications do not determine whether the main business transaction succeeds.
15. External AI calls do not determine whether unrelated committed business data remains valid.
16. AI output is never treated as human-approved content.
17. Admin does not perform editorial approval or alter Board decisions.

---

# Task 7: Scope control

Do not introduce:

* full payroll processing;
* payment gateways;
* accounting;
* tax handling;
* contract management;
* public self-registration unless explicitly required;
* workflow builders;
* event sourcing;
* unnecessary microservices;
* complex organization hierarchies;
* multiple redundant approval levels;
* enterprise infrastructure not required by the project.

Keep the architecture realistic and implementable by a student team.

Prefer correcting consistency and authorization over adding more features.

---

# Task 8: Final verification

Before finishing, perform a final consistency pass.

Confirm:

* no workflow state is left without a valid next action;
* no cancelled VotingSession leaves a Proposal orphaned;
* all Chapter submission paths require the owning Mangaka;
* Assistant permissions are limited to assigned work;
* assigned Tantou checks are documented consistently;
* Region locking is consistent across Task, Submission, and Region files;
* Comment blocking authority is consistent;
* Submission decisions use canonical Submission endpoints;
* material readiness is described consistently;
* status names match across documents;
* error codes have one meaning;
* deprecated routes are identified;
* all required code changes appear in `CODE-TODO.md`;
* `DESIGN.md` does not contradict the business-flow documents;
* `INDEX.md` accurately summarizes the final canonical workflow.

---

# Required output

Update the files directly.

After completing the edits, return a concise report containing:

## 1. Files changed

List every created or modified file.

## 2. Canonical business decisions

Summarize the final decisions adopted.

## 3. Current-code mismatches

List behavior that remains implemented differently from the canonical documentation.

For each mismatch, include:

```text
Current behavior
Canonical behavior
Affected files
Required code change
CODE-TODO reference
```

## 4. Deprecated behavior

List deprecated:

* routes;
* actions;
* statuses;
* fields;
* aliases.

## 5. Priority summary

Summarize the number of TODOs by:

```text
P0
P1
P2
P3
```

## 6. Consistency checklist

Provide pass or fail for:

```text
Proposal lifecycle
Board governance
Series lifecycle
Chapter workflow
Task and Submission workflow
Region locking
Comments
Materials
Files
AI processing
Earnings
Rankings
Authorization
Transactions
Error codes
INDEX.md
DESIGN.md
CODE-TODO.md
```

## 7. Remaining risks

Only include unresolved issues that could not be confirmed from the repository.

Do not claim completion for any item that was not verified in code or documentation.
