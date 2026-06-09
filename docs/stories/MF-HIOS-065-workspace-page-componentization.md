# MF-HIOS-065 Workspace Page Componentization

## Status

implemented

## Lane

normal

## Product Contract

Workspace Page keeps current task, comment, and submission read behavior while separating route composition, data hook, mapper logic, and workspace panels.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/page-workspace.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/submission-review.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-workspace.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Extract `useWorkspacePage` for task, comments, submissions, loading, error, and refresh state.
- Extract `workspace.mappers.ts` for task scope, context pages, comment mapping, and submission mapping.
- Extract `WorkspaceToolbar`, `CanvasPanel`, `LeftPanel`, and `RightPanel`.
- Preserve current API behavior:
  - `GET /api/tasks/:taskId`
  - `GET /api/comments/task/:taskId`
  - `GET /api/tasks/:taskId/submissions`
- Keep workspace permissions and access boundaries unchanged.

Out of scope:

- Signed URL/artwork fetches.
- Full chapter access.
- Backend permission/workflow changes.
- New mutation wiring.

## Acceptance Criteria

- `WorkspacePage.tsx` becomes a thin composition page.
- `useWorkspacePage` owns load/error/fetch state.
- `workspace.mappers.ts` owns task scope/context/comment/submission transforms.
- Workspace panels own rendering, not page orchestration.
- Existing workspace API behavior remains unchanged.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not required; frontend componentization only. |
| Integration | Not required; no backend behavior changes. |
| E2E | Not configured. |
| Platform | `npm run lint --prefix client` and `npm run build --prefix client`. |
| Release | Not applicable. |

## Evidence

- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS.
- `WorkspacePage.tsx` reduced from 310 lines to 20 lines.
