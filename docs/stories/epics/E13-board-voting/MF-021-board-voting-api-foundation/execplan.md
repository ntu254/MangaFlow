# Execution Plan

## Step 1: Create Board Models
- Create `server/src/modules/board/board.model.ts` implementing Mongoose models for `BoardMember`, `BoardVote`, and `BoardDecision`.
- Include indexes and unique composite constraints where necessary.

## Step 2: Implement Board Repositories & Services
- Implement `server/src/modules/board/board.repository.ts` for database operations.
- Implement `server/src/modules/board/board.service.ts` for business logic:
  - Adding/retrieving board members.
  - Submitting/updating votes.
  - Generating vote summary.
  - Finalizing decisions with majority checks and tie-break validation.

## Step 3: Implement Board Endpoints & Middleware
- Create `server/src/modules/board/board.routes.ts` mounting endpoints:
  - `GET /api/board/members`
  - `POST /api/series/:seriesId/votes`
  - `GET /api/series/:seriesId/votes`
  - `GET /api/series/:seriesId/votes/summary`
  - `POST /api/series/:seriesId/decisions/finalize`
  - `POST /api/series/:seriesId/decisions/tie-break`
- Enforce system-level role constraints (`BOARD`, `ADMIN`) using existing middleware.
- Define a custom middleware or check to verify active `BoardMember` registration and Board Chair status.

## Step 4: Wire Router
- Mount the board router under `/api` in `server/src/routes/index.ts` or the main Express setup.

## Step 5: Write Tests
- Write Vitest unit and integration suites under `server/src/modules/board/board.service.test.ts` and `server/src/modules/board/board.routes.test.ts`.
- Ensure tests verify role authorization, duplicate voting blocks, correct majority logic, and tie-breaking functionality.
