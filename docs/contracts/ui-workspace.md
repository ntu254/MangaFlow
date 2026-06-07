# UI Contract: Workspace Screens

## Applies To

```txt
Mangaka Page Workspace
Editor Page Review Workspace
Assistant Task Workspace
Bubble Translation Workspace
```

## Required Layout

```txt
WorkspaceShell
Left panel: page/task/context list
Center panel: canvas/page preview
Right panel: details/comments/actions
```

## Access Rule

Assistant workspace must be task-based.

```txt
Assistant sees assigned page/region.
Assistant sees context pages read-only if provided.
Assistant does not see full chapter by default.
```

## Required Components

```txt
WorkspaceShell
MFPagePreviewCard
RegionOverlay
ToolPalette
CommentThread
TaskDetailPanel
SubmissionPanel
ReviewDecisionBar
```

## Done Criteria

```txt
[ ] Center canvas remains primary focus.
[ ] Panels can collapse or stack responsively.
[ ] Context pages are visually marked READ ONLY.
[ ] Assistant UI does not expose unrelated pages.
[ ] Loading/error states exist.
```
