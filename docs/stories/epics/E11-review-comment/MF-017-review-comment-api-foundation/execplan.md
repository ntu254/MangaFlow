# Execution Plan

## Step 1: Database Model
Create the Comment Mongoose schema and model at `server/src/modules/comment/comment.model.ts`. Ensure fields for `targetType`, `targetId`, optional `pageId` and `annotationId`, `createdBy`, `status`, and action logs (fixedBy, verifiedBy, resolvedBy, reopenedBy) are set up.

## Step 2: Repository & Service Layer
- Create `server/src/modules/comment/comment.repository.ts` implementing:
  - `create(commentData)`
  - `findById(id)`
  - `findByTarget(targetType, targetId)`
  - `update(id, updates)`
  - `delete(id)`
- Create `server/src/modules/comment/comment.service.ts` to manage transition workflows and validate authorization rules:
  - Verify that the calling user belongs to the target Series.
  - Implement `/mark-fixed`, `/verify-fixed`, `/resolve`, and `/reopen` methods that enforce status precondition and role rules.

## Step 3: Validation Schemas
Create `server/src/modules/comment/comment.validation.ts` using Zod to validate:
- Create request body (`targetType`, `targetId`, contextual IDs, `content`).
- Update request body (`content`).
- Reopen request body (`reason`).

## Step 4: Routing & Controller
- Create `server/src/modules/comment/comment.controller.ts` to coordinate HTTP requests, invoke the service, and map standard responses.
- Create `server/src/modules/comment/comment.routes.ts` to define the routes, attach auth middleware, and map validation guards.

## Step 5: Route Registration
Mount the comment router under `/api/comments` inside `server/src/app.ts`.
