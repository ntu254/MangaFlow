# API, Storage, and Data Contract

## API Base

| Environment | Base URL |
| --- | --- |
| Local development | `http://localhost:5000/api` |
| Production target | `https://mangaflow-api.railway.app/api` |

## Authentication Header

Authenticated requests send a Clerk session token:

```text
Authorization: Bearer <clerk_session_token>
```

The backend verifies the token, maps the Clerk identity to an internal user,
and enforces product permissions before running domain behavior.

## Standard Success Response

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

## Standard Error Response

```json
{
  "success": false,
  "message": "Task not found",
  "code": "TASK_NOT_FOUND",
  "details": {}
}
```

## Pagination Shape

```json
{
  "success": true,
  "message": "OK",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Core Data Domains

- User
- Series
- SeriesMember
- Manuscript
- Chapter
- Page
- FileAsset
- Region
- Annotation
- Task
- Submission
- Comment
- Review
- BoardMember
- BoardVote
- BoardDecision
- Publication
- Ranking
- TaskRate
- AssistantEarning
- Notification

## Storage Rules

- Production storage uses Cloudflare R2.
- Local development storage uses MinIO.
- Storage integration must stay S3-compatible.
- Files are private by default.
- The backend owns signed URL generation.
- Original files are preserved.
- Preview and thumbnail derivatives are generated separately.
- File metadata belongs in MongoDB; binary files belong in object storage.

## AI Service Boundary

- AI bubble detection and image processing run in a separate FastAPI service.
- The backend calls the AI service and translates results into MangaFlow
  product records.
- AI result coordinates must be mapped to the same normalized coordinate system
  used by manual regions and annotations.
- AI timeouts and failures must not corrupt product workflow state.

## Phase 0 API Scope

The only Phase 0 backend API contract is a smoke endpoint:

```text
GET /api/health
```

It returns the standard success envelope. Auth, data models, storage providers,
AI processing, and domain APIs are out of scope until later stories.
