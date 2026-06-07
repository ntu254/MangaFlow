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

## Review invariant

```txt
Assistant Submit
→ Mangaka Review
→ Editor Final Approval
```

## Publication invariant

Chapter cannot be published unless:

- All pages uploaded
- All tasks approved
- All submissions approved
- All comments resolved
- Editor final approval exists
- Publication date exists

## File invariant

- Store original file unchanged.
- Use private storage.
- Access by signed URL.
- Do not store base64 AI output in DB.

## Verification

Any change touching these rules must include unit/integration test or manual QA proof.
