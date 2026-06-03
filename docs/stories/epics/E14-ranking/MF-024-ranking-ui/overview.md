# MF-024 Ranking UI

## Current Behavior
The client frontend does not display series rankings, historical ranking trends, or at-risk warnings. There is no form for Board members to import period scores or manage ranking tables.

## Target Behavior
Implement the frontend workspace for the Ranking workflow:
1. **Board Ranking Panel (`/app/board/ranking`)**:
   - Render a table showing the ranking details (rank, previous rank, series name, score, vote count, reader score, status warning badges).
   - Sidebar/button: "Import Period Scores" leading to `/app/board/ranking/import` or opening a modal.
   - Action buttons: "Mark Warning" and "Mark At-Risk" on each row, restricted to Board Members or Admins.
2. **Import Scores Page/Modal (`/app/board/ranking/import`)**:
   - Form with input for Period (e.g. "2026-W22").
   - Multi-row inputs or a simple form allowing selection of series and entering `voteCount` and `readerScore` (validated 1-10).
   - Submit button to calculate and import the period ranking.
3. **Mangaka Ranking Page (`/app/mangaka/ranking` or Series Detail tab)**:
   - Allow Mangakas to view their series ranking history in a tabular view or simple list.
   - Render prominent visual badges if the series status has warning alerts (`WARNING` or `AT_RISK`).

## Affected Users
- Board Members
- Mangakas
- Admins
