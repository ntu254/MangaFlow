# Exec Plan

## Goal

Implement the Assistant submission browser workflow over MF-015.

## Scope

In scope:

- Submission API client and tests.
- Task API detail helper.
- Assistant task list route alias.
- Assistant task detail route with page/region preview.
- Submission form using `fileUrl`, optional `previewUrl`, and note.
- Client validation and Harness proof.

Out of scope:

- Binary file picker/R2 upload.
- Approval/revision actions.
- Comments/history.
- Payroll.

## Risk Classification

Risk flags:

- Authorization.
- Public contracts.
- Existing behavior.
- Weak proof.
- Multi-domain.

Hard gates:

- Authorization-visible behavior.

## Work Phases

1. Discovery of EPIC-10 UI and current Assistant shell.
2. Story packet and durable story creation.
3. Client API implementation.
4. Assistant list/detail UI implementation.
5. Client typecheck/test/build.
6. Harness update and trace.

## Stop Conditions

Pause for human confirmation if:

- Submission UI requires binary upload to satisfy this story.
- Backend API shape must change.
- Authenticated rendered E2E becomes mandatory but no Clerk fixture/browser is
  available.
