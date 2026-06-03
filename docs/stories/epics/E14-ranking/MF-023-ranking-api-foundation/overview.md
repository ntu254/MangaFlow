# MF-023 Ranking API Foundation

## Current Behavior
The backend does not support series ranking, period-based scores, or warning status assignment.

## Target Behavior
Implement the REST API foundation for the Ranking workflow:
1. **Ranking Model**:
   - Fields: `seriesId` (ref), `period` (string, e.g. "2026-W22"), `voteCount` (number), `readerScore` (number), `normalizedReaderScore` (number), `finalScore` (number), `rank` (number), `previousRank` (optional), `status` (`"NORMAL" | "WARNING" | "AT_RISK"`), `createdBy` (ref).
2. **Ranking Calculation Service**:
   - Validate `readerScore` is between 1 and 10.
   - Calculate: `normalizedReaderScore = readerScore * 10`.
   - Calculate: `finalScore = (voteCount * 0.7) + (normalizedReaderScore * 0.3)`.
   - Sort descending by `finalScore` and assign sequential `rank` values.
3. **Endpoints**:
   - `GET /api/rankings` -> List rankings for a period.
   - `POST /api/rankings/import` -> Import vote counts and reader scores for a period, calculate and save rankings.
   - `GET /api/series/:seriesId/rankings` -> List historical rankings for a specific series.
   - `POST /api/rankings/:rankingId/mark-warning` -> Update status to WARNING.
   - `POST /api/rankings/:rankingId/mark-at-risk` -> Update status to AT_RISK.

## Affected Users
- Board Members (import and view all)
- Mangakas (view ranking of own series)
- Admins

## Non-Goals
- Frontend UI screens (handled in MF-024).
