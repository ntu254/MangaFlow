## Backend Folder Structure — MangaFlow

### 1. Backend Architecture

Backend sử dụng kiến trúc:

Express.js + TypeScript

\+ Modular Monolith

\+ Domain Driven Modules

\+ Repository-Service-Controller Pattern

Mục tiêu:

- Mỗi domain nghiệp vụ nằm trong một module riêng.

- Module có model, route, controller, service, repository, validation, type riêng.

- Business logic nằm trong service.

- Database query nằm trong repository.

- Controller chỉ nhận request, gọi service, trả response.

- Middleware dùng chung đặt trong shared/.

- Tích hợp bên ngoài như database, storage, JWT + Google OAuth, AI service đặt trong infrastructure/.

## 2. Root Backend Structure

server/

│

├── src/

│ ├── app.ts

│ ├── server.ts

│ │

│ ├── config/

│ │ ├── env.config.ts

│ │ ├── cors.config.ts

│ │ ├── jwt.config.ts

│ │ ├── database.config.ts

│ │ ├── storage.config.ts

│ │ └── ai.config.ts

│ │

│ ├── modules/

│ │ ├── auth/

│ │ ├── user/

│ │ ├── series/

│ │ ├── manuscript/

│ │ ├── chapter/

│ │ ├── page/

│ │ ├── file/

│ │ ├── region/

│ │ ├── annotation/

│ │ ├── task/

│ │ ├── submission/

│ │ ├── comment/

│ │ ├── review/

│ │ ├── board/

│ │ ├── publication/

│ │ ├── ranking/

│ │ ├── payroll/

│ │ ├── ai/

│ │ ├── notification/

│ │ ├── dashboard/

│ │ ├── search/

│ │ ├── audit/

│ │ ├── storage/

│ │ └── health/

│ │

│ ├── infrastructure/

│ │ ├── database/

│ │ ├── google/

│ │ ├── storage/

│ │ ├── ai/

│ │ ├── image/

│ │ └── logger/

│ │

│ ├── shared/

│ │ ├── constants/

│ │ ├── middleware/

│ │ ├── errors/

│ │ ├── utils/

│ │ ├── validators/

│ │ ├── types/

│ │ ├── helpers/

│ │ └── responses/

│ │

│ └── routes/

│ └── index.ts

│

├── uploads/

│ └── .gitkeep

│

├── scripts/

│ ├── seed.ts

│ ├── clear-db.ts

│ └── create-admin.ts

│

├── tests/

│ ├── unit/

│ └── integration/

│

├── package.json

├── tsconfig.json

├── .env

├── .env.example

└── README.md

## 3. Standard Module Structure

Mỗi module nên theo format thống nhất:

module-name/

│

├── module-name.model.ts

├── module-name.routes.ts

├── module-name.controller.ts

├── module-name.service.ts

├── module-name.repository.ts

├── module-name.validation.ts

├── module-name.types.ts

├── module-name.constant.ts

└── index.ts

### 3.1. File Responsibility

| **File**         | **Trách nhiệm**                          |
|------------------|------------------------------------------|
| \*.model.ts      | Mongoose schema/model                    |
| \*.routes.ts     | Khai báo Express routes                  |
| \*.controller.ts | Nhận request, gọi service, trả response  |
| \*.service.ts    | Business logic                           |
| \*.repository.ts | Database query                           |
| \*.validation.ts | Validate request body/query/params       |
| \*.types.ts      | TypeScript interfaces/types riêng module |
| \*.constant.ts   | Enum/constant riêng module               |
| index.ts         | Export route/service/model nếu cần       |

### 3.2. Example Standard Module

task/

│

├── task.model.ts

├── task.routes.ts

├── task.controller.ts

├── task.service.ts

├── task.repository.ts

├── task.validation.ts

├── task.types.ts

├── task.constant.ts

└── index.ts

## 4. Application Entry Files

### 4.1. src/server.ts

Chạy server.

server.ts

Trách nhiệm:

- Load env.

- Connect database.

- Start Express server.

- Handle graceful shutdown.

### 4.2. src/app.ts

Tạo Express app.

Trách nhiệm:

- Setup CORS.

- Setup JSON parser.

- Setup cookie parser nếu cần.

- Setup route root /api.

- Setup global error handler.

- Setup not-found handler.

### 4.3. src/routes/index.ts

Register tất cả module routes.

import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes";

import userRoutes from "../modules/user/user.routes";

import seriesRoutes from "../modules/series/series.routes";

import manuscriptRoutes from "../modules/manuscript/manuscript.routes";

import chapterRoutes from "../modules/chapter/chapter.routes";

import pageRoutes from "../modules/page/page.routes";

import taskRoutes from "../modules/task/task.routes";

import submissionRoutes from "../modules/submission/submission.routes";

import commentRoutes from "../modules/comment/comment.routes";

import boardRoutes from "../modules/board/board.routes";

import rankingRoutes from "../modules/ranking/ranking.routes";

import payrollRoutes from "../modules/payroll/payroll.routes";

import aiRoutes from "../modules/ai/ai.routes";

import notificationRoutes from "../modules/notification/notification.routes";

import dashboardRoutes from "../modules/dashboard/dashboard.routes";

import healthRoutes from "../modules/health/health.routes";

const router = Router();

router.use("/auth", authRoutes);

router.use("/users", userRoutes);

router.use("/series", seriesRoutes);

router.use("/manuscripts", manuscriptRoutes);

router.use("/chapters", chapterRoutes);

router.use("/pages", pageRoutes);

router.use("/tasks", taskRoutes);

router.use("/submissions", submissionRoutes);

router.use("/comments", commentRoutes);

router.use("/board", boardRoutes);

router.use("/rankings", rankingRoutes);

router.use("/payroll", payrollRoutes);

router.use("/ai", aiRoutes);

router.use("/notifications", notificationRoutes);

router.use("/dashboard", dashboardRoutes);

router.use("/health", healthRoutes);

export default router;

## 5. Config Folder

config/

│

├── env.config.ts

├── cors.config.ts

├── jwt.config.ts

├── database.config.ts

├── storage.config.ts

└── ai.config.ts

### 5.1. env.config.ts

Trách nhiệm:

- Đọc .env.

- Validate biến môi trường bắt buộc.

- Export config dùng toàn app.

Biến chính:

NODE_ENV=

PORT=

CLIENT_URL=

MONGODB_URI=

JWT_SECRET=

GOOGLE_CLIENT_ID=

GOOGLE_CLIENT_SECRET=

APP_URL=

S3_PROVIDER=

S3_ENDPOINT=

S3_REGION=

S3_BUCKET=

S3_ACCESS_KEY=

S3_SECRET_KEY=

S3_FORCE_PATH_STYLE=

AI_SERVICE_URL=

AI_TIMEOUT_MS=

MAX_IMAGE_SIZE_MB=

MAX_PAGE_UPLOAD=

### 5.2. cors.config.ts

Trách nhiệm:

- Config CORS cho Vercel frontend.

- Cho phép local dev.

### 5.3. database.config.ts

Trách nhiệm:

- MongoDB connection options.

- Database name nếu cần.

### 5.4. storage.config.ts

Trách nhiệm:

- Cloudflare R2 config.

- MinIO config local.

- S3-compatible setup.

### 5.5. ai.config.ts

Trách nhiệm:

- AI service URL.

- AI timeout.

- Max image resize config.

## 6. Infrastructure Folder

infrastructure/

│

├── database/

│ ├── mongoose.connection.ts

│ └── database.health.ts

│

├── jwt/

│ ├── jwt.client.ts

│ ├── jwt.middleware.ts

│ └── jwt.types.ts

│

├── google/

│ ├── google.client.ts

│ ├── google.types.ts

│ └── google.verifier.ts

│

├── storage/

│ ├── s3.client.ts

│ ├── storage.service.ts

│ ├── storage.types.ts

│ ├── storage-key.util.ts

│ └── signed-url.service.ts

│

├── ai/

│ ├── ai.client.ts

│ ├── ai.service.ts

│ ├── ai.types.ts

│ └── ai.mapper.ts

│

├── image/

│ ├── image.service.ts

│ ├── image-resize.service.ts

│ ├── image-metadata.service.ts

│ └── image.types.ts

│

└── logger/

├── logger.ts

└── request-logger.middleware.ts

### 6.1. Database Infrastructure

#### mongoose.connection.ts

Trách nhiệm:

- Connect MongoDB Atlas.

- Handle connection events.

- Export connectDatabase().

#### database.health.ts

Trách nhiệm:

- Check database status.

- Dùng cho /api/health/database.

### 6.2. JWT Infrastructure

#### jwt.client.ts

Trách nhiệm:

- Tạo JWT sign/verify utilities.

- Sign access and refresh tokens.

#### jwt.middleware.ts

Trách nhiệm:

- Verify JWT access token.

- Attach user info vào request.

- Dùng trong requireAuth.

### 6.3. Google OAuth Infrastructure

#### google.client.ts

Trách nhiệm:

- Validate Google OAuth ID token.

- Extract `sub`, email, name, avatar.

#### google.verifier.ts

Trách nhiệm:

- Server-side token exchange with Google.

- Verify token signature and audience.

### 6.4. Storage Infrastructure

#### s3.client.ts

Trách nhiệm:

- Tạo S3 client.

- Dùng chung cho Cloudflare R2 và MinIO.

#### storage.service.ts

Functions:

uploadFile()

deleteFile()

getSignedUrl()

copyFile()

fileExists()

#### storage-key.util.ts

Generate file key theo format:

series/{seriesId}/cover/{fileName}

series/{seriesId}/manuscripts/v{version}/{fileName}

chapters/{chapterId}/pages/v{version}/{fileName}

tasks/{taskId}/submissions/v{version}/{fileName}

ai-output/pages/{pageId}/{fileName}

#### signed-url.service.ts

Trách nhiệm:

- Tạo signed URL cho private file.

- Default expire: 15 phút.

### 6.4. AI Infrastructure

#### ai.client.ts

Trách nhiệm:

- Tạo Axios instance gọi FastAPI.

- Timeout 60 giây.

- Handle error.

#### ai.service.ts

Functions:

detectBubble()

whitenBubble()

processBubble()

batchProcessBubble()

#### ai.mapper.ts

Trách nhiệm:

- Convert AI bbox pixel sang normalized coordinate.

- Convert AI response sang Region model data.

### 6.5. Image Infrastructure

#### image.service.ts

Trách nhiệm:

- Orchestrate image processing.

#### image-resize.service.ts

Resize rules:

Original: no change

AI copy: max width 2048px

Preview: max width 1600px

Thumbnail: width 300px

#### image-metadata.service.ts

Trách nhiệm:

- Lấy width/height.

- Lấy mime type.

- Validate file.

## 7. Shared Folder

shared/

│

├── constants/

│ ├── roles.constant.ts

│ ├── status.constant.ts

│ ├── task.constant.ts

│ ├── file.constant.ts

│ ├── ranking.constant.ts

│ └── error-code.constant.ts

│

├── middleware/

│ ├── require-auth.middleware.ts

│ ├── require-role.middleware.ts

│ ├── require-series-role.middleware.ts

│ ├── validate-request.middleware.ts

│ ├── upload.middleware.ts

│ ├── error-handler.middleware.ts

│ └── not-found.middleware.ts

│

├── errors/

│ ├── AppError.ts

│ ├── BadRequestError.ts

│ ├── UnauthorizedError.ts

│ ├── ForbiddenError.ts

│ ├── NotFoundError.ts

│ └── ValidationError.ts

│

├── responses/

│ ├── success.response.ts

│ ├── error.response.ts

│ └── pagination.response.ts

│

├── utils/

│ ├── async-handler.ts

│ ├── generate-slug.ts

│ ├── calculate-pagination.ts

│ ├── date.util.ts

│ ├── normalize-coordinate.ts

│ └── safe-json.ts

│

├── validators/

│ ├── object-id.validator.ts

│ ├── pagination.validator.ts

│ ├── file.validator.ts

│ └── common.validator.ts

│

├── types/

│ ├── express.d.ts

│ ├── request.types.ts

│ ├── api-response.types.ts

│ └── mongoose.types.ts

│

└── helpers/

├── permission.helper.ts

├── status-transition.helper.ts

└── ownership.helper.ts

## 8. Auth Module

modules/auth/

│

├── auth.routes.ts

├── auth.controller.ts

├── auth.service.ts

├── auth.validation.ts

├── auth.types.ts

└── index.ts

### 8.1. Responsibility

Auth module xử lý:

- Sync Google OAuth user vào MongoDB.

- Lấy current user.

- Complete onboarding.

- Lấy permission của user.

### 8.2. Routes

GET /api/auth/me

POST /api/auth/sync-user

POST /api/auth/complete-onboarding

GET /api/auth/permissions

### 8.3. Service Functions

getCurrentUser()

syncUserFromProfile()

completeOnboarding()

getUserPermissions()

### 8.4. Ghi chú

Auth không lưu password vì login dùng Google OAuth.

## 9. User Module

modules/user/

│

├── user.model.ts

├── user.routes.ts

├── user.controller.ts

├── user.service.ts

├── user.repository.ts

├── user.validation.ts

├── user.types.ts

└── index.ts

### 9.1. Responsibility

User module xử lý:

- Local user profile.

- System role.

- User status.

- User activity.

- User memberships.

### 9.2. Routes

GET /api/users

GET /api/users/:userId

PATCH /api/users/:userId

PATCH /api/users/:userId/role

PATCH /api/users/:userId/status

GET /api/users/:userId/series-memberships

GET /api/users/:userId/tasks

GET /api/users/:userId/activity

### 9.3. Service Functions

getUsers()

getUserById()

updateProfile()

updateUserRole()

updateUserStatus()

getUserSeriesMemberships()

getUserTasks()

## 10. Series Module

modules/series/

│

├── series.model.ts

├── series-member.model.ts

├── series.routes.ts

├── series-member.routes.ts

├── series.controller.ts

├── series-member.controller.ts

├── series.service.ts

├── series-member.service.ts

├── series.repository.ts

├── series-member.repository.ts

├── series.validation.ts

├── series-member.validation.ts

├── series.types.ts

├── series.constant.ts

└── index.ts

### 10.1. Responsibility

Series module xử lý:

- CRUD series.

- Series lifecycle.

- Series member.

- Owner Mangaka.

- Co-Mangaka.

- Assistant invitation.

- Editor assignment.

- Series progress.

### 10.2. Routes

GET /api/series

POST /api/series

GET /api/series/:seriesId

PATCH /api/series/:seriesId

DELETE /api/series/:seriesId

POST /api/series/:seriesId/submit

POST /api/series/:seriesId/assign-editor

POST /api/series/:seriesId/submit-to-board

POST /api/series/:seriesId/cancel

POST /api/series/:seriesId/mark-at-risk

GET /api/series/:seriesId/summary

GET /api/series/:seriesId/progress

GET /api/series/:seriesId/members

POST /api/series/:seriesId/members/invite

PATCH /api/series/:seriesId/members/:memberId/role

PATCH /api/series/:seriesId/members/:memberId/status

DELETE /api/series/:seriesId/members/:memberId

POST /api/series/:seriesId/members/accept-invite

POST /api/series/:seriesId/members/decline-invite

### 10.3. Service Functions

createSeries()

getSeriesList()

getSeriesDetail()

updateSeries()

deleteDraftSeries()

submitSeries()

assignEditor()

submitSeriesToBoard()

cancelSeries()

markSeriesAtRisk()

getSeriesSummary()

getSeriesProgress()

inviteSeriesMember()

acceptInvite()

declineInvite()

updateSeriesMemberRole()

removeSeriesMember()

### 10.4. Business Rules

\- Khi tạo Series, tự tạo SeriesMember OWNER_MANGAKA.

\- Một Series chỉ có một OWNER_MANGAKA.

\- Assistant không thuộc studio cố định.

\- Assistant có thể nhận task từ nhiều Series.

\- Editor được assign theo Series.

## 11. Manuscript Module

modules/manuscript/

│

├── manuscript.model.ts

├── manuscript.routes.ts

├── manuscript.controller.ts

├── manuscript.service.ts

├── manuscript.repository.ts

├── manuscript.validation.ts

├── manuscript.types.ts

└── index.ts

### 11.1. Responsibility

Manuscript module xử lý:

- Upload manuscript PDF/images.

- Major versioning.

- Submit manuscript.

- Editor review.

- Request revision.

- Approve manuscript.

### 11.2. Routes

GET /api/series/:seriesId/manuscripts

POST /api/series/:seriesId/manuscripts

GET /api/manuscripts/:manuscriptId

PATCH /api/manuscripts/:manuscriptId

DELETE /api/manuscripts/:manuscriptId

POST /api/manuscripts/:manuscriptId/submit

POST /api/manuscripts/:manuscriptId/request-revision

POST /api/manuscripts/:manuscriptId/approve

GET /api/manuscripts/:manuscriptId/versions

POST /api/manuscripts/:manuscriptId/versions

### 11.3. Service Functions

createManuscript()

uploadManuscriptFiles()

getManuscriptById()

getSeriesManuscripts()

updateManuscript()

deleteDraftManuscript()

submitManuscript()

requestManuscriptRevision()

approveManuscript()

uploadManuscriptVersion()

getManuscriptVersions()

### 11.4. Business Rules

\- Manuscript sơ bộ hỗ trợ PDF + Images.

\- Manuscript phải qua Editor trước khi giao task.

\- Lưu original file.

\- Có major versioning.

## 12. Chapter Module

modules/chapter/

│

├── chapter.model.ts

├── chapter.routes.ts

├── chapter.controller.ts

├── chapter.service.ts

├── chapter.repository.ts

├── chapter.validation.ts

├── chapter.types.ts

└── index.ts

### 12.1. Responsibility

Chapter module xử lý:

- Create chapter.

- Update chapter.

- Submit chapter to editor.

- Editor approve/request revision.

- Progress.

- Publish readiness.

### 12.2. Routes

GET /api/series/:seriesId/chapters

POST /api/series/:seriesId/chapters

GET /api/chapters/:chapterId

PATCH /api/chapters/:chapterId

DELETE /api/chapters/:chapterId

POST /api/chapters/:chapterId/submit-to-editor

POST /api/chapters/:chapterId/request-revision

POST /api/chapters/:chapterId/approve

GET /api/chapters/:chapterId/progress

GET /api/chapters/:chapterId/readiness

### 12.3. Service Functions

createChapter()

getChapterById()

getSeriesChapters()

updateChapter()

deleteDraftChapter()

submitChapterToEditor()

requestChapterRevision()

approveChapter()

getChapterProgress()

checkChapterReadiness()

### 12.4. Business Rules

\- chapterNumber unique trong một series.

\- Không publish nếu còn comment chưa resolved.

\- Không publish nếu page chưa Editor Approved.

## 13. Page Module

modules/page/

│

├── page.model.ts

├── page.routes.ts

├── page.controller.ts

├── page.service.ts

├── page.repository.ts

├── page.validation.ts

├── page.types.ts

├── page.constant.ts

└── index.ts

### 13.1. Responsibility

Page module xử lý:

- Upload pages.

- Page status.

- Page versioning.

- Page compare.

- Mangaka approval.

- Editor approval.

- Page readiness.

### 13.2. Routes

GET /api/chapters/:chapterId/pages

POST /api/chapters/:chapterId/pages

GET /api/pages/:pageId

PATCH /api/pages/:pageId

DELETE /api/pages/:pageId

POST /api/pages/:pageId/reorder

POST /api/pages/:pageId/submit

POST /api/pages/:pageId/mangaka-approve

POST /api/pages/:pageId/editor-approve

POST /api/pages/:pageId/request-revision

GET /api/pages/:pageId/versions

POST /api/pages/:pageId/versions

GET /api/pages/:pageId/compare

### 13.3. Service Functions

uploadPages()

getChapterPages()

getPageById()

updatePage()

deletePage()

reorderPage()

submitPage()

mangakaApprovePage()

editorApprovePage()

requestPageRevision()

getPageVersions()

uploadPageVersion()

comparePageVersions()

### 13.4. Business Rules

\- Max 50 pages per upload.

\- Max 50MB/image.

\- Original không thay đổi.

\- AI copy max 2048px width.

\- Preview max 1600px width.

\- Thumbnail 300px width.

\- Page có major versioning.

## 14. File Module

modules/file/

│

├── file-asset.model.ts

├── file.routes.ts

├── file.controller.ts

├── file.service.ts

├── file.repository.ts

├── file.validation.ts

├── file.types.ts

└── index.ts

### 14.1. Responsibility

File module xử lý:

- File metadata.

- Signed URL.

- File ownership.

- Regenerate preview/thumbnail.

- Soft delete.

### 14.2. Routes

GET /api/files/:fileId

GET /api/files/:fileId/signed-url

DELETE /api/files/:fileId

GET /api/files/owner/:ownerType/:ownerId

POST /api/files/:fileId/regenerate-preview

POST /api/files/:fileId/regenerate-thumbnail

### 14.3. Service Functions

createFileAsset()

getFileById()

getFilesByOwner()

getSignedFileUrl()

deleteFileAsset()

regeneratePreview()

regenerateThumbnail()

## 15. Region Module

modules/region/

│

├── region.model.ts

├── region.routes.ts

├── region.controller.ts

├── region.service.ts

├── region.repository.ts

├── region.validation.ts

├── region.types.ts

└── index.ts

### 15.1. Responsibility

Region module xử lý:

- Manual region.

- AI region.

- Normalized coordinate.

- Region linked task.

- Create task from region.

### 15.2. Routes

GET /api/pages/:pageId/regions

POST /api/pages/:pageId/regions

GET /api/regions/:regionId

PATCH /api/regions/:regionId

DELETE /api/regions/:regionId

POST /api/regions/:regionId/create-task

### 15.3. Service Functions

createRegion()

getPageRegions()

getRegionById()

updateRegion()

deleteRegion()

createTaskFromRegion()

### 15.4. Business Rules

\- MVP chỉ hỗ trợ RECTANGLE.

\- Coordinate lưu normalized 0–1.

\- AI output cũng convert sang normalized coordinate.

## 16. Annotation Module

modules/annotation/

│

├── annotation.model.ts

├── annotation.routes.ts

├── annotation.controller.ts

├── annotation.service.ts

├── annotation.repository.ts

├── annotation.validation.ts

├── annotation.types.ts

└── index.ts

### 16.1. Responsibility

Annotation module xử lý:

- Rectangle annotation.

- Annotation linked comment.

- Annotation trên page review.

- Editor/Mangaka comment point.

### 16.2. Routes

GET /api/pages/:pageId/annotations

POST /api/pages/:pageId/annotations

GET /api/annotations/:annotationId

PATCH /api/annotations/:annotationId

DELETE /api/annotations/:annotationId

POST /api/annotations/:annotationId/comment

### 16.3. Service Functions

createAnnotation()

getPageAnnotations()

getAnnotationById()

updateAnnotation()

deleteAnnotation()

createCommentFromAnnotation()

## 17. Task Module

modules/task/

│

├── task.model.ts

├── task.routes.ts

├── task.controller.ts

├── task.service.ts

├── task.repository.ts

├── task.validation.ts

├── task.types.ts

├── task.constant.ts

└── index.ts

### 17.1. Responsibility

Task module xử lý:

- Create task.

- Assign assistant.

- Task status.

- Task deadline.

- Task revision round.

- Task approval state.

- Link task to payroll.

### 17.2. Routes

GET /api/tasks

POST /api/tasks

GET /api/tasks/:taskId

PATCH /api/tasks/:taskId

DELETE /api/tasks/:taskId

POST /api/tasks/:taskId/start

POST /api/tasks/:taskId/submit

POST /api/tasks/:taskId/request-revision

POST /api/tasks/:taskId/mangaka-approve

POST /api/tasks/:taskId/editor-approve

POST /api/tasks/:taskId/reject

GET /api/tasks/:taskId/history

GET /api/tasks/:taskId/comments

### 17.3. Service Functions

createTask()

getTasks()

getTaskById()

updateTask()

deleteTask()

startTask()

submitTask()

requestTaskRevision()

mangakaApproveTask()

editorApproveTask()

rejectTask()

getTaskHistory()

getTaskComments()

### 17.4. Business Rules

\- Assistant chỉ xem task được giao.

\- Task có thể có nhiều submission version.

\- Reject task thì payment = 0.

\- Editor approve là final approval.

\- Revision round tăng khi request revision.

## 18. Submission Module

modules/submission/

│

├── submission.model.ts

├── submission.routes.ts

├── submission.controller.ts

├── submission.service.ts

├── submission.repository.ts

├── submission.validation.ts

├── submission.types.ts

└── index.ts

### 18.1. Responsibility

Submission module xử lý:

- Assistant submit file.

- Submission versioning.

- Mangaka review.

- Editor final approve.

- Revision requested.

- Reject submission.

### 18.2. Routes

GET /api/submissions

GET /api/tasks/:taskId/submissions

POST /api/tasks/:taskId/submissions

GET /api/submissions/:submissionId

POST /api/submissions/:submissionId/mangaka-approve

POST /api/submissions/:submissionId/editor-approve

POST /api/submissions/:submissionId/request-revision

POST /api/submissions/:submissionId/reject

GET /api/submissions/:submissionId/versions

GET /api/submissions/:submissionId/comments

### 18.3. Service Functions

createSubmission()

getSubmissions()

getTaskSubmissions()

getSubmissionById()

mangakaApproveSubmission()

editorApproveSubmission()

requestSubmissionRevision()

rejectSubmission()

getSubmissionVersions()

getSubmissionComments()

### 18.4. Business Rules

\- Assistant không sửa submission cũ sau submit.

\- Nếu revision requested thì tạo version mới.

\- Round 1 revision free.

\- Round 2+ configurable.

## 19. Comment Module

modules/comment/

│

├── comment.model.ts

├── comment.routes.ts

├── comment.controller.ts

├── comment.service.ts

├── comment.repository.ts

├── comment.validation.ts

├── comment.types.ts

├── comment.constant.ts

└── index.ts

### 19.1. Responsibility

Comment module xử lý:

- Comment theo target.

- Comment state machine.

- Mark fixed.

- Verify fixed.

- Resolve officially.

- Reopen.

### 19.2. Routes

GET /api/comments

POST /api/comments

GET /api/comments/:commentId

PATCH /api/comments/:commentId

DELETE /api/comments/:commentId

POST /api/comments/:commentId/mark-fixed

POST /api/comments/:commentId/verify-fixed

POST /api/comments/:commentId/resolve

POST /api/comments/:commentId/reopen

GET /api/comments/target/:targetType/:targetId

### 19.3. Service Functions

createComment()

getComments()

getCommentById()

updateComment()

deleteComment()

markCommentFixed()

verifyCommentFixed()

resolveComment()

reopenComment()

getTargetComments()

hasUnresolvedComments()

### 19.4. Business Rules

OPEN

↓

FIXED_BY_ASSISTANT

↓

VERIFIED_BY_MANGAKA

↓

RESOLVED_BY_EDITOR

\- Assistant mark fixed.

\- Mangaka verify fixed.

\- Editor resolve.

\- Editor reopen.

\- Không publish nếu còn comment chưa resolved.

## 20. Review Module

modules/review/

│

├── review.model.ts

├── review.routes.ts

├── review.controller.ts

├── review.service.ts

├── review.repository.ts

├── review.validation.ts

├── review.types.ts

└── index.ts

### 20.1. Responsibility

Review module xử lý:

- Review action chung.

- Review manuscript.

- Review chapter.

- Review page.

- Review task.

- Review submission.

### 20.2. Routes

GET /api/reviews

POST /api/reviews

GET /api/reviews/:reviewId

PATCH /api/reviews/:reviewId

DELETE /api/reviews/:reviewId

GET /api/reviews/target/:targetType/:targetId

### 20.3. Service Functions

createReview()

getReviews()

getReviewById()

updateReview()

deleteReview()

getTargetReviews()

## 21. Board Module

modules/board/

│

├── board-member.model.ts

├── board-vote.model.ts

├── board-decision.model.ts

│

├── board.routes.ts

├── board-member.routes.ts

├── board-vote.routes.ts

├── board-decision.routes.ts

│

├── board-member.controller.ts

├── board-vote.controller.ts

├── board-decision.controller.ts

│

├── board-member.service.ts

├── board-vote.service.ts

├── board-decision.service.ts

│

├── board-member.repository.ts

├── board-vote.repository.ts

├── board-decision.repository.ts

│

├── board.validation.ts

├── board.types.ts

├── board.constant.ts

└── index.ts

### 21.1. Responsibility

Board module xử lý:

- Board members.

- Board Chair.

- Board voting.

- Majority decision.

- Tie-break.

- Cancel/continue series decision.

### 21.2. Routes

GET /api/board/members

POST /api/board/members

PATCH /api/board/members/:boardMemberId

DELETE /api/board/members/:boardMemberId

POST /api/board/members/:boardMemberId/set-chair

GET /api/board/chair

GET /api/board/votes

GET /api/board/votes/my

POST /api/series/:seriesId/votes

PATCH /api/series/:seriesId/votes/:voteId

DELETE /api/series/:seriesId/votes/:voteId

GET /api/series/:seriesId/votes

GET /api/series/:seriesId/votes/summary

GET /api/board/decisions

GET /api/board/decisions/:decisionId

POST /api/series/:seriesId/decisions/finalize

POST /api/series/:seriesId/decisions/tie-break

GET /api/series/:seriesId/decisions

### 21.3. Service Functions

createBoardMember()

setBoardChair()

getBoardMembers()

getBoardChair()

castVote()

updateVote()

deleteVote()

getSeriesVotes()

getVoteSummary()

finalizeDecision()

tieBreakDecision()

getBoardDecisions()

getSeriesDecisionHistory()

### 21.4. Business Rules

\- Board có 3–7 active members.

\- Chỉ có 1 BOARD_CHAIR.

\- Majority vote wins.

\- Nếu tie, BOARD_CHAIR decides.

\- Admin không quyết định cuối.

## 22. Publication Module

modules/publication/

│

├── publication.model.ts

├── publication.routes.ts

├── publication.controller.ts

├── publication.service.ts

├── publication.repository.ts

├── publication.validation.ts

├── publication.types.ts

└── index.ts

### 22.1. Responsibility

Publication module xử lý:

- Weekly/monthly publication.

- Publication plan.

- Publish/delay/cancel.

- Check readiness.

### 22.2. Routes

GET /api/publications

POST /api/publications

GET /api/publications/:publicationId

PATCH /api/publications/:publicationId

DELETE /api/publications/:publicationId

POST /api/publications/:publicationId/publish

POST /api/publications/:publicationId/delay

POST /api/publications/:publicationId/cancel

GET /api/series/:seriesId/publications

GET /api/chapters/:chapterId/publication-readiness

### 22.3. Service Functions

createPublication()

getPublications()

getPublicationById()

updatePublication()

deletePublication()

publishChapter()

delayPublication()

cancelPublication()

getSeriesPublications()

checkPublicationReadiness()

### 22.4. Business Rules

\- Publication type: WEEKLY hoặc MONTHLY.

\- Không publish nếu comment chưa resolved.

\- Không publish nếu chapter chưa ready.

\- Series cancel là Board decision thủ công.

## 23. Ranking Module

modules/ranking/

│

├── ranking.model.ts

├── ranking.routes.ts

├── ranking.controller.ts

├── ranking.service.ts

├── ranking.repository.ts

├── ranking.validation.ts

├── ranking.types.ts

├── ranking.constant.ts

└── index.ts

### 23.1. Responsibility

Ranking module xử lý:

- Import ranking data.

- Calculate final score.

- Rank series.

- Ranking history.

- Warning/At-risk status.

### 23.2. Routes

GET /api/rankings

POST /api/rankings/import

POST /api/rankings/calculate

GET /api/rankings/:rankingId

GET /api/series/:seriesId/rankings

GET /api/rankings/periods

GET /api/rankings/periods/:period

POST /api/rankings/:rankingId/mark-warning

POST /api/rankings/:rankingId/mark-at-risk

### 23.3. Service Functions

importRankingData()

calculateRanking()

calculateFinalScore()

getRankingTable()

getRankingByPeriod()

getSeriesRankingHistory()

markWarning()

markAtRisk()

### 23.4. Business Rules

readerScore scale: 1–10

normalizedReaderScore = readerScore \* 10

finalScore = voteCount \* 0.7 + normalizedReaderScore \* 0.3

## 24. Payroll Module

modules/payroll/

│

├── task-rate.model.ts

├── assistant-earning.model.ts

│

├── payroll.routes.ts

├── task-rate.routes.ts

│

├── payroll.controller.ts

├── task-rate.controller.ts

│

├── payroll.service.ts

├── task-rate.service.ts

│

├── payroll.repository.ts

├── task-rate.repository.ts

│

├── payroll.validation.ts

├── task-rate.validation.ts

│

├── payroll.types.ts

├── payroll.constant.ts

└── index.ts

### 24.1. Responsibility

Payroll module xử lý:

- Task type rate.

- Assistant earning.

- Deadline bonus/penalty.

- Revision fee.

- Mangaka confirm payout.

- Tracking only, không payment thật.

### 24.2. Routes

GET /api/payroll/me

GET /api/payroll

GET /api/payroll/series/:seriesId

GET /api/payroll/assistants/:assistantId

GET /api/payroll/monthly

POST /api/payroll/tasks/:taskId/calculate

POST /api/payroll/tasks/:taskId/confirm

POST /api/payroll/monthly/confirm

POST /api/payroll/:earningId/mark-paid

POST /api/payroll/:earningId/cancel

GET /api/task-rates

POST /api/task-rates

GET /api/task-rates/:taskRateId

PATCH /api/task-rates/:taskRateId

DELETE /api/task-rates/:taskRateId

### 24.3. Service Functions

calculateTaskEarning()

confirmTaskEarning()

confirmMonthlyPayout()

markPaid()

cancelEarning()

getAssistantEarnings()

getSeriesPayroll()

getMonthlyPayroll()

createTaskRate()

updateTaskRate()

deleteTaskRate()

getTaskRates()

### 24.4. Business Rules

\- Tính theo Task.

\- Task type rate khác nhau.

\- Early ≤ 24h: +10%.

\- On time: 0%.

\- Late ≤ 24h: -5%.

\- Late \> 24h: mark LATE, no bonus.

\- Reject task: finalPayment = 0.

\- Round 1 revision free.

\- Round 2+ configurable.

\- Mangaka xác nhận payout.

\- Không tích hợp Stripe/PayPal trong MVP.

## 25. AI Module

modules/ai/

│

├── ai-result.model.ts

├── ai.routes.ts

├── ai.controller.ts

├── ai.service.ts

├── ai.repository.ts

├── ai.validation.ts

├── ai.types.ts

├── ai.constant.ts

└── index.ts

### 25.1. Responsibility

AI module là backend wrapper gọi AI FastAPI service.

Frontend không gọi AI service trực tiếp trong production.

### 25.2. Routes

GET /api/ai/health

POST /api/pages/:pageId/ai/bubble-detect

POST /api/pages/:pageId/ai/bubble-whiten

POST /api/pages/:pageId/ai/bubble-process

POST /api/chapters/:chapterId/ai/batch-bubble-detect

POST /api/chapters/:chapterId/ai/batch-bubble-process

GET /api/pages/:pageId/ai/results

DELETE /api/pages/:pageId/ai/results/:resultId

### 25.3. Service Functions

checkAiHealth()

detectPageBubbles()

whitenPageBubbles()

processPageBubbles()

batchDetectChapterBubbles()

batchProcessChapterBubbles()

getPageAiResults()

deleteAiResult()

### 25.4. Business Rules

\- AI timeout: 60 seconds.

\- AI input dùng AI copy max 2048px.

\- AI output lưu R2.

\- Base64 không lưu DB.

\- Bbox convert sang normalized region.

\- User có thể chỉnh lại region.

## 26. Notification Module

modules/notification/

│

├── notification.model.ts

├── notification.routes.ts

├── notification.controller.ts

├── notification.service.ts

├── notification.repository.ts

├── notification.validation.ts

├── notification.types.ts

├── notification.constant.ts

└── index.ts

### 26.1. Responsibility

Notification module xử lý:

- In-app notification.

- Unread count.

- Mark read.

- Clear read.

- Notification trigger helper.

### 26.2. Routes

GET /api/notifications

GET /api/notifications/unread-count

PATCH /api/notifications/:notificationId/read

PATCH /api/notifications/read-all

DELETE /api/notifications/:notificationId

DELETE /api/notifications/clear-read

### 26.3. Service Functions

createNotification()

createBulkNotifications()

getUserNotifications()

getUnreadCount()

markAsRead()

markAllAsRead()

deleteNotification()

clearReadNotifications()

### 26.4. Notification Triggers

TASK_ASSIGNED

TASK_SUBMITTED

TASK_APPROVED

REVISION_REQUESTED

EDITOR_COMMENT

BOARD_DECISION

RANKING_WARNING

PAYROLL_CONFIRMED

PUBLICATION_UPDATED

## 27. Dashboard Module

modules/dashboard/

│

├── dashboard.routes.ts

├── dashboard.controller.ts

├── dashboard.service.ts

├── dashboard.repository.ts

├── dashboard.types.ts

└── index.ts

### 27.1. Responsibility

Dashboard module trả về số liệu tổng hợp theo role.

### 27.2. Routes

GET /api/dashboard/admin

GET /api/dashboard/mangaka

GET /api/dashboard/assistant

GET /api/dashboard/editor

GET /api/dashboard/board

### 27.3. Service Functions

getAdminDashboard()

getMangakaDashboard()

getAssistantDashboard()

getEditorDashboard()

getBoardDashboard()

### 27.4. Ghi chú

Dashboard module có thể query nhiều repository khác nhau:

- SeriesRepository

- TaskRepository

- SubmissionRepository

- RankingRepository

- PayrollRepository

- CommentRepository

## 28. Search Module

modules/search/

│

├── search.routes.ts

├── search.controller.ts

├── search.service.ts

├── search.validation.ts

├── search.types.ts

└── index.ts

### 28.1. Responsibility

Search module xử lý global search theo quyền user.

### 28.2. Routes

GET /api/search

GET /api/search/series

GET /api/search/tasks

GET /api/search/users

### 28.3. Service Functions

globalSearch()

searchSeries()

searchTasks()

searchUsers()

### 28.4. Business Rules

\- Search result phải theo quyền user.

\- Assistant không search được toàn bộ series.

\- Board chỉ search summary.

## 29. Audit Module

modules/audit/

│

├── audit-log.model.ts

├── audit.routes.ts

├── audit.controller.ts

├── audit.service.ts

├── audit.repository.ts

├── audit.validation.ts

├── audit.types.ts

└── index.ts

### 29.1. Responsibility

Audit module xử lý lịch sử hành động quan trọng.

### 29.2. Routes

GET /api/audit-logs

GET /api/audit-logs/:auditLogId

GET /api/audit-logs/target/:targetType/:targetId

GET /api/audit-logs/actor/:userId

### 29.3. Service Functions

createAuditLog()

getAuditLogs()

getAuditLogById()

getLogsByTarget()

getLogsByActor()

### 29.4. Important Audit Actions

USER_ROLE_CHANGED

SERIES_CREATED

SERIES_SUBMITTED

SERIES_APPROVED

SERIES_REJECTED

SERIES_CANCELLED

BOARD_VOTED

BOARD_DECISION_FINALIZED

PAGE_UPLOADED

TASK_CREATED

TASK_SUBMITTED

TASK_APPROVED

COMMENT_RESOLVED

RANKING_IMPORTED

PAYROLL_CONFIRMED

## 30. Storage Admin Module

modules/storage/

│

├── storage.routes.ts

├── storage.controller.ts

├── storage.service.ts

├── storage.validation.ts

├── storage.types.ts

└── index.ts

### 30.1. Responsibility

Storage admin module xử lý:

- Storage usage.

- Large files.

- Orphan cleanup.

- Recalculate usage.

### 30.2. Routes

GET /api/storage/usage

GET /api/storage/files

GET /api/storage/large-files

GET /api/storage/by-owner-type

POST /api/storage/cleanup-orphans

POST /api/storage/recalculate-usage

### 30.3. Service Functions

getStorageUsage()

getStorageFiles()

getLargeFiles()

getUsageByOwnerType()

cleanupOrphanFiles()

recalculateUsage()

## 31. Health Module

modules/health/

│

├── health.routes.ts

├── health.controller.ts

├── health.service.ts

├── health.types.ts

└── index.ts

### 31.1. Responsibility

Health module kiểm tra trạng thái hệ thống.

### 31.2. Routes

GET /api/health

GET /api/health/database

GET /api/health/storage

GET /api/health/ai

GET /api/health/full

### 31.3. Service Functions

checkBackendHealth()

checkDatabaseHealth()

checkStorageHealth()

checkAiHealth()

checkFullSystemHealth()

## 32. Middleware Details

### 32.1. require-auth.middleware.ts

Trách nhiệm:

- Verify JWT access token.

- Lấy local user.

- Gắn req.user.

### 32.2. require-role.middleware.ts

Dùng cho system role:

requireRole(\["ADMIN"\]);

requireRole(\["MANGAKA", "ADMIN"\]);

### 32.3. require-series-role.middleware.ts

Dùng cho series-level role:

requireSeriesRole(\["OWNER_MANGAKA", "CO_MANGAKA"\]);

requireSeriesRole(\["EDITOR"\]);

requireSeriesRole(\["ASSISTANT"\]);

### 32.4. validate-request.middleware.ts

Dùng chung với Zod/Yup:

validateRequest(schema)

### 32.5. upload.middleware.ts

Dùng với multer:

- Validate file size.

- Validate mime type.

- Memory storage hoặc temp file.

- Max 50MB/image.

### 32.6. error-handler.middleware.ts

Chuẩn hóa lỗi:

{

"success": false,

"message": "Forbidden",

"code": "FORBIDDEN",

"details": {}

}

## 33. Response Helpers

### 33.1. success.response.ts

export function successResponse(res, data, message = "OK") {

return res.status(200).json({

success: true,

message,

data,

});

}

### 33.2. pagination.response.ts

export function paginationResponse(res, data, pagination) {

return res.status(200).json({

success: true,

message: "OK",

data,

pagination,

});

}

### 33.3. error.response.ts

Dùng trong global error handler.

## 34. Repository Pattern Example

### 34.1. Example task.repository.ts

import { TaskModel } from "./task.model";

export const TaskRepository = {

create(data: any) {

return TaskModel.create(data);

},

findById(taskId: string) {

return TaskModel.findById(taskId);

},

findAssignedToUser(userId: string) {

return TaskModel.find({ assignedTo: userId }).sort({ dueDate: 1 });

},

findBySeries(seriesId: string) {

return TaskModel.find({ seriesId }).sort({ createdAt: -1 });

},

updateById(taskId: string, data: any) {

return TaskModel.findByIdAndUpdate(taskId, data, { new: true });

},

};

## 35. Service Pattern Example

### 35.1. Example task.service.ts

import { TaskRepository } from "./task.repository";

export const TaskService = {

async createTask(input: any, currentUser: any) {

// 1. Check permission

// 2. Check page/region exists

// 3. Check assigned assistant is valid

// 4. Get task rate

// 5. Create task

// 6. Notify assistant

// 7. Audit log

return TaskRepository.create({

...input,

assignedBy: currentUser.\_id,

status: "TODO",

revisionRound: 0,

});

},

};

## 36. Controller Pattern Example

### 36.1. Example task.controller.ts

import { Request, Response } from "express";

import { TaskService } from "./task.service";

import { successResponse } from "../../shared/responses/success.response";

export const TaskController = {

async createTask(req: Request, res: Response) {

const task = await TaskService.createTask(req.body, req.user);

return successResponse(res, task, "Task created successfully");

},

};

## 37. Route Pattern Example

### 37.1. Example task.routes.ts

import { Router } from "express";

import { TaskController } from "./task.controller";

import { requireAuth } from "../../shared/middleware/require-auth.middleware";

import { requireRole } from "../../shared/middleware/require-role.middleware";

import { validateRequest } from "../../shared/middleware/validate-request.middleware";

import { createTaskSchema } from "./task.validation";

const router = Router();

router.use(requireAuth);

router.get("/", TaskController.getTasks);

router.post(

"/",

requireRole(\["MANGAKA", "EDITOR", "ADMIN"\]),

validateRequest(createTaskSchema),

TaskController.createTask

);

router.get("/:taskId", TaskController.getTaskById);

router.post("/:taskId/start", TaskController.startTask);

export default router;

## 38. Module Import Rule

### 38.1. Allowed Dependency Direction

controller → service → repository → model

Allowed:

task.service.ts → notification.service.ts

task.service.ts → audit.service.ts

task.service.ts → payroll.service.ts

Avoid:

controller → repository

controller → model

repository → service

model → service

### 38.2. Cross Module Access Rule

Nếu module A cần dữ liệu module B:

A.service.ts gọi B.service.ts

Hoặc:

A.service.ts gọi B.repository.ts

Nhưng không nên query model trực tiếp từ module khác.

Không nên:

// Bad

import { UserModel } from "../user/user.model";

Nên:

// Better

import { UserRepository } from "../user/user.repository";

## 39. Recommended Backend Build Order

### Step 1 — Foundation

1\. config/

2\. infrastructure/database/

3\. shared/errors/

4\. shared/responses/

5\. shared/middleware/

6\. routes/index.ts

7\. health module

### Step 2 — Auth/User/Role

8\. user module

9\. auth module

10\. requireAuth middleware

11\. requireRole middleware

12\. series role middleware

### Step 3 — Core Manga Domain

13\. series module

14\. series-member service

15\. manuscript module

16\. chapter module

17\. page module

18\. file module

19\. storage infrastructure

20\. image infrastructure

### Step 4 — Workflow Domain

21\. region module

22\. annotation module

23\. task module

24\. submission module

25\. comment module

26\. review module

### Step 5 — Governance Domain

27\. board module

28\. publication module

29\. ranking module

### Step 6 — Supporting Domain

30\. payroll module

31\. notification module

32\. dashboard module

33\. search module

34\. audit module

35\. storage admin module

36\. ai module

## 40. Recommended Naming Convention

### 40.1. File Names

kebab-case.model.ts

kebab-case.service.ts

kebab-case.controller.ts

Examples:

series-member.model.ts

board-decision.service.ts

assistant-earning.repository.ts

### 40.2. Class/Object Names

PascalCase

Examples:

SeriesService

SeriesRepository

BoardDecisionService

AssistantEarningRepository

### 40.3. Route Path Names

kebab-case

Examples:

/api/task-rates

/api/board/decisions

/api/series/:seriesId/submit-to-board

## 41. Final Backend Module List

| **Module**   | **Priority** | **Purpose**                  |
|--------------|--------------|------------------------------|
| auth         | Must         | JWT verify, sync user        |
| user         | Must         | User profile, role           |
| series       | Must         | Series + member              |
| manuscript   | Must         | Initial manuscript           |
| chapter      | Must         | Chapter management           |
| page         | Must         | Page upload, version         |
| file         | Must         | File metadata, signed URL    |
| region       | Must         | Selected page regions        |
| annotation   | Must         | Page annotation              |
| task         | Must         | Task assignment              |
| submission   | Must         | Assistant submission         |
| comment      | Must         | Comment workflow             |
| review       | Should       | General review log           |
| board        | Must         | Board voting/decision        |
| publication  | Must         | Publish schedule             |
| ranking      | Must         | Vote + reader score          |
| payroll      | Must         | Assistant earning            |
| ai           | Should       | Bubble detection integration |
| notification | Should       | In-app notifications         |
| dashboard    | Should       | Role dashboard               |
| search       | Could        | Global search                |
| audit        | Should       | Audit trail                  |
| storage      | Could        | Admin storage monitor        |
| health       | Must         | Health check                 |
