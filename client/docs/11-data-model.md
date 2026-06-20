# Data model (mock)

All data lives in `src/data/mangaflow.ts` and is plain TypeScript. Nothing is
fetched in Phase 1.

```
Staff      ──(role)──> Role enum
Series     ──(mangakaId, editorId)──> Staff
Chapter    ──(seriesId)──> Series
Task       ──(chapterId, assigneeId)──> Chapter, Staff
Submission ──(taskId)──> Task         [two-round: mangakaApproved, editorApproved]
Ballot     ──(seriesId, chapterId?)──> Series, Chapter  [votes by Board staff]
Publication ─(chapterId)──> Chapter   [scheduled / published]
Payroll    ──(taskId)──> Task         [pending / confirmed / paid]
RankingPeriod ─[entries: seriesId, rank, votes]
```

Helpers: `findStaff`, `findSeries`, `findChapter`, `findTask`,
`chaptersBySeries`. Keep call sites going through these so swapping to a
real API later only changes one file.
