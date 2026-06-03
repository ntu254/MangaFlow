## Frontend Route Map & UI Screen List

### 1. Frontend Routing Strategy

Frontend sử dụng:

React Router

\+ Auth Guard (JWT-based)

\+ Role-Based Route Guard

\+ Feature-Based Route Modules

Mục tiêu:

- Tách route theo feature.

- Mỗi role có dashboard riêng.

- Một số màn hình dùng chung nhưng quyền truy cập khác nhau.

- Không duplicate quá nhiều route nếu cùng một resource như Series, Chapter, Page.

- Route phải dễ mở rộng cho MVP và post-MVP.

## 2. Route Group Overview

/

├── Public Routes

├── Auth Routes

├── App Routes

│ ├── Common Routes

│ ├── Admin Routes

│ ├── Mangaka Routes

│ ├── Assistant Routes

│ ├── Editor Routes

│ └── Board Routes

└── Shared Resource Routes

## 3. Public Routes

| **Path**      | **Screen**        | **Access** |
|---------------|-------------------|------------|
| /             | Landing Page      | Public     |
| /sign-in      | Sign In (Google)  | Public     |
| /sign-up      | Sign Up (Google)  | Public     |
| /unauthorized | Unauthorized Page | Public     |
| /not-found    | Not Found Page    | Public     |

### 3.1. Public Route Notes

#### /

Landing page giới thiệu hệ thống.

Nội dung đề xuất:

- Hero section.

- Manga workflow overview.

- Role explanation.

- AI bubble segmentation highlight.

- Login / Get Started button.

#### /unauthorized

Hiển thị khi user đã login nhưng không có quyền truy cập route.

#### /not-found

Hiển thị khi route không tồn tại.

## 4. Auth Redirect Rule

Sau khi login bằng Google, frontend gọi:

/api/auth/me

Backend trả về user role.

Frontend redirect theo role chính:

| **Role**  | **Redirect**             |
|-----------|--------------------------|
| ADMIN     | /app/admin/dashboard     |
| MANGAKA   | /app/mangaka/dashboard   |
| ASSISTANT | /app/assistant/dashboard |
| EDITOR    | /app/editor/dashboard    |
| BOARD     | /app/board/dashboard     |

Nếu user chưa có role:

/app/onboarding

## 5. Common App Routes

Các route dùng chung cho tất cả user đã login.

| **Path**           | **Screen**                | **Access**    |
|--------------------|---------------------------|---------------|
| /app               | App Redirect              | Authenticated |
| /app/onboarding    | Onboarding / Waiting Role | Authenticated |
| /app/profile       | User Profile              | Authenticated |
| /app/settings      | User Settings             | Authenticated |
| /app/notifications | Notification Center       | Authenticated |
| /app/search        | Global Search             | Authenticated |

### 5.1. Common Screens

#### User Profile

Hiển thị:

- Avatar.

- Full name.

- Email.

- Current system role.

- Series-level roles.

- Account status.

#### Notification Center

Hiển thị:

- Task assigned.

- Submission approved.

- Revision requested.

- Editor comment.

- Board decision.

- Ranking warning.

- Payroll confirmed.

#### Settings

Hiển thị:

- Account settings.

- Notification preferences.

- Theme preference.

- Language preference optional.

## 6. Admin Route Map

/app/admin

├── /dashboard

├── /users

├── /users/:userId

├── /series

├── /series/:seriesId

├── /board

├── /board/members

├── /task-rates

├── /payroll

├── /storage

├── /audit-logs

└── /system-health

### 6.1. Admin Routes Table

| **Path**                    | **Screen**              | **Purpose**                           |
|-----------------------------|-------------------------|---------------------------------------|
| /app/admin/dashboard        | Admin Dashboard         | Tổng quan hệ thống                    |
| /app/admin/users            | User Management         | Quản lý user                          |
| /app/admin/users/:userId    | User Detail             | Xem/chỉnh role, status                |
| /app/admin/series           | All Series              | Xem toàn bộ series                    |
| /app/admin/series/:seriesId | Series Admin Detail     | Xem chi tiết series                   |
| /app/admin/board            | Board Dashboard         | Quản lý hội đồng                      |
| /app/admin/board/members    | Board Member Management | Thêm/sửa Board Member, Board Chair    |
| /app/admin/task-rates       | Task Rate Management    | Cấu hình rate theo loại task          |
| /app/admin/payroll          | Payroll Overview        | Theo dõi payroll toàn hệ thống        |
| /app/admin/storage          | Storage Management      | Theo dõi file/storage usage           |
| /app/admin/audit-logs       | Audit Logs              | Xem lịch sử hành động                 |
| /app/admin/system-health    | System Health           | Theo dõi backend, AI service, storage |

### 6.2. Admin UI Screen List

#### 1. Admin Dashboard

Cards:

- Total users.

- Total series.

- Active series.

- Pending board approvals.

- Total tasks.

- AI processing count.

- Storage usage.

- Monthly payroll amount.

Charts:

- User growth.

- Series status distribution.

- Task status distribution.

- Storage usage trend.

#### 2. User Management

Components:

- User table.

- Search user.

- Filter by role.

- Filter by status.

- Change role modal.

- Suspend/activate user action.

Columns:

- Avatar.

- Name.

- Email.

- System role.

- Status.

- Created date.

- Actions.

#### 3. Board Member Management

Components:

- Board member table.

- Add board member dialog.

- Assign Board Chair action.

- Remove board member action.

Rules:

- Chỉ có một BOARD_CHAIR.

- Board size từ 3 đến 7 người.

#### 4. Task Rate Management

Components:

- Task type list.

- Rate editor.

- Currency field.

- Active/inactive toggle.

Task types:

- Background.

- Inking.

- Screentone.

- Cleanup.

- Effect.

- Other.

#### 5. Storage Management

Components:

- Storage usage summary.

- File count.

- Original file usage.

- Preview usage.

- AI output usage.

- Large files list.

#### 6. Audit Logs

Components:

- Log table.

- Filter by actor.

- Filter by action.

- Filter by target type.

- Date range picker.

Important actions:

- Role changed.

- Series approved.

- Series rejected.

- Board vote.

- Task approved.

- Payroll confirmed.

- File uploaded.

## 7. Mangaka Route Map

/app/mangaka

├── /dashboard

├── /series

├── /series/new

├── /series/:seriesId

├── /series/:seriesId/members

├── /series/:seriesId/manuscripts

├── /series/:seriesId/chapters

├── /series/:seriesId/chapters/new

├── /chapters/:chapterId

├── /chapters/:chapterId/pages

├── /pages/:pageId/workspace

├── /tasks

├── /tasks/:taskId

├── /submissions

├── /submissions/:submissionId

├── /ranking

└── /payroll

### 7.1. Mangaka Routes Table

| **Path**                                   | **Screen**              | **Purpose**                    |
|--------------------------------------------|-------------------------|--------------------------------|
| /app/mangaka/dashboard                     | Mangaka Dashboard       | Tổng quan series và tiến độ    |
| /app/mangaka/series                        | My Series               | Danh sách series của mình      |
| /app/mangaka/series/new                    | Create Series           | Tạo series mới                 |
| /app/mangaka/series/:seriesId              | Series Detail           | Chi tiết series                |
| /app/mangaka/series/:seriesId/members      | Series Members          | Mời assistant/co-mangaka       |
| /app/mangaka/series/:seriesId/manuscripts  | Manuscripts             | Upload/xem bản thảo            |
| /app/mangaka/series/:seriesId/chapters     | Chapters                | Quản lý chapter                |
| /app/mangaka/series/:seriesId/chapters/new | Create Chapter          | Tạo chapter                    |
| /app/mangaka/chapters/:chapterId           | Chapter Detail          | Chi tiết chapter               |
| /app/mangaka/chapters/:chapterId/pages     | Page List               | Danh sách page                 |
| /app/mangaka/pages/:pageId/workspace       | Page Workspace          | Chọn region, giao task, review |
| /app/mangaka/tasks                         | Task Management         | Xem task đã giao               |
| /app/mangaka/tasks/:taskId                 | Task Detail             | Chi tiết task                  |
| /app/mangaka/submissions                   | Submission Review Queue | Queue chờ review               |
| /app/mangaka/submissions/:submissionId     | Submission Detail       | Review submission              |
| /app/mangaka/ranking                       | Series Ranking          | Theo dõi ranking               |
| /app/mangaka/payroll                       | Assistant Payroll       | Xác nhận payout                |

### 7.2. Mangaka UI Screen List

#### 1. Mangaka Dashboard

Cards:

- Total series.

- Active series.

- Pending editor review.

- Pending assistant submissions.

- Tasks due soon.

- Ranking warning.

- Monthly payroll pending.

Main sections:

- Current chapter progress.

- Recent editor comments.

- Assistant task status.

- Ranking trend.

- At-risk alert.

#### 2. My Series

Components:

- Series grid/list.

- Search.

- Filter by status.

- Create series button.

Series card:

- Cover.

- Title.

- Status badge.

- Publication type.

- Ranking position.

- Progress percentage.

- Last updated.

#### 3. Create Series

Form fields:

- Title.

- Description.

- Genre.

- Target audience.

- Cover image.

- Co-mangaka optional.

- Initial manuscript upload optional.

Actions:

- Save draft.

- Submit to editor.

#### 4. Series Detail

Tabs:

- Overview.

- Manuscripts.

- Chapters.

- Members.

- Tasks.

- Ranking.

- Publication.

- Comments.

Overview includes:

- Series status.

- Owner.

- Co-creators.

- Assigned editor.

- Publication type.

- Latest ranking.

- Board decision summary.

#### 5. Series Members

Functions:

- Invite co-mangaka.

- Invite assistant.

- View editor.

- Remove member.

- Change series-level role.

#### 6. Manuscript Management

Components:

- Upload PDF/images.

- Manuscript version list.

- Preview.

- Submit to editor.

- Revision history.

- Editor comments.

#### 7. Chapter Management

Components:

- Chapter table.

- Create chapter.

- Deadline setting.

- Status badge.

- Page count.

- Progress.

#### 8. Page List

Components:

- Page thumbnail grid.

- Batch upload pages.

- Upload limit notice: 50 pages/submission.

- Page status.

- AI processed badge.

- Open workspace button.

#### 9. Page Workspace

Layout:

Left Panel Center Canvas Right Panel

Page list Manga page Task/comment panel

Layer/region Annotation overlay Submission detail

Tools:

- Zoom.

- Pan.

- Rectangle select.

- Create region.

- Assign task.

- Run AI bubble detect.

- Adjust AI region.

- Before/after compare.

- View comments.

#### 10. Task Management

Components:

- Task table.

- Filter by series/chapter/status/assistant.

- Task status board optional.

- Create task button.

Columns:

- Task title.

- Type.

- Assigned assistant.

- Page.

- Deadline.

- Status.

- Revision round.

- Payment status.

#### 11. Submission Review Queue

Components:

- Pending submission list.

- Side-by-side preview.

- Approve button.

- Request revision button.

- Reject button.

- Comment box.

#### 12. Ranking

Components:

- Ranking history chart.

- Current rank.

- Previous rank.

- Vote count.

- Reader score.

- Final score.

- At-risk warning.

#### 13. Payroll

Components:

- Assistant earning table.

- Task payment detail.

- Bonus/penalty status.

- Confirm payout button.

- Monthly summary.

## 8. Assistant Route Map

/app/assistant

├── /dashboard

├── /tasks

├── /tasks/:taskId

├── /submissions

├── /submissions/:submissionId

├── /earnings

└── /profile

### 8.1. Assistant Routes Table

| **Path**                                 | **Screen**          | **Purpose**                |
|------------------------------------------|---------------------|----------------------------|
| /app/assistant/dashboard                 | Assistant Dashboard | Tổng quan công việc        |
| /app/assistant/tasks                     | My Tasks            | Danh sách task được giao   |
| /app/assistant/tasks/:taskId             | Task Detail         | Xem task, tải file, submit |
| /app/assistant/submissions               | My Submissions      | Lịch sử submission         |
| /app/assistant/submissions/:submissionId | Submission Detail   | Chi tiết submission        |
| /app/assistant/earnings                  | My Earnings         | Theo dõi thu nhập          |
| /app/assistant/profile                   | Assistant Profile   | Hồ sơ assistant            |

### 8.2. Assistant UI Screen List

#### 1. Assistant Dashboard

Cards:

- Assigned tasks.

- In-progress tasks.

- Due soon tasks.

- Revision requested.

- Approved tasks.

- Monthly earning.

Sections:

- Today tasks.

- Deadline alerts.

- Recent feedback.

- Earning summary.

#### 2. My Tasks

Components:

- Task table.

- Filter by status.

- Filter by due date.

- Filter by task type.

- Search.

Columns:

- Task title.

- Series.

- Chapter.

- Page.

- Type.

- Priority.

- Due date.

- Status.

- Payment estimate.

#### 3. Task Detail

Information:

- Task title.

- Description.

- Series/chapter/page.

- Assigned by.

- Due date.

- Task type.

- Priority.

- Region preview.

- Reference files.

- Current status.

- Revision round.

Actions:

- Start task.

- Download original/preview.

- Upload result.

- Submit.

- View comments.

Rules:

- Assistant không được sửa submission sau khi submit.

- Nếu cần sửa, phải tạo submission version mới sau khi revision requested.

- Assistant chỉ xem task được giao.

#### 4. My Submissions

Components:

- Submission table.

- Filter by status.

- Version number.

- Review status.

Statuses:

- Pending Mangaka Review.

- Revision Requested.

- Mangaka Approved.

- Editor Approved.

- Rejected.

#### 5. Submission Detail

Information:

- Submitted file.

- Preview.

- Version.

- Review note.

- Comment history.

- Status.

#### 6. My Earnings

Components:

- Monthly earning summary.

- Task earning list.

- Bonus/penalty display.

- Payout status.

Columns:

- Task.

- Task type.

- Base payment.

- Bonus/penalty.

- Final payment.

- Status.

## 9. Editor Route Map

/app/editor

├── /dashboard

├── /series

├── /series/:seriesId

├── /series/:seriesId/manuscripts

├── /manuscripts/:manuscriptId/review

├── /chapters

├── /chapters/:chapterId

├── /pages/:pageId/review

├── /comments

├── /tasks

├── /publication

└── /ranking-support

### 9.1. Editor Routes Table

| **Path**                                     | **Screen**               | **Purpose**                |
|----------------------------------------------|--------------------------|----------------------------|
| /app/editor/dashboard                        | Editor Dashboard         | Tổng quan series phụ trách |
| /app/editor/series                           | Assigned Series          | Series được assign         |
| /app/editor/series/:seriesId                 | Series Editor Detail     | Chi tiết series            |
| /app/editor/series/:seriesId/manuscripts     | Manuscript List          | Bản thảo của series        |
| /app/editor/manuscripts/:manuscriptId/review | Manuscript Review        | Review bản thảo sơ bộ      |
| /app/editor/chapters                         | Chapter Review Queue     | Chapter chờ review         |
| /app/editor/chapters/:chapterId              | Chapter Detail           | Chi tiết chapter           |
| /app/editor/pages/:pageId/review             | Page Review Workspace    | Annotate page              |
| /app/editor/comments                         | Comment Resolution Queue | Comment cần verify/resolve |
| /app/editor/tasks                            | Editor Task Management   | Tạo/xem task               |
| /app/editor/publication                      | Publication Review       | Chuẩn bị publish           |
| /app/editor/ranking-support                  | Ranking Defense Data     | Dữ liệu bảo vệ series      |

### 9.2. Editor UI Screen List

#### 1. Editor Dashboard

Cards:

- Assigned series.

- Manuscripts waiting review.

- Chapters waiting final approval.

- Unresolved comments.

- Deadline risk.

- At-risk series.

Sections:

- Studio progress tracker.

- Recent Mangaka updates.

- Pending publication.

- Ranking support summary.

#### 2. Assigned Series

Components:

- Series table.

- Filter by status.

- Filter by publication type.

- Deadline filter.

Columns:

- Series title.

- Mangaka.

- Status.

- Current chapter.

- Progress.

- Ranking.

- Deadline risk.

#### 3. Manuscript Review

Components:

- PDF/image viewer.

- Comment panel.

- Approve button.

- Request revision button.

- Forward to Board button.

Rules:

- Manuscript phải qua Editor trước khi giao Assistant.

- Editor có thể request revision.

- Editor forward series to Board khi đủ điều kiện.

#### 4. Page Review Workspace

Layout:

Left Panel Center Canvas Right Panel

Chapter pages Manga page Comment/annotation panel

Status list Rectangle tools Resolve workflow

Actions:

- Add rectangle annotation.

- Add comment.

- Create task.

- Verify Mangaka fixed comment.

- Resolve comment.

- Reopen comment.

- Final approve page.

#### 5. Comment Resolution Queue

Components:

- Comment list.

- Filter by status.

- Filter by series.

- Filter by page.

- Verify fixed.

- Resolve.

- Reopen.

Comment states:

OPEN

FIXED_BY_ASSISTANT

VERIFIED_BY_MANGAKA

RESOLVED_BY_EDITOR

#### 6. Publication Review

Components:

- Chapter ready list.

- Unresolved comment check.

- Editor approval status.

- Publish readiness checklist.

Checklist:

- All tasks approved.

- All comments resolved.

- Page status ready.

- Chapter status ready.

- Publication date set.

#### 7. Ranking Support Data

Purpose:

- Editor chuẩn bị dữ liệu để bảo vệ series trước Board.

Includes:

- Ranking trend.

- Vote count.

- Reader score.

- Production progress.

- Delay reasons.

- Editor recommendation.

## 10. Editorial Board Route Map

/app/board

├── /dashboard

├── /series-approvals

├── /series-approvals/:seriesId

├── /votes

├── /ranking

├── /ranking/import

├── /publication

├── /at-risk

├── /decisions

└── /decisions/:decisionId

### 10.1. Board Routes Table

| **Path**                              | **Screen**              | **Purpose**              |
|---------------------------------------|-------------------------|--------------------------|
| /app/board/dashboard                  | Board Dashboard         | Tổng quan quyết định     |
| /app/board/series-approvals           | Pending Series Approval | Series chờ duyệt         |
| /app/board/series-approvals/:seriesId | Series Approval Detail  | Xem summary và vote      |
| /app/board/votes                      | My Votes                | Lịch sử vote             |
| /app/board/ranking                    | Ranking Table           | Xem ranking              |
| /app/board/ranking/import             | Import Ranking Data     | Nhập vote + reader score |
| /app/board/publication                | Publication Decision    | Weekly/monthly decision  |
| /app/board/at-risk                    | At-Risk Series          | Series có nguy cơ bị hủy |
| /app/board/decisions                  | Board Decisions         | Lịch sử quyết định       |
| /app/board/decisions/:decisionId      | Decision Detail         | Chi tiết quyết định      |

### 10.2. Board UI Screen List

#### 1. Board Dashboard

Cards:

- Pending series approval.

- Votes required.

- At-risk series.

- Ranking period.

- Publication decisions.

- Recent decisions.

Sections:

- Approval queue.

- Ranking summary.

- At-risk alert.

- Board activity.

#### 2. Pending Series Approval

Components:

- Series approval table.

- Filter by genre.

- Filter by submitted date.

- Vote status.

Columns:

- Series title.

- Mangaka.

- Genre.

- Submitted date.

- Editor recommendation.

- Vote progress.

- Current decision status.

#### 3. Series Approval Detail

Board chỉ xem summary, không xem page chi tiết trong MVP.

Displayed data:

- Series title.

- Description.

- Genre.

- Target audience.

- Mangaka profile.

- Manuscript summary.

- Editor recommendation.

- Production feasibility.

- Vote summary.

Actions:

- Vote approve.

- Vote reject.

- Vote needs revision.

- Add reason.

#### 4. Ranking Table

Components:

- Ranking table.

- Period selector.

- Sort by rank.

- Series status badge.

- At-risk badge.

Columns:

- Rank.

- Previous rank.

- Series title.

- Vote count.

- Reader score.

- Normalized reader score.

- Final score.

- Status.

Formula display:

finalScore = (voteCount \* 0.7) + (normalizedReaderScore \* 0.3)

#### 5. Import Ranking Data

Form fields:

- Period.

- Series.

- Vote count.

- Reader score, scale 1–10.

System calculates:

- Normalized reader score.

- Final score.

- Rank.

- Warning/at-risk status.

#### 6. Publication Decision

Components:

- Approved series list.

- Weekly/monthly selector.

- Planned publication date.

- Decision note.

Actions:

- Set weekly publication.

- Set monthly publication.

- Delay publication.

- Cancel publication plan.

#### 7. At-Risk Series

Displayed data:

- Series title.

- Current rank.

- Previous rank.

- Vote trend.

- Reader score trend.

- Editor recommendation.

- Board decision history.

Actions:

- Continue.

- Mark warning.

- Cancel series.

- Request improvement plan.

#### 8. Board Decisions

Components:

- Decision history table.

- Filter by decision type.

- Filter by series.

- Filter by date.

Decision types:

- Approved.

- Rejected.

- Needs revision.

- Continue.

- Cancel.

## 11. Shared Resource Routes

Một số route có thể dùng chung giữa nhiều role, nhưng được kiểm tra quyền bằng route guard và backend authorization.

/app/series/:seriesId

/app/chapters/:chapterId

/app/pages/:pageId

/app/pages/:pageId/workspace

/app/tasks/:taskId

/app/submissions/:submissionId

/app/rankings/:rankingId

### 11.1. Shared Route Access

| **Route**                      | **Admin** | **Mangaka**      | **Assistant**    | **Editor**      | **Board**    |
|--------------------------------|-----------|------------------|------------------|-----------------|--------------|
| /app/series/:seriesId          | Yes       | If member        | No               | If assigned     | Summary only |
| /app/chapters/:chapterId       | Yes       | If member        | No               | If assigned     | No           |
| /app/pages/:pageId             | Yes       | If member        | If assigned task | If assigned     | No           |
| /app/pages/:pageId/workspace   | Yes       | If member        | Limited          | If assigned     | No           |
| /app/tasks/:taskId             | Yes       | If series member | If assigned      | If assigned     | No           |
| /app/submissions/:submissionId | Yes       | If reviewer      | If owner         | If assigned     | No           |
| /app/rankings/:rankingId       | Yes       | Own series       | No               | Assigned series | Yes          |

## 12. Route Guard Design

### 12.1. Auth Guard

Checks:

- User is signed in with Google OAuth.

- JWT access token exists and is valid.

- Token is not expired.

Pseudo flow:

User opens protected route

↓

Check auth (useAuth hook)

↓

If not signed in → /sign-in

↓

If signed in → check local user

↓

If no role → /app/onboarding

↓

Allow route

### 12.2. Role Guard

Checks:

- System role.

- Series-level role if route belongs to a series.

- Task ownership if route belongs to a task.

- Editor assignment if route belongs to editor flow.

Example:

\<RequireRole roles={\["ADMIN", "MANGAKA"\]}\>

\<SeriesPage /\>

\</RequireRole\>

### 12.3. Permission Guard

For resource-level actions.

Examples:

canCreateSeries

canInviteAssistant

canCreateTask

canReviewSubmission

canResolveComment

canVoteBoardDecision

canConfirmPayroll

## 13. Suggested Frontend Route File Structure

client/src/app/

├── router.tsx

├── routes/

│ ├── public.routes.tsx

│ ├── common.routes.tsx

│ ├── admin.routes.tsx

│ ├── mangaka.routes.tsx

│ ├── assistant.routes.tsx

│ ├── editor.routes.tsx

│ ├── board.routes.tsx

│ └── shared-resource.routes.tsx

└── guards/

├── AuthGuard.tsx

├── RoleGuard.tsx

├── PermissionGuard.tsx

└── ResourceGuard.tsx

## 14. Suggested Feature Screen Structure

client/src/features/

├── auth/

│ ├── pages/

│ └── components/

│

├── dashboard/

│ ├── pages/

│ │ ├── AdminDashboardPage.tsx

│ │ ├── MangakaDashboardPage.tsx

│ │ ├── AssistantDashboardPage.tsx

│ │ ├── EditorDashboardPage.tsx

│ │ └── BoardDashboardPage.tsx

│ └── components/

│

├── series/

│ ├── pages/

│ │ ├── SeriesListPage.tsx

│ │ ├── SeriesCreatePage.tsx

│ │ ├── SeriesDetailPage.tsx

│ │ └── SeriesMembersPage.tsx

│ └── components/

│

├── chapter/

│ ├── pages/

│ │ ├── ChapterListPage.tsx

│ │ ├── ChapterCreatePage.tsx

│ │ └── ChapterDetailPage.tsx

│ └── components/

│

├── page/

│ ├── pages/

│ │ ├── PageListPage.tsx

│ │ ├── PageDetailPage.tsx

│ │ └── PageWorkspacePage.tsx

│ └── components/

│ ├── PageCanvas.tsx

│ ├── AnnotationLayer.tsx

│ ├── RegionToolbar.tsx

│ ├── BeforeAfterCompare.tsx

│ └── AiBubblePanel.tsx

│

├── task/

│ ├── pages/

│ │ ├── TaskListPage.tsx

│ │ └── TaskDetailPage.tsx

│ └── components/

│

├── submission/

│ ├── pages/

│ │ ├── SubmissionListPage.tsx

│ │ ├── SubmissionDetailPage.tsx

│ │ └── SubmissionReviewPage.tsx

│ └── components/

│

├── review/

│ ├── pages/

│ │ ├── ManuscriptReviewPage.tsx

│ │ ├── PageReviewPage.tsx

│ │ └── CommentQueuePage.tsx

│ └── components/

│

├── publication/

│ ├── pages/

│ │ └── PublicationPage.tsx

│ └── components/

│

├── ranking/

│ ├── pages/

│ │ ├── RankingTablePage.tsx

│ │ └── RankingImportPage.tsx

│ └── components/

│

├── payroll/

│ ├── pages/

│ │ ├── AssistantEarningsPage.tsx

│ │ └── PayrollManagementPage.tsx

│ └── components/

│

└── notification/

├── pages/

│ └── NotificationCenterPage.tsx

└── components/

## 15. MVP Screen Priority

### 15.1. Must Have Screens

#### Auth

- Sign in.

- Sign up.

- Onboarding / waiting role.

#### Admin

- Admin dashboard.

- User management.

- Task rate management.

#### Mangaka

- Mangaka dashboard.

- My series.

- Create series.

- Series detail.

- Chapter list.

- Page list.

- Page workspace.

- Task management.

- Submission review.

- Payroll confirmation.

#### Assistant

- Assistant dashboard.

- My tasks.

- Task detail.

- Submit work.

- My earnings.

#### Editor

- Editor dashboard.

- Assigned series.

- Manuscript review.

- Page review workspace.

- Comment resolution queue.

- Publication review.

#### Board

- Board dashboard.

- Pending series approval.

- Series approval detail.

- Ranking table.

- Ranking import.

- At-risk series.

### 15.2. Should Have Screens

- Before/after compare.

- Board decision history.

- Storage management.

- Audit logs.

- Global search.

- Notification center.

### 15.3. Could Have Screens

- Advanced analytics.

- Real-time activity feed.

- User activity timeline.

- AI processing history.

- Advanced payroll reports.

## 16. Navigation Sidebar by Role

### 16.1. Admin Sidebar

Dashboard

Users

Series

Board

Task Rates

Payroll

Storage

Audit Logs

System Health

Settings

### 16.2. Mangaka Sidebar

Dashboard

My Series

Chapters

Pages

Tasks

Submissions

Ranking

Payroll

Notifications

Settings

### 16.3. Assistant Sidebar

Dashboard

My Tasks

My Submissions

Earnings

Notifications

Profile

Settings

### 16.4. Editor Sidebar

Dashboard

Assigned Series

Manuscript Review

Chapter Review

Page Review

Comments

Publication

Ranking Support

Notifications

Settings

### 16.5. Board Sidebar

Dashboard

Series Approvals

Votes

Ranking

Import Ranking

Publication

At-Risk Series

Decisions

Notifications

Settings

## 17. Recommended MVP Route Implementation Order

### Step 1

Implement public/auth/common routes.

/sign-in

/sign-up

/app

/app/onboarding

/app/profile

### Step 2

Implement dashboard routes by role.

/app/admin/dashboard

/app/mangaka/dashboard

/app/assistant/dashboard

/app/editor/dashboard

/app/board/dashboard

### Step 3

Implement Mangaka + Assistant core workflow.

/app/mangaka/series

/app/mangaka/series/new

/app/mangaka/pages/:pageId/workspace

/app/mangaka/tasks

/app/assistant/tasks

/app/assistant/tasks/:taskId

### Step 4

Implement Editor review workflow.

/app/editor/series

/app/editor/manuscripts/:manuscriptId/review

/app/editor/pages/:pageId/review

/app/editor/comments

### Step 5

Implement Board + Ranking workflow.

/app/board/series-approvals

/app/board/series-approvals/:seriesId

/app/board/ranking

/app/board/ranking/import

### Step 6

Implement Admin management screens.

/app/admin/users

/app/admin/task-rates

/app/admin/board/members

/app/admin/audit-logs
