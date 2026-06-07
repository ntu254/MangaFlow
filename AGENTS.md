# AGENTS.md — MangaFlow AI Agent Rules

This file defines how AI agents and code contributors must work in MangaFlow.

## Skill Routing Rule

Before implementation, agents must classify the task and select the correct docs.

- Product task → read `docs/product/*` and `docs/contracts/main.md`
- UI task → read `docs/design/*`, `docs/contracts/ui-main.md`, and matching `docs/contracts/ui-*.md`
- Backend/API task → read `docs/architecture/api.md`
- Database task → read `docs/architecture/database.md`
- Auth/security task → read `docs/architecture/auth.md` and `docs/architecture/security.md`
- Validation task → read `docs/validation/*`
- Operations task → read `docs/operations/*`
- HI-OS governance task → read `AGENTS.md`, `docs/HARNESS.md`, `docs/FEATURE_INTAKE.md`, `docs/CONTEXT_RULES.md`, and `docs/TRACE_SPEC.md`

Agents must output selected skill pack, selected docs, lane, risks, implementation plan, and validation plan before coding.

## 1. Required reading order before coding

Before modifying code, read:

1. `docs/product/overview.md`
2. `docs/product/requirements.md`
3. Relevant `docs/contracts/<feature>.md`
4. `docs/architecture/overview.md`
5. `docs/architecture/database.md`
6. `docs/architecture/api.md`
7. `docs/validation/test-plan.md`

## 2. Do not guess business rules

If a rule is not found in docs/contracts or architecture docs, ask before coding.

Examples of high-risk rules:

- Series approval gate
- Assistant access scope
- Board voting and tie-break
- Payroll calculation
- Publication readiness
- File access and signed URLs

## 3. Source of truth order

When instructions conflict:

1. User's latest explicit instruction
2. Feature contract in `docs/contracts/`
3. Product requirements
4. Architecture docs
5. Existing code

If still unclear, stop and ask.

## 4. High-risk changes

High-risk changes require explicit confirmation:

- Auth/security logic
- Role/permission checks
- Database schema breaking changes
- File storage access
- Payment/payroll calculation
- Board decision logic
- Publication readiness logic
- AI processing output storage

## 5. Definition of done

Never claim done without proof.

A task is done only when:

- Code compiles
- Relevant tests pass
- Manual QA steps are documented
- Acceptance criteria are checked
- API contract is respected
- No permission bypass exists

## 6. Required response format for coding tasks

When finishing a coding task, report:

```txt
Changed files:
- ...

Implemented:
- ...

Validation:
- command/result

Risks:
- ...

Next step:
- ...
```

## 7. Forbidden shortcuts

Do not:

- Add frontend-only permission checks without backend enforcement
- Store base64 AI output in DB
- Hard delete used TaskType records
- Let Assistant access full chapter by default
- Let Mangaka create Chapter before Board approval
- Let Admin override Board decisions
- Claim a test passed if it was not run
