# MangaFlow Screen Patterns

---

# 1. Dashboard Screens

Use for:

```txt
Admin Dashboard
Mangaka Dashboard
Assistant Dashboard
Editor Dashboard
Board Dashboard
```

Required sections:

```txt
Page header
KPI cards
Pending action list
Recent activity
Role-specific quick actions
```

Component requirements:

```txt
MFCard
MFButton
MFBadge
MFProgress
ActionItemList
ChapterProgressCard where applicable
```

---

# 2. Series / Chapter Screens

Use for:

```txt
My Series
Series Detail
Chapter Detail
Production Team
Manuscript Versions
```

Required sections:

```txt
Entity summary card
Status badge
Primary action
Tabs or sections
Progress summary
Related list/grid
```

---

# 3. Workspace Screens

Use for:

```txt
Mangaka Page Workspace
Editor Page Review Workspace
Assistant Task Workspace
Bubble Translation Workspace
```

Required sections:

```txt
WorkspaceShell
Canvas area
Tool/action panel
Context/detail panel
Comment/task/submission panel
```

Assistant workspace must not expose full chapter by default.

---

# 4. Task Screens

Use for:

```txt
My Tasks
Task Detail
Create Task Dialog
Task Workspace
Revision Queue
```

Required sections:

```txt
Task status badge
Due date
Assigned page/region preview
Context pages read-only
Submission panel
Comment thread
```

---

# 5. Review Screens

Use for:

```txt
Manuscript Review
Submission Review
Editor Final Review
Comment Resolve
Publication Readiness
```

Required sections:

```txt
Review target preview
Decision bar
Comments/issues
Version history
Checklist if applicable
```

---

# 6. Board Screens

Use for:

```txt
Series Approval Queue
Vote Screen
Ranking
At-Risk Series
Decision History
Tie-break Queue
```

Required sections:

```txt
Series summary
Vote controls
Vote summary
Decision status
Ranking table
At-risk decision actions
```

---

# 7. Empty State Pattern

Every list screen needs empty state.

Example:

```txt
No tasks yet.
Once a Mangaka assigns work, tasks will appear here.
[Refresh]
```

Use:

```txt
MFEmptyState
```

---

# 8. Error State Pattern

Every async screen needs error state.

Example:

```txt
Could not load series.
Check your connection or try again.
[Retry]
```

Use:

```txt
MFErrorState
```
