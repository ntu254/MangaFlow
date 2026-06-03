## Screen Design Specification — MangaFlow

### 1. Design Goal

MangaFlow là web application quản lý quy trình sáng tác, xử lý bản thảo, giao task, review, xuất bản và ranking cho manga.

UI cần đạt 5 mục tiêu chính:

1.  Giúp từng role thấy đúng việc cần làm.

2.  Tối ưu thao tác trên page manga, annotation và task assignment.

3.  Thể hiện rõ trạng thái workflow.

4.  Bảo vệ dữ liệu bản thảo bằng UI private workspace.

5.  Có giao diện dark technology tone, phù hợp hệ thống sáng tạo nội dung manga.

## 2. Visual Style

### 2.1. Theme Direction

- Fresh Pastel Creative

- \+ Manga Studio Workspace

- \+ Friendly Production Dashboard

> \+ Bright Editorial Management System

UI không dùng dark technology theme.

Giao diện cần có cảm giác:

- Tươi mới.

- Sáng.

- Sáng tạo.

- Thân thiện.

- Phù hợp manga/art production.

- Không quá corporate.

- Không quá tối.

- Không dùng nền đen/xanh đen làm màu chính.

### 2.2 Primary Palette

| **Color**   | **Hex**  | **Usage**                                      |
|-------------|----------|------------------------------------------------|
| Purple      | \#9065d5 | Primary action, active sidebar, main highlight |
| Pink Purple | \#e560bc | Creative accent, illustration, badge           |
| Rose Pink   | \#ff7196 | Warning soft, important highlight              |
| Coral       | \#ff9971 | CTA secondary, deadline, activity              |
| Soft Yellow | \#ffc95e | Warning, ranking, attention                    |
| Pastel Lime | \#f9f871 | Success highlight, positive accent             |

## 2.3. Background Colors

| Token      | Color    | Usage                         |
|------------|----------|-------------------------------|
| bg-main    | \#fff9fb | Main app background           |
| bg-soft    | \#fff3f8 | Soft section background       |
| bg-card    | \#ffffff | Card background               |
| bg-sidebar | \#f8f1ff | Sidebar background            |
| bg-panel   | \#fff7ec | Right panel / workspace panel |
| bg-canvas  | \#f7f3ff | Page canvas background        |

## 2.4. Text Colors

| Token          | Color    | Usage          |
|----------------|----------|----------------|
| text-primary   | \#2f243a | Main text      |
| text-secondary | \#5f5270 | Secondary text |
| text-muted     | \#8a7a99 | Helper text    |
| text-disabled  | \#b8a9c7 | Disabled text  |

## 2.5. Border Colors

| Token          | Color    | Usage              |
|----------------|----------|--------------------|
| border-default | \#eadff6 | Card/input border  |
| border-soft    | \#f3d7e7 | Soft border        |
| border-active  | \#9065d5 | Focus/active state |
| border-warning | \#ffc95e | Warning state      |

## 2.6. Button Colors

### Primary Button

- **Background**: \#9065d5

- **Text**: \#ffffff

- **Hover**: \#7f55c7

### Secondary Button

- **Background**: \#ffe6f2

- **Text**: \#e560bc

- **Hover**: \#ffd4eb

### Accent Button

- **Background**: \#ff9971

- **Text**: \#ffffff

- **Hover**: \#ff865a

### Warning Button

- **Background**: \#ffc95e

- **Text**: \#3a2a00

- **Hover**: \#ffbd3d

## 2.7. Status Badge Colors

| Status Group | Background | Text     |
|--------------|------------|----------|
| Draft        | \#f1edf7   | \#6d5d7c |
| In Progress  | \#ece5ff   | \#9065d5 |
| Submitted    | \#ffe6f2   | \#e560bc |
| Review       | \#fff0dc   | \#d97706 |
| Approved     | \#f4ffd2   | \#7a8f00 |
| Revision     | \#ffe7de   | \#e15f2f |
| Rejected     | \#ffe1e8   | \#e11d48 |
| At Risk      | \#fff0c2   | \#b45309 |
| Published    | \#f9f871   | \#5f6500 |

## 2.8. Gradient Usage

Dùng gradient nhẹ để tạo cảm giác creative.

### Main Brand Gradient

background: linear-gradient(

135deg,

\#9065d5 0%,

\#e560bc 35%,

\#ff7196 65%,

\#ff9971 100%

);

### Soft Background Gradient

background: linear-gradient(

135deg,

\#fff9fb 0%,

\#f8f1ff 45%,

\#fff7ec 100%

);

### Highlight Gradient

background: linear-gradient(

90deg,

\#ffc95e 0%,

\#f9f871 100%

);

## 2.9. Page Canvas Overlay Colors

| Overlay Type     | Border   | Fill                      |
|------------------|----------|---------------------------|
| Manual Region    | \#9065d5 | rgba(144, 101, 213, 0.12) |
| AI Bubble        | \#e560bc | rgba(229, 96, 188, 0.12)  |
| Editor Comment   | \#ff9971 | rgba(255, 153, 113, 0.15) |
| Approved Task    | \#c9d93b | rgba(249, 248, 113, 0.25) |
| Revision Needed  | \#ff7196 | rgba(255, 113, 150, 0.15) |
| Deadline Warning | \#ffc95e | rgba(255, 201, 94, 0.2)   |

## 2.10. UI Personality

MangaFlow UI nên giống một **creative production studio tool**, không phải banking/admin system.

Nên ưu tiên:

- Rounded cards.

- Soft shadow.

- Pastel gradient.

- Clear status badges.

- Friendly empty states.

- Illustration-style icons.

- Bright but not neon.

- Clean white workspace.

- Canvas dễ nhìn, không bị tối.

Không nên dùng:

- Nền đen.

- Nền xanh navy đậm.

- Cyberpunk style.

- Quá nhiều glow.

- Màu neon gắt.

- Contrast quá mạnh làm mất chất creative.

## 3. Typography

### 3.1. Font

Recommended:

Inter

Fallback:

system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

### 3.2. Font Scale

| **Element**   | **Size** | **Weight** |
|---------------|----------|------------|
| Page title    | 28px     | 700        |
| Section title | 20px     | 600        |
| Card title    | 16px     | 600        |
| Body text     | 14px     | 400        |
| Table text    | 14px     | 400        |
| Helper text   | 12px     | 400        |
| Badge text    | 12px     | 500        |

## 4. Layout System

### 4.1. Main App Layout

┌─────────────────────────────────────────────┐

│ Header │

├───────────────┬─────────────────────────────┤

│ Sidebar │ Main Content │

│ │ │

│ Navigation │ Page Content │

│ │ │

└───────────────┴─────────────────────────────┘

### 4.2. Dashboard Layout

Page Header

↓

Metric Cards

↓

Main Grid

├── Primary Content

└── Secondary Panel

### 4.3. Workspace Layout

Dùng cho page annotation, task assignment, editor review.

┌──────────────┬──────────────────────────┬──────────────────┐

│ Left Panel │ Canvas Area │ Right Panel │

│ │ │ │

│ Page List │ Manga Page Viewer │ Task / Comment │

│ Layers │ Annotation Overlay │ Region Details │

│ Regions │ Zoom / Pan Toolbar │ Review Actions │

└──────────────┴──────────────────────────┴──────────────────┘

Recommended width:

| **Area**      | **Width** |
|---------------|-----------|
| Left Panel    | 280px     |
| Center Canvas | Flexible  |
| Right Panel   | 360px     |
| Header        | 64px      |
| Sidebar       | 260px     |

## 5. Global Components

### 5.1. App Header

### Purpose

Hiển thị context hiện tại, search, notification và user menu.

### Content

- Breadcrumb.

- Global search.

- Notification bell.

- Theme toggle optional.

- User avatar menu.

### User Menu

Items:

- Profile.

- Settings.

- Role info.

- Sign out.

### 5.2. Sidebar

Sidebar thay đổi theo role.

### Common Style

- Dark background.

- Active route dùng cyan border hoặc cyan glow.

- Icon + label.

- Collapsible optional.

### Sidebar Items by Role

#### Admin

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

#### Mangaka

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

#### Assistant

Dashboard

My Tasks

My Submissions

Earnings

Notifications

Profile

Settings

#### Editor

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

#### Board

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

### 5.3. Status Badge

### Purpose

Hiển thị trạng thái của series, chapter, page, task, submission, comment.

### Badge Style

| **Status Group** | **Color**   |
|------------------|-------------|
| Draft            | Gray        |
| In Progress      | Blue        |
| Submitted        | Cyan        |
| Review           | Amber       |
| Approved         | Emerald     |
| Revision         | Orange      |
| Rejected         | Red         |
| At Risk          | Red / Amber |
| Published        | Green       |

### Examples

DRAFT

EDITOR_REVIEW

BOARD_REVIEW

TASK_ASSIGNED

REVISION_REQUESTED

MANGAKA_APPROVED

EDITOR_APPROVED

AT_RISK

RESOLVED_BY_EDITOR

### 5.4. Empty State

Dùng khi chưa có dữ liệu.

### Structure

Icon

Title

Description

Primary Action

### Example

No series yet

Create your first manga series to start managing production workflow.

\[Create Series\]

### 5.5. Data Table

Dùng cho:

- Users.

- Tasks.

- Submissions.

- Rankings.

- Payroll.

- Board decisions.

- Audit logs.

### Required Features

- Search.

- Filter.

- Sort.

- Pagination.

- Status badge.

- Row action menu.

- Loading skeleton.

### 5.6. Form Dialog

Dùng cho quick actions:

- Invite member.

- Create task.

- Add comment.

- Confirm payout.

- Board vote.

- Request revision.

### Dialog Structure

Title

Description

Form Fields

Footer Actions

Footer:

Cancel \| Confirm

## 6. Auth Screens

### 6.1. Landing Page

### Route

/

### Purpose

Giới thiệu MangaFlow.

### Sections

1.  Hero section.

2.  Workflow overview.

3.  Role overview.

4.  AI bubble segmentation highlight.

5.  Call to action.

### Primary CTA

Get Started

### Secondary CTA

Sign In

### 6.2. Sign In Page

### Route

/sign-in

### Provider

Google OAuth.

### Layout

Left: Branding / illustration

Right: Sign in with Google button

### Notes

- Server-side token exchange with Google.

- Sau login redirect theo role.

### 6.3. Sign Up Page

### Route

/sign-up

### Provider

Google OAuth.

### Layout

Tương tự Sign In.

### 6.4. Onboarding Page

### Route

/app/onboarding

### Purpose

Dùng khi user login nhưng chưa có role.

### Content

- Welcome message.

- Current account email.

- Waiting for admin assignment.

- Contact admin message.

### Admin Optional Action

Nếu user là Admin seed đầu tiên, có thể hiện:

Initialize Admin Account

## 7. Admin Screens

### 7.1. Admin Dashboard

### Route

/app/admin/dashboard

### Purpose

Tổng quan hệ thống.

### Layout

Page Header

Metric Cards

Two-column dashboard grid

### Metric Cards

| **Card**              | **Description**       |
|-----------------------|-----------------------|
| Total Users           | Tổng số user          |
| Active Series         | Series đang hoạt động |
| Pending Board Reviews | Series chờ hội đồng   |
| Total Tasks           | Tổng task             |
| Storage Usage         | Dung lượng R2         |
| AI Jobs               | Số job AI             |
| Monthly Payroll       | Tổng payroll tháng    |

### Main Sections

#### System Overview Chart

- Series by status.

- Task by status.

- User by role.

#### Recent Activities

- Role changed.

- Series created.

- Board decision finalized.

- Payroll confirmed.

### 7.2. User Management Screen

### Route

/app/admin/users

### Purpose

Quản lý user và system role.

### Components

- User table.

- Search input.

- Role filter.

- Status filter.

- Change role dialog.

- Suspend/activate action.

### Table Columns

| **Column** | **Description**            |
|------------|----------------------------|
| Avatar     | User avatar                |
| Name       | Full name                  |
| Email      | Email                      |
| Role       | System role                |
| Status     | Active/Suspended           |
| Created At | Created date               |
| Actions    | View, Change Role, Suspend |

### Actions

- View detail.

- Change role.

- Suspend user.

- Activate user.

### 7.3. Board Member Management Screen

### Route

/app/admin/board/members

### Purpose

Quản lý Editorial Board.

### Components

- Board member table.

- Add board member dialog.

- Set Chair action.

- Remove member action.

### Rules Display

Board size: 3–7 active members

Only one Board Chair

### Table Columns

| **Column** | **Description**            |
|------------|----------------------------|
| Name       | Board user                 |
| Email      | User email                 |
| Role       | BOARD_MEMBER / BOARD_CHAIR |
| Status     | Active/Inactive            |
| Actions    | Set Chair, Remove          |

### 7.4. Task Rate Management Screen

### Route

/app/admin/task-rates

### Purpose

Cấu hình rate theo loại task.

### Components

- Task rate table.

- Create/edit rate dialog.

- Active toggle.

### Table Columns

| **Task Type** | **Rate** | **Currency** | **Status** | **Actions** |
|---------------|----------|--------------|------------|-------------|

### Default Task Types

BACKGROUND

INKING

SCREENTONE

CLEANUP

EFFECT

OTHER

### 7.5. Audit Log Screen

### Route

/app/admin/audit-logs

### Purpose

Xem lịch sử hành động quan trọng.

### Filters

- Actor.

- Action.

- Target type.

- Date range.

### Table Columns

| **Time** | **Actor** | **Action** | **Target Type** | **Target ID** | **Detail** |
|----------|-----------|------------|-----------------|---------------|------------|

## 8. Mangaka Screens

### 8.1. Mangaka Dashboard

### Route

/app/mangaka/dashboard

### Purpose

Cho Mangaka thấy toàn bộ workflow studio.

### Metric Cards

| **Card**            | **Description**       |
|---------------------|-----------------------|
| My Series           | Tổng series           |
| Active Chapters     | Chapter đang làm      |
| Pending Submissions | Submission chờ review |
| Tasks Due Soon      | Task sắp deadline     |
| Ranking Warning     | Series có nguy cơ     |
| Payroll Pending     | Payroll chờ xác nhận  |

### Main Sections

#### Current Production

Hiển thị chapter/page/task đang xử lý.

#### Pending Review

Danh sách submission cần Mangaka review.

#### Ranking Snapshot

Series rank hiện tại.

#### Recent Editor Comments

Comment mới từ Editor.

### 8.2. My Series Screen

### Route

/app/mangaka/series

### Purpose

Quản lý các series của Mangaka.

### Components

- Series card grid.

- Search.

- Status filter.

- Create series button.

### Series Card Content

- Cover.

- Title.

- Genre.

- Status badge.

- Publication type.

- Current ranking.

- Progress bar.

- Last updated.

### Empty State

No series yet

Create your first manga series.

### 8.3. Create Series Screen

### Route

/app/mangaka/series/new

### Purpose

Tạo series mới.

### Form Fields

| **Field**        | **Type**       | **Required** |
|------------------|----------------|--------------|
| Title            | Text           | Yes          |
| Description      | Textarea       | Yes          |
| Genre            | Multi select   | Yes          |
| Target Audience  | Select         | No           |
| Publication Type | Weekly/Monthly | No           |
| Cover            | Image Upload   | No           |

### Actions

Save Draft

Submit to Editor

Cancel

### 8.4. Series Detail Screen

### Route

/app/mangaka/series/:seriesId

### Purpose

Trang trung tâm của một series.

### Tabs

Overview

Manuscripts

Chapters

Members

Tasks

Ranking

Publication

Comments

### Overview Content

- Series title.

- Cover.

- Status.

- Owner.

- Co-Mangaka.

- Assigned Editor.

- Publication type.

- Current rank.

- Progress summary.

- Latest board decision.

### Important Actions

- Edit series.

- Submit to editor.

- Invite member.

- Create chapter.

### 8.5. Series Members Screen

### Route

/app/mangaka/series/:seriesId/members

### Purpose

Quản lý thành viên tham gia series.

### Components

- Member table.

- Invite member dialog.

### Member Roles

OWNER_MANGAKA

CO_MANGAKA

EDITOR

ASSISTANT

REVIEWER

### Table Columns

| **Name** | **Email** | **Series Role** | **Status** | **Joined At** | **Actions** |
|----------|-----------|-----------------|------------|---------------|-------------|

### 8.6. Manuscript Management Screen

### Route

/app/mangaka/series/:seriesId/manuscripts

### Purpose

Upload và quản lý bản thảo sơ bộ.

### Components

- Upload manuscript box.

- Manuscript list.

- Version history.

- Editor feedback panel.

### Supported Files

PDF

PNG

JPG

JPEG

WEBP

### Actions

- Upload manuscript.

- Submit to Editor.

- Upload new major version.

- View feedback.

### 8.7. Chapter List Screen

### Route

/app/mangaka/series/:seriesId/chapters

### Purpose

Quản lý chapter.

### Components

- Chapter table.

- Create chapter button.

- Status filter.

### Table Columns

| **Chapter** | **Title** | **Status** | **Pages** | **Progress** | **Deadline** | **Actions** |
|-------------|-----------|------------|-----------|--------------|--------------|-------------|

### 8.8. Page List Screen

### Route

/app/mangaka/chapters/:chapterId/pages

### Purpose

Upload và quản lý page trong chapter.

### Components

- Batch upload.

- Page thumbnail grid.

- Page status badge.

- Open workspace button.

### Upload Rules Display

Max 50 pages per upload

Max 50MB per image

Original file will be stored unchanged

### Page Card Content

- Thumbnail.

- Page number.

- Status.

- Task count.

- Comment count.

- AI processed badge.

### 8.9. Page Workspace Screen

### Route

/app/mangaka/pages/:pageId/workspace

### Purpose

Màn hình chính để chọn region, giao task và review page.

### Layout

┌──────────────┬──────────────────────────┬────────────────────┐

│ Left Panel │ Canvas Area │ Right Panel │

│ │ │ │

│ Page List │ Manga Page │ Region Detail │

│ Regions │ Annotation Overlay │ Task Form │

│ AI Results │ Zoom/Pan Toolbar │ Comment Panel │

└──────────────┴──────────────────────────┴────────────────────┘

### Left Panel

Tabs:

Pages

Regions

AI Results

### Center Canvas

Features:

- Display page preview.

- Zoom.

- Pan.

- Rectangle select.

- Show region overlays.

- Show annotation overlays.

- Before/after compare.

### Right Panel

Dynamic based on selection:

#### When no region selected

- Page info.

- Run AI bubble detect.

- Create region manually.

#### When region selected

- Region type.

- Coordinates.

- Assigned task status.

- Create task button.

#### When task selected

- Task detail.

- Assigned assistant.

- Deadline.

- Submission status.

- Review action.

### Toolbar

Select

Rectangle

Pan

Zoom In

Zoom Out

Reset View

Run AI

Compare

### 8.10. Submission Review Screen

### Route

/app/mangaka/submissions/:submissionId

### Purpose

Mangaka review submission từ Assistant.

### Layout

Left: Original / Task context

Center: Submitted file preview

Right: Review panel

### Actions

Approve

Request Revision

Reject

Add Comment

### Display

- Task title.

- Assistant.

- Version.

- Revision round.

- Submitted at.

- Deadline status.

- Payment estimate.

### 8.11. Mangaka Payroll Screen

### Route

/app/mangaka/payroll

### Purpose

Xem và xác nhận payout cho Assistant.

### Components

- Monthly summary.

- Assistant earning table.

- Confirm payout dialog.

### Table Columns

| **Assistant** | **Task** | **Type** | **Base** | **Bonus/Penalty** | **Final** | **Status** | **Actions** |
|---------------|----------|----------|----------|-------------------|-----------|------------|-------------|

## 9. Assistant Screens

### 9.1. Assistant Dashboard

### Route

/app/assistant/dashboard

### Purpose

Hiển thị việc cần làm của Assistant.

### Metric Cards

| **Card**           | **Description** |
|--------------------|-----------------|
| Assigned Tasks     | Task được giao  |
| In Progress        | Đang xử lý      |
| Due Soon           | Sắp deadline    |
| Revision Requested | Cần sửa         |
| Approved Tasks     | Đã duyệt        |
| Monthly Earning    | Thu nhập tháng  |

### Main Sections

- Today tasks.

- Deadline alerts.

- Recent feedback.

- Earning summary.

### 9.2. My Tasks Screen

### Route

/app/assistant/tasks

### Purpose

Danh sách task được giao.

### Components

- Task table.

- Status filter.

- Due date filter.

- Task type filter.

### Table Columns

| **Task** | **Series** | **Page** | **Type** | **Priority** | **Due Date** | **Status** | **Payment** |
|----------|------------|----------|----------|--------------|--------------|------------|-------------|

### Row Actions

- View task.

- Start task.

- Submit work.

### 9.3. Task Detail Screen

### Route

/app/assistant/tasks/:taskId

### Purpose

Assistant xem chi tiết task và submit kết quả.

### Layout

Left: Page/Region preview

Right: Task detail + Submission form

### Information

- Task title.

- Description.

- Series.

- Chapter.

- Page.

- Region preview.

- Assigned by.

- Due date.

- Type.

- Priority.

- Base payment.

- Revision round.

### Actions

Start Task

Download Reference

Upload Result

Submit

### Rules

- Assistant không xem toàn chapter.

- Assistant chỉ xem page/task được giao.

- Assistant không sửa submission cũ sau submit.

- Revision sẽ tạo submission version mới.

### 9.4. My Submissions Screen

### Route

/app/assistant/submissions

### Purpose

Xem lịch sử submission.

### Components

- Submission table.

- Status filter.

### Table Columns

| **Task** | **Version** | **Submitted At** | **Status** | **Review Note** | **Actions** |
|----------|-------------|------------------|------------|-----------------|-------------|

### 9.5. My Earnings Screen

### Route

/app/assistant/earnings

### Purpose

Assistant theo dõi earning.

### Components

- Monthly earning card.

- Task earning table.

- Payment status badge.

### Table Columns

| **Month** | **Task** | **Type** | **Base** | **Bonus/Penalty** | **Final** | **Status** |
|-----------|----------|----------|----------|-------------------|-----------|------------|

### Bonus Display

| **Timing**  | **Badge**  |
|-------------|------------|
| Early ≤ 24h | +10% Early |
| On time     | On time    |
| Late ≤ 24h  | -5% Late   |
| Late \> 24h | Late       |

## 10. Editor Screens

### 10.1. Editor Dashboard

### Route

/app/editor/dashboard

### Purpose

Editor quản lý series được assign và review workflow.

### Metric Cards

| **Card**            | **Description**               |
|---------------------|-------------------------------|
| Assigned Series     | Series phụ trách              |
| Manuscripts Waiting | Manuscript chờ review         |
| Chapters Waiting    | Chapter chờ approve           |
| Unresolved Comments | Comment chưa resolve          |
| Deadline Risk       | Series/chapter có nguy cơ trễ |
| At-Risk Series      | Series cần bảo vệ             |

### 10.2. Assigned Series Screen

### Route

/app/editor/series

### Purpose

Danh sách series Editor phụ trách.

### Table Columns

| **Series** | **Mangaka** | **Status** | **Current Chapter** | **Progress** | **Ranking** | **Risk** |
|------------|-------------|------------|---------------------|--------------|-------------|----------|

### 10.3. Manuscript Review Screen

### Route

/app/editor/manuscripts/:manuscriptId/review

### Purpose

Editor review bản thảo sơ bộ.

### Layout

Left: Manuscript pages/files

Center: Viewer

Right: Review actions + comments

### Actions

Approve

Request Revision

Forward to Board

Add Comment

### Rules

- Manuscript phải qua Editor trước khi task assignment.

- Editor có thể request revision.

- Editor forward to Board khi đủ điều kiện.

### 10.4. Page Review Workspace

### Route

/app/editor/pages/:pageId/review

### Purpose

Editor annotate, comment, verify fixed và approve page.

### Layout

Tương tự Mangaka Page Workspace nhưng quyền khác.

### Editor Tools

Rectangle Annotation

Add Comment

Verify Fixed

Resolve Comment

Reopen Comment

Final Approve Page

Request Revision

### Right Panel

Tabs:

Comments

Annotations

Tasks

Approval

### 10.5. Comment Resolution Queue

### Route

/app/editor/comments

### Purpose

Editor xử lý comment cần verify/resolve.

### Filters

- Status.

- Series.

- Page.

- Created date.

- Assigned series only.

### Table Columns

| **Comment** | **Series** | **Page** | **Status** | **Created By** | **Updated At** | **Actions** |
|-------------|------------|----------|------------|----------------|----------------|-------------|

### Actions

Open Page

Resolve

Reopen

### Comment Status Flow

OPEN

↓

FIXED_BY_ASSISTANT

↓

VERIFIED_BY_MANGAKA

↓

RESOLVED_BY_EDITOR

### 10.6. Publication Review Screen

### Route

/app/editor/publication

### Purpose

Check readiness trước khi publish.

### Checklist

| **Item**              | **Required** |
|-----------------------|--------------|
| All pages uploaded    | Yes          |
| All tasks approved    | Yes          |
| All comments resolved | Yes          |
| Editor final approval | Yes          |
| Publication date set  | Yes          |

### Actions

Approve for Publication

Request Revision

### 10.7. Ranking Support Screen

### Route

/app/editor/ranking-support

### Purpose

Editor chuẩn bị dữ liệu để bảo vệ series trước Board.

### Display

- Ranking trend.

- Vote count.

- Reader score.

- Production progress.

- Delay reasons.

- Editor recommendation.

## 11. Editorial Board Screens

### 11.1. Board Dashboard

### Route

/app/board/dashboard

### Purpose

Board xem việc cần quyết định.

### Metric Cards

| **Card**              | **Description**     |
|-----------------------|---------------------|
| Pending Approvals     | Series chờ duyệt    |
| Votes Required        | Vote cần thực hiện  |
| At-Risk Series        | Series nguy cơ      |
| Ranking Period        | Kỳ ranking hiện tại |
| Publication Decisions | Quyết định xuất bản |
| Recent Decisions      | Quyết định gần đây  |

### 11.2. Pending Series Approval Screen

### Route

/app/board/series-approvals

### Purpose

Danh sách series chờ Board duyệt.

### Table Columns

| **Series** | **Mangaka** | **Genre** | **Submitted Date** | **Editor Rec.** | **Vote Progress** | **Status** |
|------------|-------------|-----------|--------------------|-----------------|-------------------|------------|

### 11.3. Series Approval Detail Screen

### Route

/app/board/series-approvals/:seriesId

### Purpose

Board xem summary và vote.

### Important Rule

Board chỉ xem summary, không xem page chi tiết trong MVP.

### Display Sections

1.  Series summary.

2.  Mangaka profile.

3.  Genre and target audience.

4.  Manuscript summary.

5.  Editor recommendation.

6.  Production feasibility.

7.  Vote summary.

### Vote Actions

Approve

Reject

Needs Revision

Add Reason

### Board Chair Action

Nếu tie:

Tie-break Decision

### 11.4. Ranking Table Screen

### Route

/app/board/ranking

### Purpose

Xem ranking series theo kỳ.

### Table Columns

| **Rank** | **Previous** | **Series** | **Vote Count** | **Reader Score** | **Normalized** | **Final Score** | **Status** |
|----------|--------------|------------|----------------|------------------|----------------|-----------------|------------|

### Formula Display

normalizedReaderScore = readerScore \* 10

finalScore = (voteCount \* 0.7) + (normalizedReaderScore \* 0.3)

### 11.5. Import Ranking Screen

### Route

/app/board/ranking/import

### Purpose

Board nhập vote count và reader score.

### Form Fields

| **Field**    | **Type**    | **Required** |
|--------------|-------------|--------------|
| Period       | Text/Select | Yes          |
| Series       | Select      | Yes          |
| Vote Count   | Number      | Yes          |
| Reader Score | Number 1–10 | Yes          |

### System Output

- Normalized reader score.

- Final score.

- Rank preview.

### 11.6. At-Risk Series Screen

### Route

/app/board/at-risk

### Purpose

Board xem series có nguy cơ bị hủy.

### Table Columns

| **Series** | **Current Rank** | **Previous Rank** | **Vote Trend** | **Reader Score** | **Editor Rec.** | **Actions** |
|------------|------------------|-------------------|----------------|------------------|-----------------|-------------|

### Actions

Continue

Mark Warning

Cancel Series

Request Improvement Plan

### 11.7. Board Decisions Screen

### Route

/app/board/decisions

### Purpose

Lịch sử quyết định Board.

### Table Columns

| **Date** | **Series** | **Decision** | **Vote Summary** | **Decided By** | **Tie-break** | **Detail** |
|----------|------------|--------------|------------------|----------------|---------------|------------|

## 12. Shared Screens

### 12.1. Notification Center

### Route

/app/notifications

### Purpose

Tất cả user xem thông báo.

### Notification Types

TASK_ASSIGNED

TASK_SUBMITTED

TASK_APPROVED

REVISION_REQUESTED

EDITOR_COMMENT

BOARD_DECISION

RANKING_WARNING

PAYROLL_CONFIRMED

PUBLICATION_UPDATED

### UI

- Notification list.

- Unread badge.

- Mark all as read.

- Click notification to navigate.

### 12.2. Profile Screen

### Route

/app/profile

### Display

- Avatar.

- Full name.

- Email.

- System role.

- Series memberships.

- Account status.

### 12.3. Settings Screen

### Route

/app/settings

### Sections

- Account info.

- Notification preferences.

- Theme preference.

- Language optional.

### 12.4. Unauthorized Screen

### Route

/unauthorized

### Content

You do not have permission to access this page.

Actions:

Go Back

Go to Dashboard

## 13. Page Canvas Design Specification

### 13.1. Purpose

Canvas là phần quan trọng nhất của hệ thống.

Dùng cho:

- Mangaka chọn region.

- Editor annotate.

- Assistant xem task region.

- AI region preview.

- Before/after compare.

### 13.2. Canvas Requirements

### Must Have

- Load page image.

- Zoom in/out.

- Pan image.

- Draw rectangle.

- Select rectangle.

- Resize rectangle optional.

- Delete rectangle.

- Save normalized coordinates.

- Display existing regions.

- Display annotations.

- Display task status overlay.

### Should Have

- Before/after compare slider.

- AI result overlay.

- Confidence label.

- Keyboard shortcuts.

### Could Have

- Polygon.

- Free draw.

- Layer management.

- Realtime collaboration.

### 13.3. Overlay Style

| **Overlay Type**  | **Border** | **Fill**            | **Label**       |
|-------------------|------------|---------------------|-----------------|
| Manual Region     | Cyan       | Cyan 10% opacity    | Region type     |
| AI Bubble         | Violet     | Violet 10% opacity  | AI + confidence |
| Editor Comment    | Amber      | Amber 10% opacity   | Comment         |
| Approved Task     | Emerald    | Emerald 10% opacity | Approved        |
| Rejected/Revision | Red        | Red 10% opacity     | Revision        |

### 13.4. Coordinate Rule

Canvas phải convert pixel sang normalized coordinate.

{

"x": 0.15,

"y": 0.30,

"width": 0.22,

"height": 0.08

}

Rule:

normalizedX = rectX / imageWidth

normalizedY = rectY / imageHeight

normalizedWidth = rectWidth / imageWidth

normalizedHeight = rectHeight / imageHeight

## 14. Responsive Design

### 14.1. Desktop First

Primary target:

Laptop/Desktop

1366px width and above

Lý do:

- Page canvas cần nhiều không gian.

- Annotation workflow khó dùng trên màn hình nhỏ.

### 14.2. Tablet

Tablet có thể hỗ trợ view/review cơ bản.

Changes:

- Sidebar collapses.

- Right panel becomes drawer.

- Canvas full width.

- Some table columns hidden.

### 14.3. Mobile

Mobile chỉ hỗ trợ:

- Dashboard summary.

- Notification.

- Task list.

- View detail.

- Simple approve/reject.

Không ưu tiên:

- Full annotation.

- Complex canvas workspace.

- Batch upload.

## 15. Loading & Error States

### 15.1. Loading

Use:

- Skeleton cards.

- Skeleton table.

- Spinner for upload.

- Progress bar for file upload.

- AI processing loading state.

### 15.2. Error

Error card structure:

Title

Message

Retry Button

Common errors:

- Unauthorized.

- File too large.

- Upload failed.

- AI service timeout.

- Storage signed URL expired.

- Comment unresolved prevents publish.

## 16. Important UX Rules

### 16.1. Role-Based Simplicity

Mỗi role chỉ thấy action cần thiết.

Examples:

- Assistant không thấy toàn bộ chapter.

- Board không thấy page chi tiết.

- Mangaka không finalize Board decision.

- Editor không confirm payroll.

### 16.2. Status Must Be Visible

Mọi entity quan trọng phải có status badge:

- Series.

- Chapter.

- Page.

- Task.

- Submission.

- Comment.

- Ranking.

- Payroll.

### 16.3. Dangerous Actions Require Confirmation

Danger actions:

- Delete file.

- Delete series.

- Reject submission.

- Cancel series.

- Remove member.

- Mark paid.

- Board final decision.

Confirmation dialog required.

### 16.4. Publish Must Be Blocked if Not Ready

Before publish, UI phải check:

All pages uploaded

All tasks approved

All comments resolved

Editor final approval exists

Publication date exists

Nếu thiếu, hiển thị checklist lỗi.

## 17. MVP Screen Priority

### Must Have

| **Role**  | **Screens**                                                                                                         |
|-----------|---------------------------------------------------------------------------------------------------------------------|
| Public    | Landing, Sign In, Sign Up                                                                                           |
| Common    | Profile, Notifications, Unauthorized                                                                                |
| Admin     | Dashboard, Users, Board Members, Task Rates                                                                         |
| Mangaka   | Dashboard, Series, Create Series, Series Detail, Manuscripts, Chapters, Pages, Page Workspace, Submissions, Payroll |
| Assistant | Dashboard, My Tasks, Task Detail, Submissions, Earnings                                                             |
| Editor    | Dashboard, Assigned Series, Manuscript Review, Page Review, Comment Queue, Publication Review                       |
| Board     | Dashboard, Series Approvals, Approval Detail, Ranking, Ranking Import, At-Risk Series                               |

### Should Have

- Audit logs.

- Storage usage.

- Before/after compare.

- Board decisions history.

- Global search.

- AI result history.

### Could Have

- Advanced analytics.

- Realtime activity feed.

- Mobile annotation.

- Collaboration presence.

- Advanced image diff.

## 18. Recommended Screen Build Order

### Phase 1 — Foundation UI

1\. App layout

2\. Sidebar by role

3\. Header

4\. Auth pages

5\. Dashboard shell

6\. Status badge

7\. Data table

8\. Form dialog

### Phase 2 — Mangaka Core

9\. My Series

10\. Create Series

11\. Series Detail

12\. Manuscript Upload

13\. Chapter List

14\. Page List

15\. Page Workspace

### Phase 3 — Task Flow

16\. Create Task Dialog

17\. Assistant My Tasks

18\. Assistant Task Detail

19\. Submission Upload

20\. Mangaka Submission Review

### Phase 4 — Editor Flow

21\. Editor Dashboard

22\. Manuscript Review

23\. Page Review Workspace

24\. Comment Resolution Queue

25\. Publication Review

### Phase 5 — Board Flow

26\. Board Dashboard

27\. Series Approval List

28\. Series Approval Detail

29\. Ranking Table

30\. Ranking Import

31\. At-Risk Series

### Phase 6 — Supporting Screens

32\. Payroll

33\. Notifications

34\. Admin Users

35\. Admin Board Members

36\. Task Rates

37\. Audit Logs

38\. Storage Usage

## 19. Final UI Definition of Done

A screen is done when:

1.  It uses the correct role-based layout.

2.  It has loading state.

3.  It has empty state.

4.  It has error state.

5.  It uses status badges consistently.

6.  It calls the correct API.

7.  It handles unauthorized access.

8.  It is responsive at desktop width.

9.  It follows dark technology theme.

10. It does not expose actions outside user permission.

11. It has confirmation dialog for dangerous actions.

12. It updates UI after successful mutation.

13. It shows validation errors clearly.

14. It avoids bright colors that break dark mode.

15. It can be used in the MVP demo flow.
