# Design

## Domain Model

Security/runtime hardening adds or clarifies these application boundaries:

- `AccessPolicyService`: central authorization entry for series/task/page/file/publication access.
- `TaskAccessPolicy`: assigned-task and context-page read-only checks.
- `FileAccessPolicy`: signed URL checks by owner type, owner id, task assignment, and submission ownership.
- `PublicationReadinessService`: backend-owned readiness evaluation remains separate and must not move to frontend logic.
- `BoardVotingService`: backend-owned vote/tie-break logic remains separate from controller glue.
- `WorkflowTransitionService`: canonical status-transition guard surface.

This story does not implement all services, but it defines them as the required hardening direction.

## Application Flow

Required runtime flow:

```txt
load env
-> validate required production config
-> connect MongoDB
-> seed optional admin only from env-driven dev-safe path
-> start HTTP server
```

Invalid runtime flow:

```txt
start server without DB
start production with weak JWT/storage defaults
expose signed URL without access policy check
grant Assistant access from SeriesMember alone
```

Authorization flow requirements:

```txt
role check
+ resource check
+ ownership/scope check
+ explicit task/context/file policy
-> allow/deny
```

## Interface Contract

Required response envelope remains:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "errors": [],
  "code": "OPTIONAL_MACHINE_CODE"
}
```

Hardening-oriented machine-readable codes should be supported by future implementation, such as:

- `SERIES_NOT_APPROVED`
- `TASK_NOT_ASSIGNED_TO_USER`
- `CONTEXT_PAGE_READ_ONLY`
- `FILE_ACCESS_DENIED`
- `PUBLICATION_READINESS_FAILED`
- `BOARD_VOTE_TIE_BREAK_REQUIRED`
- `ENV_VALIDATION_FAILED`
- `DATABASE_CONNECTION_FAILED`

Signed URL contract requirement:

```txt
GET /api/files/:fileId/signed-url
-> require auth
-> resolve file ownerType/ownerId
-> enforce file access policy
-> return signed URL only when policy passes
```

AI boundary requirement:

```txt
Frontend -> MangaFlow backend -> AI service
```

The browser must not call the AI service directly in production.

## Data Model

No schema migration is required by this docs pass.

Persistence rules clarified:

- MongoDB stores metadata and file references only.
- AI/image/file bytes do not persist as base64 strings in MongoDB.
- Backend converts temporary AI base64 response into file/object storage or rejects the payload.

## UI / Platform Impact

Frontend route guards remain UX-only.

Platform/runtime impacts:

- production startup can fail before listen
- AI service origin restrictions become explicit
- UTF-8 normalization becomes required for maintainable source/docs

## Observability

Hardening implementation should log:

- env validation failure without leaking secrets
- DB connection failure before exit
- signed URL deny events
- task/file access deny events

Audit/security-sensitive deny events should be queryable later.

## Alternatives Considered

1. Keep authorization in scattered controllers/services. Rejected: too risky for Assistant/file scope.
2. Let AI service keep permissive browser CORS in production. Rejected: weak boundary.
3. Allow production weak-secret fallbacks. Rejected: unacceptable runtime risk.
