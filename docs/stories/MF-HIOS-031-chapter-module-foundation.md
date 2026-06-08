# MF-HIOS-031 — Chapter Module Foundation

## Status

Completed with validation caveat

## Context

Series Detail and Chapter Detail screens exist as presentation-only (MF-HIOS-027/028). The backend has only Series module implemented. Need Chapter domain module with model, repository, service, controller, routes to enable real chapter creation, page upload, and chapter gating tied to Series approval status.

## Scope

Backend Chapter module only. No frontend API integration or UI changes in this story.

### Allowed

- `server/src/modules/chapter/` folder with model, repository, service, controller, routes, validation
- Chapter Mongoose model with status enum from `shared/workflow/status.ts`
- Chapter creation gated by Series status (APPROVED/ONGOING/AT_RISK only)
- Page model + FileAsset reference (upload handled later)
- Basic CRUD + list chapters by series
- Proper error handling with AppError

### Forbidden

- Frontend API/client changes
- Page upload file handling (signed URL, storage)
- Region/Task/Submission modules
- Publication/Readiness logic
- Merge to `main`
- Commit `.env`

## Implementation

### Changed files

- `server/src/modules/chapter/chapter.model.ts` — Chapter, Page, FileAsset, Region Mongoose models
- `server/src/modules/chapter/chapter.repository.ts` — Data access layer
- `server/src/modules/chapter/chapter.service.ts` — Business logic with validation
- `server/src/modules/chapter/chapter.controller.ts` — HTTP handlers
- `server/src/modules/chapter/chapter.validation.ts` — Zod schemas
- `server/src/modules/chapter/chapter.routes.ts` — Express router with auth/role guards
- `server/src/modules/chapter/chapter.model.test.ts` — Model enum tests
- `server/src/index.ts` — Mounted chapter routes at `/api/chapters`

### Implemented

- Chapter model uses `CHAPTER_STATUSES` from `shared/workflow/status.ts`
- Chapter creation gated: blocks if Series not in `APPROVED`, `ONGOING`, or `AT_RISK`
- At-risk series allowed with warning message
- Cancelled/Completed/Rejected series blocked
- Chapter status defaults to `DRAFT`
- Page model with `UPLOADED` default status
- FileAsset and Region models for future use
- Proper error handling with AppError (400, 403, 404, 409)
- Role-based access: MANGAKA and EDITOR can create chapters/pages
- Basic CRUD + list chapters by series

## Validation

- `npm run build --prefix server`: pass
- `npm test --prefix server`: pass (16 tests including 2 new chapter model tests)
- `npm run build --prefix client`: pass
- `npm run lint --prefix client`: pass
- `npm run lint --prefix server`: pass

## Risks

- Page upload with signed URLs not yet implemented (deferred to MF-HIOS-032)
- Region/Task/Submission modules not yet implemented
- Frontend API integration not yet connected (deferred to MF-HIOS-041)
- Publication readiness logic deferred

## Documentation

- `docs/contracts/chapter-production.md`
- `docs/contracts/workflow-status.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Follow-Up

- MF-HIOS-032: Page/Region/FileAsset module with signed URL upload
- MF-HIOS-033: Task/Assignment module with requireSeriesRole middleware
- MF-HIOS-041: Client SeriesDetail connect real chapter API