# MF-016 Assistant Submission UI

## Current Behavior

MF-014 added a minimal Assistant dashboard that lists assigned Tasks and lets
Assistants start `TODO` Tasks. MF-015 added the Submission API foundation, but
there is no browser surface for Assistants to inspect Task context or submit a
result.

## Target Behavior

Assistants can open `/app/assistant/tasks` to see assigned work, navigate to
`/app/assistant/tasks/:taskId`, inspect Task detail with page and region
context, view existing Submissions, and submit a versioned result through the
MF-015 API.

## Affected Users

- Assistant.

## Affected Product Docs

- `docs/06_mvp_task_breakdown.md`
- `docs/04_frontend_routes_ui_screens.md`
- `docs/product/workflow.md`
- `docs/product/mvp-roadmap.md`

## Non-Goals

- Binary file picker and R2 upload.
- Review/approval/revision actions.
- Comments/history.
- Payroll.
