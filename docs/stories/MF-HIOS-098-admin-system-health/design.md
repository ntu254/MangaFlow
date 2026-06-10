# Design

## Contract Alignment

- Admin can view system health but cannot approve, reject, vote, publish, or override Board outcomes.
- Storage status is summarized only; private files and signed URLs are not fetched.
- AI service status is backend-mediated; the frontend does not call the AI service directly.
- The page uses existing backend contract surfaces only.

## UI

`/app/admin/system-health` shows:

- Admin monitor, read-only, and warning-count badges.
- API health message from `GET /api/health`.
- Readiness score derived from backend summary warning count.
- Storage monitor summary from the Admin dashboard summary.
- Service cards for API, Database, Storage, and AI Service.
- Boundary notes describing forbidden frontend behavior.

## Backend

No backend route is added. Existing endpoints remain the source of truth:

- `GET /api/dashboard/admin/sidebar-summary`
- `GET /api/health`

## Data

No schema changes.
