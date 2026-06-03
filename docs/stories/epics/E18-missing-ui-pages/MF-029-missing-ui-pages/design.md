# MF-029 Missing UI Pages Design

## Structure

The routes are already mapped in `client/src/App.tsx`:
- `/app/assistant/tasks` -> `AssistantTaskListPage`
- `/app/mangaka/tasks` -> `MangakaTaskListPage`
- `/app/mangaka/submissions` -> `MangakaSubmissionsPage`
- `/app/editor/series` -> `EditorAssignedSeriesPage`

## Details

We will review the implementation of each page, ensure SWR / API calls fetch the actual database records, and verify styling aligns with the Vercel/React light mode guidelines in `AGENTS.md` (e.g. avoiding waterfalls, utilizing SWR hooks, proper error boundaries).
