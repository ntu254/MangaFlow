# MF-HIOS-032 — Page/Region/FileAsset Module with Signed URL Upload

## Status

Completed with validation caveat

## Context

Chapter module exists (MF-HIOS-031) but page upload requires signed URL flow with Cloudflare R2. Need Page/Region/FileAsset repository + service + controller + routes with presigned PUT/GET URL generation. This enables the Manuscript upload and Page upload workflows.

## Scope

Backend Page/Region/FileAsset module with signed URL upload. No frontend integration in this story.

### Allowed

- Extend `chapter.repository.ts` with signed URL logic
- FileAsset model already exists in chapter.model.ts
- Signed URL generation using `@aws-sdk/s3-request-presigner` (already in deps)
- PUT presigned URL for upload, GET presigned URL for access
- Page creation returns presigned upload URL
- Region CRUD for page regions
- Proper error handling

### Forbidden

- Frontend API/client changes
- Task/Submission modules
- Publication/Readiness logic
- AI service integration
- Merge to `main`
- Commit `.env`

## Implementation

### Changed files

- `server/src/modules/chapter/file.service.ts` — S3/R2 presigned URL generation (PUT upload, GET download, delete)
- `server/src/modules/chapter/chapter.repository.ts` — Page upload confirmation, FileAsset queries, Region CRUD
- `server/src/modules/chapter/chapter.service.ts` — File upload/download workflows, Region CRUD business logic
- `server/src/modules/chapter/file.controller.ts` — HTTP handlers for presigned URLs, page/file/region endpoints
- `server/src/modules/chapter/file.validation.ts` — Zod schemas for all new endpoints
- `server/src/modules/chapter/file.routes.ts` — Express router at `/api/files` with auth/role guards
- `server/src/shared/utils/env.ts` — Added R2 config (region, endpoint, credentials, bucket)
- `server/src/index.ts` — Mounted file routes at `/api/files`

### Implemented

- PUT presigned URL generation for direct R2 upload (JPEG, PNG, WebP, PDF up to 100MB)
- Page upload confirmation creates FileAsset record with R2 metadata
- GET presigned download URL for private file access
- Region CRUD: create/get/list/update/delete regions on pages
- Role-based access: MANGAKA/EDITOR/ASSISTANT for upload, MANGAKA/EDITOR for regions
- File type validation (JPEG, PNG, WebP, PDF) and size limit (100MB)
- R2 config added to env with placeholder fallbacks

## Validation

- `npm run build --prefix server`: pass
- `npm test --prefix server`: pass (16 tests)
- `npm run build --prefix client`: pass
- `npm run lint --prefix client`: pass
- `npm run lint --prefix server`: pass

## Risks

- R2 credentials use placeholder fallbacks; real credentials must be set in production .env
- File upload confirmation trusts client-provided r2Key; consider server-side verification in future
- No virus scanning or content validation on upload (deferred)
- Frontend API integration not yet connected (deferred to MF-HIOS-041)
- Task/Submission modules not yet implemented (deferred to MF-HIOS-033)

## Documentation

- `docs/contracts/page-workspace.md`
- `docs/contracts/chapter-production.md`
- `docs/architecture/api.md` (files endpoints)
- `docs/validation/test-plan.md`

## Follow-Up

- MF-HIOS-033: Task/Assignment module with requireSeriesRole middleware
- MF-HIOS-041: Client SeriesDetail/ChapterDetail connect real upload API