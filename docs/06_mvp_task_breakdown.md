## MVP Task Breakdown — MangaFlow

### 1. MVP Development Goal

MVP tập trung hoàn thiện workflow chính:

Login bằng Clerk

↓

Tạo Series

↓

Upload Manuscript

↓

Editor Review

↓

Tạo Chapter + Upload Page

↓

Annotate Region

↓

Giao Task cho Assistant

↓

Assistant Submit

↓

Mangaka Review

↓

Editor Final Approval

↓

Board Vote + Ranking

↓

Payroll Tracking

## 2. MVP Epic Overview

| **Epic** | **Tên**                     | **Priority** |
|----------|-----------------------------|--------------|
| EPIC-01  | Project Setup               | Must Have    |
| EPIC-02  | Authentication & User Sync  | Must Have    |
| EPIC-03  | Role & Permission System    | Must Have    |
| EPIC-04  | Series Management           | Must Have    |
| EPIC-05  | Manuscript Management       | Must Have    |
| EPIC-06  | Chapter & Page Management   | Must Have    |
| EPIC-07  | File Upload & Cloudflare R2 | Must Have    |
| EPIC-08  | Annotation & Region         | Must Have    |
| EPIC-09  | Task Assignment             | Must Have    |
| EPIC-10  | Assistant Submission        | Must Have    |
| EPIC-11  | Review & Comment Workflow   | Must Have    |
| EPIC-12  | Editor Approval Workflow    | Must Have    |
| EPIC-13  | Board Voting                | Must Have    |
| EPIC-14  | Ranking                     | Must Have    |
| EPIC-15  | Payroll Tracking            | Must Have    |
| EPIC-16  | AI Bubble Integration       | Should Have  |
| EPIC-17  | Notification                | Should Have  |
| EPIC-18  | Dashboard                   | Should Have  |
| EPIC-19  | Deployment                  | Must Have    |
| EPIC-20  | Seed Data & Demo Flow       | Must Have    |

## 3. EPIC-01 — Project Setup

### Goal

Tạo project structure chuẩn cho frontend, backend, AI service và docs.

### Backend Tasks

#### TASK-01.1 — Create backend Express TypeScript project

**Priority:** Must Have

Checklist:

- Init server/.

- Install Express.

- Install TypeScript.

- Setup tsconfig.json.

- Setup nodemon hoặc tsx.

- Setup src/app.ts.

- Setup src/server.ts.

- Setup basic health route.

Acceptance Criteria:

- Chạy được backend bằng:

npm run dev

- API health hoạt động:

GET /api/health

#### TASK-01.2 — Setup backend modular folder structure

**Priority:** Must Have

Create structure:

server/

└── src/

├── modules/

│ ├── auth/

│ ├── user/

│ ├── series/

│ ├── manuscript/

│ ├── chapter/

│ ├── page/

│ ├── region/

│ ├── task/

│ ├── submission/

│ ├── comment/

│ ├── board/

│ ├── ranking/

│ ├── payroll/

│ ├── notification/

│ └── dashboard/

│

├── shared/

│ ├── middleware/

│ ├── utils/

│ ├── constants/

│ ├── errors/

│ └── types/

│

├── infrastructure/

│ ├── database/

│ ├── storage/

│ ├── clerk/

│ └── ai/

│

└── config/

Acceptance Criteria:

- Mỗi module có structure thống nhất:

module/

├── module.model.ts

├── module.routes.ts

├── module.controller.ts

├── module.service.ts

├── module.repository.ts

└── module.validation.ts

### Frontend Tasks

#### TASK-01.3 — Create React Vite client

**Priority:** Must Have

Checklist:

- Init client/.

- Install React Router.

- Install Tailwind CSS.

- Install ShadCN/ui.

- Setup aliases.

- Setup global layout.

Acceptance Criteria:

- Chạy được frontend bằng:

npm run dev

- ShadCN button/card hoạt động.

#### TASK-01.4 — Setup frontend feature-based structure

**Priority:** Must Have

Create structure:

client/src/

├── app/

│ ├── App.tsx

│ ├── router.tsx

│ ├── providers.tsx

│ └── guards/

│

├── features/

│ ├── auth/

│ ├── dashboard/

│ ├── series/

│ ├── manuscript/

│ ├── chapter/

│ ├── page/

│ ├── task/

│ ├── submission/

│ ├── review/

│ ├── board/

│ ├── ranking/

│ ├── payroll/

│ └── notification/

│

├── shared/

│ ├── components/

│ ├── hooks/

│ ├── lib/

│ ├── api/

│ ├── types/

│ └── constants/

│

└── layouts/

Acceptance Criteria:

- App có layout chính.

- Route cơ bản hoạt động.

- Alias import hoạt động.

## 4. EPIC-02 — Authentication & User Sync

### Goal

Tích hợp Clerk login và sync user vào MongoDB.

#### TASK-02.1 — Setup Clerk frontend

**Priority:** Must Have

Checklist:

- Install Clerk React SDK.

- Add ClerkProvider.

- Setup .env:

VITE_CLERK_PUBLISHABLE_KEY=

- Create sign-in route.

- Create sign-up route.

Acceptance Criteria:

- User có thể sign in.

- User có thể sign up.

- Sau login redirect vào /app.

#### TASK-02.2 — Setup Clerk backend middleware

**Priority:** Must Have

Checklist:

- Install Clerk Express SDK.

- Setup CLERK_SECRET_KEY.

- Create requireAuth middleware.

- Attach clerkId vào request.

Acceptance Criteria:

- Protected API yêu cầu token.

- Request không có token bị reject.

- Request có token hợp lệ được pass.

#### TASK-02.3 — Create User model

**Priority:** Must Have

Schema:

User {

clerkId: string

email: string

fullName: string

avatarUrl?: string

systemRole: "ADMIN" \| "MANGAKA" \| "ASSISTANT" \| "EDITOR" \| "BOARD"

status: "ACTIVE" \| "SUSPENDED"

}

Acceptance Criteria:

- User được lưu trong MongoDB.

- clerkId unique.

- Email unique.

#### TASK-02.4 — Implement /api/auth/sync-user

**Priority:** Must Have

Behavior:

- Lấy user từ Clerk token.

- Nếu user chưa tồn tại, tạo user local.

- Nếu user tồn tại, update email/name/avatar.

- Return local user.

Acceptance Criteria:

- Login lần đầu tạo user.

- Login lần sau không tạo trùng.

- Frontend lấy được local user.

#### TASK-02.5 — Implement /api/auth/me

**Priority:** Must Have

Acceptance Criteria:

- Return current user.

- Nếu user chưa có role, return role null hoặc default.

- Frontend dùng API này để redirect theo role.

## 5. EPIC-03 — Role & Permission System

### Goal

Xây dựng hệ thống phân quyền theo system role và series-level role.

#### TASK-03.1 — Create role constants

**Priority:** Must Have

Create:

SYSTEM_ROLES = {

ADMIN,

MANGAKA,

ASSISTANT,

EDITOR,

BOARD

}

Create:

SERIES_MEMBER_ROLES = {

OWNER_MANGAKA,

CO_MANGAKA,

EDITOR,

ASSISTANT,

REVIEWER

}

Acceptance Criteria:

- Backend và frontend có type thống nhất.

- Không hardcode string rải rác.

#### TASK-03.2 — Implement RoleGuard frontend

**Priority:** Must Have

Behavior:

- Check user role.

- Allow/deny route.

- Redirect unauthorized user.

Acceptance Criteria:

- Admin route chỉ Admin vào được.

- Mangaka route chỉ Mangaka vào được.

- Unauthorized page hoạt động.

#### TASK-03.3 — Implement backend RBAC middleware

**Priority:** Must Have

Middleware:

requireRole(\["ADMIN"\])

requireRole(\["MANGAKA", "ADMIN"\])

Acceptance Criteria:

- API protected đúng role.

- User không đúng role nhận 403.

#### TASK-03.4 — Implement SeriesMember model

**Priority:** Must Have

Schema:

SeriesMember {

seriesId: ObjectId

userId: ObjectId

role: "OWNER_MANGAKA" \| "CO_MANGAKA" \| "EDITOR" \| "ASSISTANT" \| "REVIEWER"

status: "INVITED" \| "ACTIVE" \| "REMOVED"

}

Acceptance Criteria:

- Một series có nhiều member.

- Một user có thể có nhiều role theo nhiều series.

- Owner Mangaka được tạo tự động khi tạo series.

#### TASK-03.5 — Implement series-level authorization

**Priority:** Must Have

Use cases:

- Owner/Co-Mangaka quản lý series.

- Assistant chỉ xem task được giao.

- Editor chỉ xem series được assign.

- Board chỉ xem summary.

Acceptance Criteria:

- User không phải member không xem được series private.

- Assistant không xem được toàn chapter.

- Editor xem được series được assign.

## 6. EPIC-04 — Series Management

### Goal

Mangaka tạo và quản lý series.

#### TASK-04.1 — Create Series model

**Priority:** Must Have

Schema:

Series {

title: string

slug: string

description: string

genre: string\[\]

coverUrl?: string

ownerId: ObjectId

status:

\| "DRAFT"

\| "SUBMITTED"

\| "EDITOR_REVIEW"

\| "BOARD_REVIEW"

\| "APPROVED"

\| "PUBLISHING"

\| "ONGOING"

\| "AT_RISK"

\| "CANCELLED"

\| "COMPLETED"

publicationType?: "WEEKLY" \| "MONTHLY"

}

Acceptance Criteria:

- Series tạo được.

- Slug unique.

- Owner được lưu đúng.

#### TASK-04.2 — Implement Series CRUD API

**Priority:** Must Have

Endpoints:

GET /api/series

POST /api/series

GET /api/series/:seriesId

PATCH /api/series/:seriesId

DELETE /api/series/:seriesId

Acceptance Criteria:

- Mangaka xem series của mình.

- Admin xem tất cả.

- Board chỉ xem summary nếu cần.

- Delete chỉ cho draft.

#### TASK-04.3 — Create frontend My Series page

**Priority:** Must Have

Route:

/app/mangaka/series

Components:

- Series grid.

- Status badge.

- Create button.

- Search/filter.

Acceptance Criteria:

- Hiển thị series của Mangaka.

- Click vào series đi tới detail.

- Empty state hiển thị đúng.

#### TASK-04.4 — Create Series form page

**Priority:** Must Have

Route:

/app/mangaka/series/new

Fields:

- Title.

- Description.

- Genre.

- Target audience.

- Publication type.

- Cover optional.

Acceptance Criteria:

- Submit tạo series.

- Validate required fields.

- Redirect về detail sau khi tạo.

#### TASK-04.5 — Create Series detail page

**Priority:** Must Have

Route:

/app/mangaka/series/:seriesId

Tabs:

- Overview.

- Manuscripts.

- Chapters.

- Members.

- Tasks.

- Ranking.

Acceptance Criteria:

- Hiển thị đúng thông tin series.

- Hiển thị status.

- Có action submit nếu status draft.

## 7. EPIC-05 — Manuscript Management

### Goal

Mangaka upload manuscript PDF/images, Editor review trước khi giao task.

#### TASK-05.1 — Create Manuscript model

**Priority:** Must Have

Schema:

Manuscript {

seriesId: ObjectId

uploadedBy: ObjectId

title?: string

description?: string

fileUrls: string\[\]

previewUrls?: string\[\]

currentVersion: number

status:

\| "DRAFT"

\| "SUBMITTED"

\| "EDITOR_REVIEW"

\| "REVISION_REQUESTED"

\| "BOARD_REVIEW"

\| "APPROVED"

\| "REJECTED"

}

Acceptance Criteria:

- Manuscript gắn với series.

- Có status.

- Có version hiện tại.

#### TASK-05.2 — Implement manuscript upload API

**Priority:** Must Have

Endpoint:

POST /api/series/:seriesId/manuscripts

Rules:

- Support PDF.

- Support images.

- Store original file.

- Generate preview nếu có thể.

Acceptance Criteria:

- Upload được PDF/images.

- File metadata lưu DB.

- File lưu R2/MinIO.

#### TASK-05.3 — Implement manuscript workflow API

**Priority:** Must Have

Endpoints:

POST /api/manuscripts/:manuscriptId/submit

POST /api/manuscripts/:manuscriptId/request-revision

POST /api/manuscripts/:manuscriptId/approve

Acceptance Criteria:

- Mangaka submit manuscript.

- Editor request revision.

- Editor approve manuscript.

- Status chuyển đúng.

#### TASK-05.4 — Create manuscript UI

**Priority:** Must Have

Screens:

/app/mangaka/series/:seriesId/manuscripts

/app/editor/manuscripts/:manuscriptId/review

Acceptance Criteria:

- Mangaka upload manuscript.

- Editor xem manuscript.

- Editor approve/request revision.

- Comment được gắn vào manuscript.

## 8. EPIC-06 — Chapter & Page Management

### Goal

Quản lý chapter và page manga.

#### TASK-06.1 — Create Chapter model

**Priority:** Must Have

Schema:

Chapter {

seriesId: ObjectId

title: string

chapterNumber: number

status:

\| "DRAFT"

\| "IN_PROGRESS"

\| "READY_FOR_EDITOR"

\| "EDITOR_REVIEW"

\| "READY_FOR_PUBLICATION"

\| "PUBLISHED"

deadline?: Date

}

Acceptance Criteria:

- Chapter thuộc series.

- Chapter number unique trong series.

#### TASK-06.2 — Implement Chapter API

**Priority:** Must Have

Endpoints:

GET /api/series/:seriesId/chapters

POST /api/series/:seriesId/chapters

GET /api/chapters/:chapterId

PATCH /api/chapters/:chapterId

DELETE /api/chapters/:chapterId

Acceptance Criteria:

- Mangaka tạo chapter.

- Editor xem chapter được assign.

- Delete chỉ khi draft.

#### TASK-06.3 — Create Page model

**Priority:** Must Have

Schema:

Page {

chapterId: ObjectId

pageNumber: number

originalFileUrl: string

aiProcessUrl?: string

previewUrl?: string

thumbnailUrl?: string

width: number

height: number

currentVersion: number

status:

\| "UPLOADED"

\| "AI_PROCESSED"

\| "REGION_MARKED"

\| "TASK_ASSIGNED"

\| "IN_PROGRESS"

\| "SUBMITTED"

\| "MANGAKA_APPROVED"

\| "EDITOR_APPROVED"

\| "NEEDS_REVISION"

\| "READY_TO_PUBLISH"

}

Acceptance Criteria:

- Page thuộc chapter.

- Có original, preview, thumbnail.

- Có version.

#### TASK-06.4 — Implement Page upload API

**Priority:** Must Have

Endpoint:

POST /api/chapters/:chapterId/pages

Rules:

- Max 50 pages/upload.

- Max 50 MB/image.

- Supported: PNG, JPG, JPEG, WEBP.

- Store original unchanged.

- Generate AI copy 2048px.

- Generate preview 1600px.

- Generate thumbnail 300px.

Acceptance Criteria:

- Upload nhiều page.

- Page order đúng.

- File resize đúng.

- Metadata lưu đúng.

#### TASK-06.5 — Create Chapter & Page UI

**Priority:** Must Have

Screens:

/app/mangaka/series/:seriesId/chapters

/app/mangaka/chapters/:chapterId/pages

Acceptance Criteria:

- Mangaka tạo chapter.

- Mangaka upload pages.

- Hiển thị thumbnail grid.

- Click page mở workspace.

## 9. EPIC-07 — File Upload & Cloudflare R2

### Goal

Tích hợp Cloudflare R2 production và MinIO local dev.

#### TASK-07.1 — Setup storage infrastructure

**Priority:** Must Have

Create:

infrastructure/storage/

├── storage.client.ts

├── storage.service.ts

├── storage.types.ts

└── storage.config.ts

Acceptance Criteria:

- Local dùng MinIO.

- Production dùng Cloudflare R2.

- Cùng interface S3 compatible.

#### TASK-07.2 — Implement upload service

**Priority:** Must Have

Functions:

uploadFile()

deleteFile()

getSignedUrl()

generateFileKey()

Acceptance Criteria:

- Upload file thành công.

- Delete file thành công.

- Signed URL hoạt động.

- File key có structure rõ.

#### TASK-07.3 — Implement FileAsset model

**Priority:** Must Have

Schema:

FileAsset {

ownerType: "MANUSCRIPT" \| "PAGE" \| "SUBMISSION" \| "AI_OUTPUT"

ownerId: ObjectId

originalUrl: string

aiProcessUrl?: string

previewUrl?: string

thumbnailUrl?: string

fileName: string

mimeType: string

fileSize: number

width?: number

height?: number

versionNumber: number

uploadedBy: ObjectId

}

Acceptance Criteria:

- Mỗi file có metadata.

- File gắn với owner.

- Có version number.

#### TASK-07.4 — Implement image processing service

**Priority:** Must Have

Use library:

sharp

Generate:

- AI copy max width 2048px.

- Preview max width 1600px.

- Thumbnail width 300px.

Acceptance Criteria:

- Original không đổi.

- Resize đúng width.

- Không upscale ảnh nhỏ.

- Output lưu storage.

## 10. EPIC-08 — Annotation & Region

### Goal

Cho phép chọn vùng hình chữ nhật trên page và lưu normalized coordinates.

#### TASK-08.1 — Create Region model

**Priority:** Must Have

Schema:

Region {

pageId: ObjectId

taskId?: ObjectId

type:

\| "BACKGROUND"

\| "INKING"

\| "SCREENTONE"

\| "CLEANUP"

\| "EFFECT"

\| "BUBBLE"

\| "OTHER"

source: "MANUAL" \| "AI"

shape: "RECTANGLE"

x: number

y: number

width: number

height: number

confidence?: number

createdBy: ObjectId

}

Acceptance Criteria:

- Region lưu normalized coordinate.

- Region thuộc page.

- Region có source manual/AI.

#### TASK-08.2 — Implement Region API

**Priority:** Must Have

Endpoints:

GET /api/pages/:pageId/regions

POST /api/pages/:pageId/regions

PATCH /api/regions/:regionId

DELETE /api/regions/:regionId

POST /api/regions/:regionId/create-task

Acceptance Criteria:

- Tạo region.

- Update region.

- Delete region.

- Create task từ region.

#### TASK-08.3 — Build PageCanvas component

**Priority:** Must Have

Features:

- Display page image.

- Zoom.

- Pan.

- Rectangle selection.

- Show existing regions.

- Select region.

- Delete region.

Acceptance Criteria:

- User vẽ rectangle được.

- Coordinate convert sang normalized đúng.

- Khi resize màn hình, region vẫn nằm đúng vị trí.

#### TASK-08.4 — Build Page Workspace screen

**Priority:** Must Have

Route:

/app/mangaka/pages/:pageId/workspace

Layout:

Left: Page list

Center: Canvas

Right: Region/Task panel

Acceptance Criteria:

- Load page.

- Load regions.

- Create region.

- Create task từ region.

- Run AI bubble detect button placeholder.

## 11. EPIC-09 — Task Assignment

### Goal

Mangaka hoặc Editor tạo task và giao cho Assistant.

#### TASK-09.1 — Create Task model

**Priority:** Must Have

Schema:

Task {

seriesId: ObjectId

chapterId: ObjectId

pageId: ObjectId

regionId?: ObjectId

assignedBy: ObjectId

assignedTo: ObjectId

title: string

description: string

type:

\| "BACKGROUND"

\| "INKING"

\| "SCREENTONE"

\| "CLEANUP"

\| "EFFECT"

\| "OTHER"

priority: "LOW" \| "MEDIUM" \| "HIGH" \| "URGENT"

status:

\| "TODO"

\| "IN_PROGRESS"

\| "SUBMITTED"

\| "REVISION_REQUESTED"

\| "MANGAKA_APPROVED"

\| "EDITOR_APPROVED"

\| "REJECTED"

revisionRound: number

baseRate: number

bonusAmount: number

dueDate?: Date

}

Acceptance Criteria:

- Task có assignedTo.

- Task gắn page/region.

- Status đúng.

#### TASK-09.2 — Implement Task API

**Priority:** Must Have

Endpoints:

GET /api/tasks

POST /api/tasks

GET /api/tasks/:taskId

PATCH /api/tasks/:taskId

DELETE /api/tasks/:taskId

POST /api/tasks/:taskId/start

Acceptance Criteria:

- Mangaka tạo task.

- Editor tạo task.

- Assistant chỉ thấy task được giao.

- Assistant start task.

#### TASK-09.3 — Create task assignment UI

**Priority:** Must Have

Components:

- Create Task Dialog.

- Assistant selector.

- Task type selector.

- Priority selector.

- Due date picker.

- Base rate field.

Acceptance Criteria:

- Tạo task từ region.

- Task xuất hiện ở Assistant dashboard.

- Task status ban đầu là TODO.

## 12. EPIC-10 — Assistant Submission

### Goal

Assistant nhận task, upload kết quả và submit.

#### TASK-10.1 — Create Submission model

**Priority:** Must Have

Schema:

Submission {

taskId: ObjectId

submittedBy: ObjectId

fileUrl: string

previewUrl?: string

note?: string

version: number

status:

\| "PENDING_MANGAKA_REVIEW"

\| "REVISION_REQUESTED"

\| "MANGAKA_APPROVED"

\| "EDITOR_APPROVED"

\| "REJECTED"

}

Acceptance Criteria:

- Submission thuộc task.

- Có version.

- Có status.

#### TASK-10.2 — Implement submission API

**Priority:** Must Have

Endpoints:

GET /api/submissions

GET /api/tasks/:taskId/submissions

POST /api/tasks/:taskId/submissions

GET /api/submissions/:submissionId

Acceptance Criteria:

- Assistant upload file.

- Submission version tăng khi revision.

- Assistant không sửa submission cũ sau submit.

#### TASK-10.3 — Create Assistant task UI

**Priority:** Must Have

Screens:

/app/assistant/tasks

/app/assistant/tasks/:taskId

Acceptance Criteria:

- Assistant xem task được giao.

- Assistant xem region/page preview.

- Assistant upload result.

- Assistant submit.

## 13. EPIC-11 — Review & Comment Workflow

### Goal

Comment có state rõ ràng và phải được resolve trước publish.

#### TASK-11.1 — Create Comment model

**Priority:** Must Have

Schema:

Comment {

targetType:

\| "MANUSCRIPT"

\| "CHAPTER"

\| "PAGE"

\| "TASK"

\| "SUBMISSION"

targetId: ObjectId

pageId?: ObjectId

annotationId?: ObjectId

content: string

createdBy: ObjectId

status:

\| "OPEN"

\| "FIXED_BY_ASSISTANT"

\| "VERIFIED_BY_MANGAKA"

\| "RESOLVED_BY_EDITOR"

fixedBy?: ObjectId

fixedAt?: Date

verifiedBy?: ObjectId

verifiedAt?: Date

resolvedBy?: ObjectId

resolvedAt?: Date

reopenedBy?: ObjectId

reopenedAt?: Date

reopenReason?: string

}

Acceptance Criteria:

- Comment gắn được target.

- Comment có status.

- Track được người fix/verify/resolve.

#### TASK-11.2 — Implement Comment API

**Priority:** Must Have

Endpoints:

GET /api/comments

POST /api/comments

GET /api/comments/:commentId

PATCH /api/comments/:commentId

DELETE /api/comments/:commentId

POST /api/comments/:commentId/mark-fixed

POST /api/comments/:commentId/verify-fixed

POST /api/comments/:commentId/resolve

POST /api/comments/:commentId/reopen

Acceptance Criteria:

- Assistant mark fixed.

- Mangaka verify fixed.

- Editor resolve.

- Editor reopen.

#### TASK-11.3 — Create comment panel UI

**Priority:** Must Have

Components:

- Comment list.

- Comment status badge.

- Add comment form.

- Mark fixed button.

- Verify fixed button.

- Resolve button.

- Reopen dialog.

Acceptance Criteria:

- Button hiển thị theo role.

- Comment state update đúng.

- Comment unresolved chặn publish.

## 14. EPIC-12 — Editor Approval Workflow

### Goal

Editor review manuscript/page/chapter và approve cuối.

#### TASK-12.1 — Implement Editor review APIs

**Priority:** Must Have

Endpoints:

POST /api/manuscripts/:manuscriptId/approve

POST /api/manuscripts/:manuscriptId/request-revision

POST /api/pages/:pageId/editor-approve

POST /api/pages/:pageId/request-revision

POST /api/chapters/:chapterId/approve

POST /api/chapters/:chapterId/request-revision

Acceptance Criteria:

- Editor approve manuscript.

- Editor approve page.

- Editor approve chapter.

- Nếu còn unresolved comment thì không cho approve publish.

#### TASK-12.2 — Create Editor dashboard

**Priority:** Must Have

Route:

/app/editor/dashboard

Cards:

- Assigned series.

- Manuscript waiting review.

- Chapter waiting approval.

- Unresolved comments.

- Deadline risk.

Acceptance Criteria:

- Editor thấy công việc cần xử lý.

- Click vào item đi tới review page.

#### TASK-12.3 — Create Editor review workspace

**Priority:** Must Have

Routes:

/app/editor/manuscripts/:manuscriptId/review

/app/editor/pages/:pageId/review

Acceptance Criteria:

- Editor xem manuscript/page.

- Editor annotate/comment.

- Editor approve/request revision.

- Editor resolve/reopen comments.

## 15. EPIC-13 — Board Voting

### Goal

Board vote series, majority wins, Chair xử lý tie-break.

#### TASK-13.1 — Create BoardMember model

**Priority:** Must Have

Schema:

BoardMember {

userId: ObjectId

role: "BOARD_MEMBER" \| "BOARD_CHAIR"

status: "ACTIVE" \| "INACTIVE"

}

Acceptance Criteria:

- Board có 3–7 members.

- Chỉ có 1 Chair.

- Chair có role riêng.

#### TASK-13.2 — Create BoardVote model

**Priority:** Must Have

Schema:

BoardVote {

seriesId: ObjectId

boardMemberId: ObjectId

vote: "APPROVE" \| "REJECT" \| "NEEDS_REVISION"

reason?: string

}

Acceptance Criteria:

- Mỗi board member vote 1 lần cho 1 series.

- Vote có reason optional.

#### TASK-13.3 — Create BoardDecision model

**Priority:** Must Have

Schema:

BoardDecision {

seriesId: ObjectId

decision:

\| "APPROVED"

\| "REJECTED"

\| "NEEDS_REVISION"

\| "CONTINUE"

\| "CANCEL"

voteSummary: {

approve: number

reject: number

needsRevision: number

}

decidedBy: ObjectId

isTieBreak: boolean

reason?: string

}

Acceptance Criteria:

- Decision lưu vote summary.

- Nếu tie-break thì isTieBreak = true.

#### TASK-13.4 — Implement Board Vote API

**Priority:** Must Have

Endpoints:

GET /api/board/members

POST /api/series/:seriesId/votes

GET /api/series/:seriesId/votes

GET /api/series/:seriesId/votes/summary

POST /api/series/:seriesId/decisions/finalize

POST /api/series/:seriesId/decisions/tie-break

Acceptance Criteria:

- Board member vote được.

- Majority tự tính được.

- Chair finalize tie-break được.

#### TASK-13.5 — Create Board approval UI

**Priority:** Must Have

Screens:

/app/board/series-approvals

/app/board/series-approvals/:seriesId

Acceptance Criteria:

- Board xem summary series.

- Board vote approve/reject/needs revision.

- Vote progress hiển thị.

- Chair thấy nút tie-break khi cần.

## 16. EPIC-14 — Ranking

### Goal

Board nhập vote count + reader score và hệ thống tính ranking.

#### TASK-14.1 — Create Ranking model

**Priority:** Must Have

Schema:

Ranking {

seriesId: ObjectId

period: string

voteCount: number

readerScore: number

normalizedReaderScore: number

finalScore: number

rank: number

previousRank?: number

status: "NORMAL" \| "WARNING" \| "AT_RISK"

createdBy: ObjectId

}

Acceptance Criteria:

- Lưu voteCount.

- Lưu readerScore 1–10.

- Lưu normalized score.

- Lưu finalScore.

#### TASK-14.2 — Implement ranking formula service

**Priority:** Must Have

Formula:

normalizedReaderScore = readerScore \* 10

finalScore =

(voteCount \* 0.7) + (normalizedReaderScore \* 0.3)

Acceptance Criteria:

- Reader score phải từ 1–10.

- Calculate đúng finalScore.

- Sort finalScore descending.

- Assign rank đúng.

#### TASK-14.3 — Implement Ranking API

**Priority:** Must Have

Endpoints:

GET /api/rankings

POST /api/rankings/import

POST /api/rankings/calculate

GET /api/series/:seriesId/rankings

POST /api/rankings/:rankingId/mark-warning

POST /api/rankings/:rankingId/mark-at-risk

Acceptance Criteria:

- Board import ranking.

- System calculate ranking.

- Mangaka xem ranking của series mình.

- Board xem toàn ranking table.

#### TASK-14.4 — Create Ranking UI

**Priority:** Must Have

Screens:

/app/board/ranking

/app/board/ranking/import

/app/mangaka/ranking

Acceptance Criteria:

- Board nhập vote count + reader score.

- Ranking table hiển thị finalScore.

- Mangaka xem ranking series của mình.

- At-risk badge hiển thị.

## 17. EPIC-15 — Payroll Tracking

### Goal

Tính earning theo task, type rate, deadline bonus/penalty.

#### TASK-15.1 — Create TaskRate model

**Priority:** Must Have

Schema:

TaskRate {

taskType:

\| "BACKGROUND"

\| "INKING"

\| "SCREENTONE"

\| "CLEANUP"

\| "EFFECT"

\| "OTHER"

rate: number

currency: string

isActive: boolean

}

Acceptance Criteria:

- Admin cấu hình rate.

- Task lấy baseRate theo type.

#### TASK-15.2 — Create AssistantEarning model

**Priority:** Must Have

Schema:

AssistantEarning {

assistantId: ObjectId

taskId: ObjectId

seriesId: ObjectId

taskType: string

basePayment: number

bonusRate: number

bonusAmount: number

penaltyAmount: number

revisionFee: number

finalPayment: number

timingStatus:

\| "EARLY"

\| "ON_TIME"

\| "LATE_WITHIN_24H"

\| "LATE"

status:

\| "PENDING"

\| "CONFIRMED"

\| "PAID"

\| "CANCELLED"

}

Acceptance Criteria:

- Earning tạo khi task approved.

- Reject task không có payment.

- Mangaka confirm payout.

#### TASK-15.3 — Implement payroll calculation service

**Priority:** Must Have

Rules:

| **Condition** | **Bonus/Penalty**   |
|---------------|---------------------|
| Early ≤ 24h   | +10%                |
| On time       | 0%                  |
| Late ≤ 24h    | -5%                 |
| Late \> 24h   | Mark LATE, no bonus |

Formula:

finalPayment = basePayment \* (1 + bonusRate)

Acceptance Criteria:

- Calculate early đúng.

- Calculate late đúng.

- Revision round 1 free.

- Revision round 2+ configurable.

#### TASK-15.4 — Implement Payroll API

**Priority:** Must Have

Endpoints:

GET /api/payroll/me

GET /api/payroll/series/:seriesId

POST /api/payroll/tasks/:taskId/calculate

POST /api/payroll/tasks/:taskId/confirm

POST /api/payroll/:earningId/mark-paid

Acceptance Criteria:

- Assistant xem earning.

- Mangaka xem payroll series.

- Mangaka confirm payout.

- Admin xem toàn hệ thống.

#### TASK-15.5 — Create Payroll UI

**Priority:** Must Have

Screens:

/app/assistant/earnings

/app/mangaka/payroll

/app/admin/task-rates

Acceptance Criteria:

- Assistant xem earning theo tháng.

- Mangaka confirm payout.

- Admin chỉnh task rate.

## 18. EPIC-16 — AI Bubble Integration

### Goal

Gọi AI service để detect bubble và lưu region.

#### TASK-16.1 — Setup AI client backend

**Priority:** Should Have

Create:

infrastructure/ai/

├── ai.client.ts

├── ai.service.ts

└── ai.types.ts

Acceptance Criteria:

- Backend gọi được AI service.

- Timeout 60s.

- Error handling rõ.

#### TASK-16.2 — Implement AI bubble process API

**Priority:** Should Have

Endpoints:

GET /api/ai/health

POST /api/pages/:pageId/ai/bubble-detect

POST /api/pages/:pageId/ai/bubble-process

POST /api/chapters/:chapterId/ai/batch-bubble-process

Acceptance Criteria:

- Detect bubble từ AI copy.

- Convert bbox sang normalized region.

- Save AI output vào R2.

- Save regions vào MongoDB.

#### TASK-16.3 — Add AI panel in Page Workspace

**Priority:** Should Have

Components:

- Run bubble detect button.

- AI result list.

- Confidence display.

- User adjust region.

- Save annotation.

Acceptance Criteria:

- User chạy AI từ workspace.

- AI region hiển thị trên canvas.

- User chỉnh được region.

- Region lưu lại.

## 19. EPIC-17 — Notification

### Goal

Thông báo các hành động quan trọng.

#### TASK-17.1 — Create Notification model

**Priority:** Should Have

Schema:

Notification {

userId: ObjectId

type:

\| "TASK_ASSIGNED"

\| "TASK_SUBMITTED"

\| "TASK_APPROVED"

\| "REVISION_REQUESTED"

\| "EDITOR_COMMENT"

\| "BOARD_DECISION"

\| "RANKING_WARNING"

\| "PAYROLL_CONFIRMED"

title: string

message: string

isRead: boolean

link?: string

}

Acceptance Criteria:

- Notification gắn user.

- Có read/unread.

#### TASK-17.2 — Implement Notification API

**Priority:** Should Have

Endpoints:

GET /api/notifications

GET /api/notifications/unread-count

PATCH /api/notifications/:notificationId/read

PATCH /api/notifications/read-all

DELETE /api/notifications/:notificationId

Acceptance Criteria:

- User xem notification.

- Mark read.

- Unread count hoạt động.

#### TASK-17.3 — Trigger notifications

**Priority:** Should Have

Trigger khi:

- Task assigned.

- Task submitted.

- Revision requested.

- Editor comment.

- Board decision.

- Ranking warning.

- Payroll confirmed.

Acceptance Criteria:

- Notification tạo tự động.

- Link dẫn đúng màn hình.

## 20. EPIC-18 — Dashboard

### Goal

Tạo dashboard theo role.

#### TASK-18.1 — Implement dashboard APIs

**Priority:** Should Have

Endpoints:

GET /api/dashboard/admin

GET /api/dashboard/mangaka

GET /api/dashboard/assistant

GET /api/dashboard/editor

GET /api/dashboard/board

Acceptance Criteria:

- Return số liệu theo role.

- Không leak data giữa role.

#### TASK-18.2 — Create dashboard screens

**Priority:** Should Have

Routes:

/app/admin/dashboard

/app/mangaka/dashboard

/app/assistant/dashboard

/app/editor/dashboard

/app/board/dashboard

Acceptance Criteria:

- Mỗi role có dashboard riêng.

- Cards hiển thị số liệu cơ bản.

- Link tới action chính.

## 21. EPIC-19 — Deployment

### Goal

Deploy frontend, backend, AI service, DB, storage.

#### TASK-19.1 — Setup MongoDB Atlas M0

**Priority:** Must Have

Acceptance Criteria:

- Tạo cluster.

- Tạo database user.

- Whitelist Railway IP hoặc allow access.

- Backend connect thành công.

#### TASK-19.2 — Setup Cloudflare R2

**Priority:** Must Have

Acceptance Criteria:

- Tạo bucket.

- Tạo access key.

- Setup CORS.

- Upload file từ backend thành công.

- Signed URL hoạt động.

#### TASK-19.3 — Setup MinIO local dev

**Priority:** Should Have

Acceptance Criteria:

- Docker compose chạy MinIO.

- Backend local upload vào MinIO.

- Không cần đổi code khi switch R2/MinIO.

#### TASK-19.4 — Deploy backend to Railway

**Priority:** Must Have

Acceptance Criteria:

- Railway build thành công.

- Env variables đầy đủ.

- /api/health hoạt động.

- Backend connect MongoDB/R2.

#### TASK-19.5 — Deploy frontend to Vercel

**Priority:** Must Have

Acceptance Criteria:

- Vercel build thành công.

- Clerk env đúng.

- API URL đúng.

- Login và protected route hoạt động.

#### TASK-19.6 — Deploy AI service to Railway

**Priority:** Should Have

Acceptance Criteria:

- AI service build Docker thành công.

- /health hoạt động.

- Backend gọi AI service được.

## 22. EPIC-20 — Seed Data & Demo Flow

### Goal

Tạo dữ liệu mẫu để demo end-to-end.

#### TASK-20.1 — Create seed users

**Priority:** Must Have

Seed roles:

- Admin.

- Mangaka.

- Assistant.

- Editor.

- Board Member.

- Board Chair.

Acceptance Criteria:

- Mỗi role có user test.

- User có thể login hoặc map qua Clerk email.

#### TASK-20.2 — Create seed series

**Priority:** Must Have

Seed:

- 1 draft series.

- 1 editor review series.

- 1 board review series.

- 1 ongoing series.

- 1 at-risk series.

Acceptance Criteria:

- Dashboard có dữ liệu.

- Board có series để vote.

- Mangaka có series để quản lý.

#### TASK-20.3 — Create seed workflow

**Priority:** Must Have

Seed:

- Chapter.

- Pages.

- Regions.

- Tasks.

- Submissions.

- Comments.

- Ranking.

- Payroll.

Acceptance Criteria:

- Demo được flow chính.

- Không cần nhập data từ đầu khi trình bày.

## 23. Recommended Coding Order

### Phase 1 — Foundation

1\. Backend setup

2\. Frontend setup

3\. MongoDB connection

4\. Clerk integration

5\. User sync

6\. Role guard

### Phase 2 — Core Data

7\. Series model/API/UI

8\. SeriesMember model/API

9\. Manuscript upload

10\. Chapter model/API/UI

11\. Page upload + storage

### Phase 3 — Production Workflow

12\. Page workspace

13\. Region annotation

14\. Task assignment

15\. Assistant task screen

16\. Submission upload

17\. Mangaka review

18\. Editor approval

### Phase 4 — Governance

19\. Board members

20\. Board voting

21\. Board decision

22\. Publication readiness

23\. Ranking import

24\. Ranking table

### Phase 5 — Payroll & AI

25\. Task rate

26\. Payroll calculation

27\. Assistant earnings

28\. AI service client

29\. AI bubble process

30\. AI region save

### Phase 6 — Polish & Deploy

31\. Notification

32\. Dashboard

33\. Audit log basic

34\. Seed data

35\. Deploy backend

36\. Deploy frontend

37\. Deploy AI service

38\. Final demo test

## 24. Suggested Git Branch Plan

### Main Branches

main

develop

### Feature Branches

feature/project-setup

feature/auth-clerk

feature/user-role-rbac

feature/series-management

feature/manuscript-management

feature/chapter-page-management

feature/storage-r2

feature/page-annotation

feature/task-assignment

feature/submission-review

feature/editor-workflow

feature/board-voting

feature/ranking

feature/payroll

feature/ai-integration

feature/dashboard

feature/deployment

## 25. Suggested First 10 Coding Tasks

### Task 1

Create monorepo:

client/

server/

ai-service/

docs/

### Task 2

Setup backend Express TypeScript.

### Task 3

Setup frontend React Vite + ShadCN/ui.

### Task 4

Connect MongoDB Atlas.

### Task 5

Setup Clerk frontend login.

### Task 6

Setup Clerk backend auth middleware.

### Task 7

Create User model and /auth/sync-user.

### Task 8

Create role guard frontend and backend.

### Task 9

Create Series model + CRUD API.

### Task 10

Create Mangaka My Series screen.

## 26. Definition of Done for MVP

MVP được xem là hoàn thành khi:

1.  User login bằng Clerk được.

2.  User có role và được redirect đúng dashboard.

3.  Mangaka tạo series được.

4.  Mangaka upload manuscript được.

5.  Editor review manuscript được.

6.  Mangaka tạo chapter và upload page được.

7.  Mangaka chọn region trên page được.

8.  Mangaka tạo task và assign Assistant được.

9.  Assistant xem task và submit file được.

10. Mangaka review submission được.

11. Editor approve cuối được.

12. Comment workflow chạy đúng.

13. Board vote series được.

14. Board Chair xử lý tie-break được.

15. Ranking tính đúng công thức.

16. Assistant earning tính đúng rule.

17. File lưu R2/MinIO và dùng signed URL.

18. Frontend deploy Vercel được.

19. Backend deploy Railway được.

20. AI service có thể gọi từ backend.

21. Demo end-to-end không bị lỗi lớn.
