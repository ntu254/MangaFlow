# Database Design

Database collections support the production-only internal MVP. They do not
model public catalog browsing, personal libraries, public chapter reading, or
end-user reading progress.

## Core collections

- User
- RefreshToken
- Series
- SeriesMember
- Manuscript
- Chapter
- Page
- FileAsset
- Region
- Annotation
- TaskType
- Task
- Submission
- Comment
- BoardMember
- BoardVote
- BoardDecision
- Publication
- Ranking
- AssistantEarning
- AIResult
- BubbleTranslation
- Notification
- AuditLog

## Key relations

```txt
User ← SeriesMember → Series
Series → Manuscript
Series → Chapter → Page
Page → Region
Task → Submission
Task → AssistantEarning
Series → Ranking
Series → BoardVote/BoardDecision
```

## Important indexes

- User.email unique
- Series.slug unique
- SeriesMember(seriesId, userId) unique
- Chapter(seriesId, chapterNumber) unique
- Page(chapterId, pageNumber) unique
- BoardVote(seriesId, userId) unique
- Ranking(period, seriesId) unique

## Workflow status source of truth

Workflow status enum values are canonical in
`docs/contracts/workflow-status.md`. Collections that store a workflow status
must use those exact values.

Affected collections include:

- User
- Series
- SeriesMember
- Manuscript
- Chapter
- Page
- Region
- Task
- Submission
- Comment
- BoardVote
- BoardDecision
- Ranking
- AssistantEarning

Unknown status strings are invalid implementation behavior. Status transition
guards belong in backend services and must not be delegated to frontend display
logic.

Assistant access storage invariant:

```txt
SeriesMember(role=ASSISTANT, status=ACTIVE, accessScope=TASK_ONLY)
= eligibility for assignment only.

Task.assignedTo = actual task workspace access.
Task.contextPageIds = explicit read-only page context.
```
