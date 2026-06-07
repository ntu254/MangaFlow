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
