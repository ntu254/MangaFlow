# UI Contract: Task UI

## Applies To

```txt
My Tasks
Create Task Dialog
Task Detail
Assistant Task Workspace
Revision Queue
Task Lists
```

## Required Components

```txt
MFButton
MFCard
MFBadge
TaskStatusBadge
MFProgress
MFPagePreviewCard
CreateTaskDialog
ActionItemList
```

## Rules

```txt
Assigned Assistant dropdown shows only Production Team assistants.
Task type comes from active TaskType config.
Context pages are optional and read-only.
Task status colors must come from status-ui.ts.
Due date and priority must be visible.
```

## Done Criteria

```txt
[ ] Task can show page-level or region-level scope.
[ ] Context pages section exists.
[ ] Status badge is consistent.
[ ] Empty task list state exists.
[ ] Create Task Dialog uses shared form components.
```
[//]: # (Validation section appended by MF-HIOS-004.)

## Validation

- Uses `PageShell`, `MFCard`, `MFButton`, `MFBadge`, and task status mappings.
- Status colors map through `status-ui.ts`.
- Uses design tokens for color, radius, shadow, and spacing.
- Empty, loading, error, submitted, and revision states are represented.
- UI review checklist passes.
