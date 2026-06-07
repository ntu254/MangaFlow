# UI Contract: Dashboard Screens

## Applies To

```txt
Admin Dashboard
Mangaka Dashboard
Assistant Dashboard
Editor Dashboard
Board Dashboard
```

## Required Layout

```txt
PageShell
KPI card row
Pending action cards
Recent activity
Role-specific quick actions
```

## Required Components

```txt
MFCard
MFButton
MFBadge
MFProgress
ActionItemList
ChapterProgressCard
DashboardStatCard
```

## Rules

```txt
Use bento grid.
Do not use dense enterprise dashboard tables as first view.
Each card must have a clear title, value/content, and optional action.
Critical alerts use soft badge + clear text.
```

## Done Criteria

```txt
[ ] Dashboard has empty/loading/error states.
[ ] Cards align to grid.
[ ] Mobile stacks correctly.
[ ] No one-off card/button styling.
[ ] Role-specific actions match actor workflow.
```
