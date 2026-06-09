# Security Rules

## Role-based access

All sensitive routes must use backend permission checks.

Admin cannot override Board decisions.

## Assistant access

Assistant can access only:

- Assigned task
- Assigned page/region
- Selected context pages read-only
- Own submissions
- Task reference files explicitly allowed by backend policy

Assistant cannot access full chapter by default.

Assistant access must be derived from task/file/context policy, not from SeriesMember membership alone.

## File access

- Private storage only.
- Signed URL required.
- Original files should not be downloadable unless explicitly allowed.
- `GET /api/files/:fileId/signed-url` must validate owner type, owner id, task assignment, and allowed scope before returning a URL.

## High-risk endpoints

- Role update
- Board decision
- Payroll calculation
- File signed URL
- AI processing
- Task workspace access
- Page workspace access

## Runtime hardening

- Production secrets must not use weak fallback defaults.
- Server must not listen when MongoDB connection fails.
- Security failures must not leak secrets in logs.

## AI output storage

Do not store base64 AI image output in MongoDB.

Temporary base64 returned by an AI provider is allowed only as an in-flight backend boundary; it must be converted to file/object storage or rejected before persistence.
