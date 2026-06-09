# Main Contract

## MVP scope

MangaFlow is an internal production workflow system from series proposal
through publication readiness, ranking, and payroll tracking.

## MVP out of scope

- Public manga catalog
- Personal manga library
- Public chapter reader
- End-user reading progress

The canonical MVP feature-contract map is maintained in
`docs/contracts/README.md`.

Workflow status enums and allowed transitions are canonical in
`docs/contracts/workflow-status.md`. Feature contracts and implementation code
must not introduce conflicting status names.

## Core invariant

Board approval gates official chapter production.

```txt
Series status must be APPROVED / ONGOING / AT_RISK
before Chapter can be created.
```

## Access invariant

Assistant access is task-based.

```txt
SeriesMember ASSISTANT = eligible for task assignment
Task.assignedTo = actual workspace access
```

Security meaning:

- `SeriesMember(role=ASSISTANT, status=ACTIVE, accessScope=TASK_ONLY)` only
  makes the Assistant eligible to receive tasks in that Series.
- Assistant workspace access is granted by `Task.assignedTo`.
- Assistant may see only the assigned page/region and explicit read-only
  `contextPageIds`.
- Assistant cannot open page workspace directly by `pageId`.
- Assistant cannot view an entire chapter by default.
- Assistant cannot view another assistant's task.
- Assistant cannot view Board data, confirm payroll, or create tasks.
- Frontend checks are never sufficient; backend services must enforce this.
- Assistant page/file/workspace access must not be granted by SeriesMember membership alone.

## Review invariant

```txt
Assistant Submit -> Mangaka Review -> Editor Final Approval
```

Editor proposal review and Editor production final approval are distinct:

- Proposal review happens before Board review and covers the initial
  manuscript/Series proposal.
- Production final approval happens after Mangaka review and covers
  task/submission/page readiness.

## Publication invariant

Chapter cannot be published unless:

- All pages uploaded
- All tasks approved
- All submissions approved
- All comments resolved
- Editor final approval exists
- Publication date exists

Publication readiness is owned by backend
`PublicationReadinessService`. Controllers and frontend screens must display
or request readiness results, not duplicate readiness logic.

## Board decision invariant

- Board vote options are `APPROVE`, `REJECT`, and `NEEDS_REVISION`.
- Minimum valid votes, Board Chair normal vote, Board Chair tie-break,
  three-option majority, and vote deadline rules are defined in
  `docs/contracts/workflow-status.md`.
- Admin cannot override Board decisions.

## Payroll invariant

Payroll is tracking only in MVP.

```txt
finalPayment = baseRate * deadlineMultiplier
```

Rejected tasks produce zero payment. `revisionFee` is future scope.

## API action invariant

State-changing workflow actions use `POST` action endpoints. Resource reads
use `GET`; normal resource creation uses `POST`; partial data edits may use
`PATCH`. Workflow decisions such as approve, reject, request revision, submit,
finalize, tie-break, mark fixed, resolve, calculate, and confirm must be
modeled as explicit action endpoints.

## File invariant

- Store original file unchanged.
- Use private storage.
- Access by signed URL.
- Signed URL response requires backend access-policy validation.
- Do not store base64 AI output in DB.

## Runtime invariant

- Production must not start with weak auth/storage secret fallbacks.
- Server must not listen if MongoDB connection fails.
- Hardcoded admin credentials are forbidden in source.

## Verification

Any change touching these rules must include unit/integration test or manual QA
proof.
