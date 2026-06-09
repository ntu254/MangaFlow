# MF-HIOS-085 Tasks Page Preview Dialog Extraction

## Status

implemented

## Lane

normal

## Product Contract

Tasks page keeps current task create-preview behavior, task queue, pending actions, and backend-owned assignment/task-type boundaries while moving local preview presentation out of the route shell.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-task.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Extract local preview presentation into `client/src/features/task/components/TaskPreviewDialog.tsx`.
- Keep `client/src/features/task/pages/TasksPage.tsx` as a thinner composition shell.
- Preserve current create-task preview state, task list, task preview panel, and backend boundary copy.

Out of scope:

- New task/task-type/assistant endpoints.
- New permission or assignment rules.
- Browser E2E setup.

## Acceptance Criteria

- `TasksPage.tsx` primarily composes shell cards, extracted preview dialog, preview panel, list panel, and state preview.
- Local preview card behavior remains unchanged.
- Task list, pending actions, task type fallback, and create dialog behavior remain unchanged.
- No frontend-only permission shortcut is introduced.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not required; composition extraction only. |
| Integration | Not required; no API behavior changes. |
| E2E | Not configured. |
| Platform | `npm run lint --prefix client`, `npm run build --prefix client`. |
| Harness | `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-085.ps1`, then `scripts/bin/harness-cli.exe story verify MF-HIOS-085`. |
| Release | Not applicable. |

## Evidence

- `client/src/features/task/components/TaskPreviewDialog.tsx` owns local task preview presentation.
- `client/src/features/task/pages/TasksPage.tsx` composes the extracted preview component.
- `client/src/features/task/components/index.ts` exports `TaskPreviewDialog`.
- `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-085.ps1` -> PASS.
- `scripts/bin/harness-cli.exe arch-check --story MF-HIOS-085` -> PASS.
