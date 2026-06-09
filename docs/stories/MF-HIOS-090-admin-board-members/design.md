# Design

## Backend

Mount under `/api/admin` with `requireAuth -> requireRole("ADMIN")`.

Routes:

- `GET /board-members`
- `POST /board-members` body `{ userId }`
- `PATCH /board-members/:userId/status` body `{ isActive }`
- `PATCH /board-members/:userId/chair` body `{ isChair: true }`

Backend services already enforce active `BOARD` user rules for membership/chair assignment.

## Frontend

Add page, hook, table, and dialog. Copy must state Admin manages Board membership only, not Board decisions.
