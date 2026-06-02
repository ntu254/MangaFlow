## **Component Design Specification — MangaFlow**

### **1. Component Design Goal**

Component system của MangaFlow cần hỗ trợ:

- UI sáng, pastel, thân thiện với workflow sáng tạo manga.

- Reusable component cho nhiều role: Mangaka, Assistant, Editor, Board, Admin.

- Dễ maintain theo feature-based frontend.

- Đồng bộ với ShadCN/ui.

- Hỗ trợ tốt cho các màn hình phức tạp như Page Workspace, Annotation, Task Review, Board Ranking và Payroll.

## **2. Component Architecture**

### **2.1. Component Grouping**

client/src/

├── shared/

│ ├── components/

│ │ ├── layout/

│ │ ├── navigation/

│ │ ├── data-display/

│ │ ├── feedback/

│ │ ├── form/

│ │ ├── upload/

│ │ ├── canvas/

│ │ └── common/

│ │

│ └── ui/

│ └── shadcn generated components

│

├── features/

│ ├── series/components/

│ ├── chapter/components/

│ ├── page/components/

│ ├── task/components/

│ ├── submission/components/

│ ├── review/components/

│ ├── board/components/

│ ├── ranking/components/

│ ├── payroll/components/

│ └── notification/components/

### **2.2. Component Rule**

| **Component Type**       | **Location**                            |
|--------------------------|-----------------------------------------|
| Dùng lại toàn app        | shared/components/                      |
| Chỉ dùng trong 1 feature | features/{feature}/components/          |
| ShadCN primitive         | shared/ui/                              |
| Page-level component     | features/{feature}/pages/               |
| Layout-level component   | layouts/ hoặc shared/components/layout/ |

## **3. Design Tokens**

### **3.1. Pastel Theme Tokens**

export const mangaFlowTheme = {

colors: {

primary: "#9065d5",

pinkPurple: "#e560bc",

rosePink: "#ff7196",

coral: "#ff9971",

softYellow: "#ffc95e",

pastelLime: "#f9f871",

bgMain: "#fff9fb",

bgSoft: "#fff3f8",

bgCard: "#ffffff",

bgSidebar: "#f8f1ff",

bgPanel: "#fff7ec",

bgCanvas: "#f7f3ff",

textPrimary: "#2f243a",

textSecondary: "#5f5270",

textMuted: "#8a7a99",

borderDefault: "#eadff6",

borderSoft: "#f3d7e7",

borderActive: "#9065d5",

},

radius: {

sm: "8px",

md: "12px",

lg: "18px",

xl: "24px",

},

shadow: {

soft: "0 8px 24px rgba(144, 101, 213, 0.10)",

card: "0 12px 32px rgba(229, 96, 188, 0.08)",

floating: "0 16px 40px rgba(47, 36, 58, 0.14)",

},

};

## **4. Shared Layout Components**

## **4.1. AppShell**

### **Purpose**

Component layout chính cho toàn bộ protected app.

### **Location**

shared/components/layout/AppShell.tsx

### **Used In**

- Admin dashboard.

- Mangaka workspace.

- Assistant task pages.

- Editor review pages.

- Board decision pages.

### **Props**

type AppShellProps = {

children: React.ReactNode;

sidebar: React.ReactNode;

header?: React.ReactNode;

};

### **Layout**

┌─────────────────────────────────────────────┐

│ Header │

├───────────────┬─────────────────────────────┤

│ Sidebar │ Main Content │

└───────────────┴─────────────────────────────┘

### **Design**

- Background: \#fff9fb.

- Sidebar background: \#f8f1ff.

- Main content max width optional.

- Content padding: 24px.

- Header height: 64px.

### **Behavior**

- Desktop: sidebar fixed.

- Tablet: sidebar collapsible.

- Mobile: sidebar drawer.

## **4.2. DashboardLayout**

### **Purpose**

Layout dùng cho dashboard từng role.

### **Location**

shared/components/layout/DashboardLayout.tsx

### **Props**

type DashboardLayoutProps = {

title: string;

description?: string;

actions?: React.ReactNode;

children: React.ReactNode;

};

### **Structure**

Page Header

Metric Cards

Main Dashboard Grid

### **Design**

- Page header có gradient text nhẹ.

- Cards dùng white background, pastel border.

- Spacing: 24px.

## **4.3. WorkspaceLayout**

### **Purpose**

Layout 3 cột cho Page Workspace, Editor Page Review.

### **Location**

shared/components/layout/WorkspaceLayout.tsx

### **Props**

type WorkspaceLayoutProps = {

leftPanel: React.ReactNode;

canvas: React.ReactNode;

rightPanel: React.ReactNode;

toolbar?: React.ReactNode;

};

### **Layout**

Left Panel: 280px

Canvas: flexible

Right Panel: 360px

### **Design**

- Left panel background: \#ffffff.

- Canvas background: \#f7f3ff.

- Right panel background: \#fff7ec.

- Border: \#eadff6.

### **Behavior**

- Desktop only full 3-column mode.

- Tablet: right panel becomes drawer.

- Mobile: workspace view-only mode.

## **5. Navigation Components**

## **5.1. RoleSidebar**

### **Purpose**

Hiển thị navigation theo role.

### **Location**

shared/components/navigation/RoleSidebar.tsx

### **Props**

type SidebarItem = {

label: string;

href: string;

icon: React.ReactNode;

badgeCount?: number;

roles?: SystemRole\[\];

};

type RoleSidebarProps = {

role: SystemRole;

items: SidebarItem\[\];

};

### **Design**

- Background: \#f8f1ff.

- Active item background: \#ffffff.

- Active item border-left: \#9065d5.

- Icon active color: \#9065d5.

- Rounded item: 14px.

### **Behavior**

- Highlight current route.

- Collapse optional.

- Badge notification supported.

## **5.2. AppHeader**

### **Purpose**

Header chung của app.

### **Location**

shared/components/navigation/AppHeader.tsx

### **Props**

type AppHeaderProps = {

breadcrumb?: BreadcrumbItem\[\];

title?: string;

actions?: React.ReactNode;

};

### **Includes**

- Breadcrumb.

- Search.

- Notification bell.

- User avatar menu.

### **Design**

- Background: rgba white.

- Border bottom: \#eadff6.

- Soft blur optional.

- Height: 64px.

## **5.3. Breadcrumbs**

### **Purpose**

Hiển thị đường dẫn hiện tại.

### **Props**

type BreadcrumbItem = {

label: string;

href?: string;

};

### **Example**

My Series / Magical Ink / Chapter 1 / Page 5

## **6. Data Display Components**

## **6.1. StatusBadge**

### **Purpose**

Hiển thị trạng thái của entity.

### **Location**

shared/components/data-display/StatusBadge.tsx

### **Props**

type StatusBadgeProps = {

status: string;

size?: "sm" \| "md";

};

### **Status Style Map**

| **Status Group** | **Background** | **Text** |
|------------------|----------------|----------|
| Draft            | \#f1edf7       | \#6d5d7c |
| In Progress      | \#ece5ff       | \#9065d5 |
| Submitted        | \#ffe6f2       | \#e560bc |
| Review           | \#fff0dc       | \#d97706 |
| Approved         | \#f4ffd2       | \#7a8f00 |
| Revision         | \#ffe7de       | \#e15f2f |
| Rejected         | \#ffe1e8       | \#e11d48 |
| At Risk          | \#fff0c2       | \#b45309 |
| Published        | \#f9f871       | \#5f6500 |

### **Example**

\<StatusBadge status="EDITOR_REVIEW" /\>

\<StatusBadge status="MANGAKA_APPROVED" /\>

\<StatusBadge status="AT_RISK" /\>

## **6.2. MetricCard**

### **Purpose**

Card số liệu cho dashboard.

### **Location**

shared/components/data-display/MetricCard.tsx

### **Props**

type MetricCardProps = {

title: string;

value: string \| number;

description?: string;

icon?: React.ReactNode;

trend?: {

value: number;

direction: "up" \| "down" \| "neutral";

};

color?: "purple" \| "pink" \| "coral" \| "yellow" \| "lime";

};

### **Design**

- Background: white.

- Border pastel.

- Soft shadow.

- Icon box dùng pastel background.

### **Example**

\<MetricCard

title="Pending Submissions"

value={8}

description="Waiting for Mangaka review"

color="pink"

/\>

## **6.3. DataTable**

### **Purpose**

Reusable table cho users, tasks, submissions, rankings, payroll.

### **Location**

shared/components/data-display/DataTable.tsx

### **Props**

type DataTableProps\<T\> = {

columns: ColumnDef\<T\>\[\];

data: T\[\];

isLoading?: boolean;

emptyState?: React.ReactNode;

pagination?: React.ReactNode;

toolbar?: React.ReactNode;

};

### **Features**

- Loading skeleton.

- Empty state.

- Sort column.

- Row action menu.

- Pagination.

- StatusBadge support.

### **Design**

- Header background: \#fff3f8.

- Row hover: \#fff7ec.

- Border: \#eadff6.

- Rounded table container.

## **6.4. EmptyState**

### **Purpose**

Hiển thị khi không có dữ liệu.

### **Props**

type EmptyStateProps = {

icon?: React.ReactNode;

title: string;

description?: string;

action?: React.ReactNode;

};

### **Example**

\<EmptyState

title="No series yet"

description="Create your first manga series to start production."

action={\<Button\>Create Series\</Button\>}

/\>

## **6.5. Timeline**

### **Purpose**

Hiển thị lịch sử workflow.

### **Used For**

- Task history.

- Board decision history.

- Submission version history.

- Comment state history.

### **Props**

type TimelineItem = {

title: string;

description?: string;

actor?: string;

timestamp: string;

status?: string;

};

type TimelineProps = {

items: TimelineItem\[\];

};

## **7. Form Components**

## **7.1. FormSection**

### **Purpose**

Group form fields theo section.

### **Props**

type FormSectionProps = {

title: string;

description?: string;

children: React.ReactNode;

};

### **Design**

- White card.

- Pastel border.

- Section title purple.

- Description muted.

## **7.2. ConfirmDialog**

### **Purpose**

Xác nhận action nguy hiểm.

### **Used For**

- Delete series.

- Reject submission.

- Cancel series.

- Remove member.

- Mark paid.

- Board final decision.

### **Props**

type ConfirmDialogProps = {

open: boolean;

title: string;

description: string;

confirmText?: string;

cancelText?: string;

variant?: "default" \| "danger" \| "warning";

onConfirm: () =\> void;

onCancel: () =\> void;

};

### **Design**

- Danger: rose/coral.

- Warning: yellow/coral.

- Default: purple.

## **7.3. RoleSelect**

### **Purpose**

Select role cho user hoặc series member.

### **Props**

type RoleSelectProps = {

value: string;

onChange: (value: string) =\> void;

scope: "SYSTEM" \| "SERIES" \| "BOARD";

};

### **Options**

#### **System**

ADMIN

MANGAKA

ASSISTANT

EDITOR

BOARD

#### **Series**

OWNER_MANGAKA

CO_MANGAKA

EDITOR

ASSISTANT

REVIEWER

#### **Board**

BOARD_MEMBER

BOARD_CHAIR

## **8. Upload Components**

## **8.1. FileUploadBox**

### **Purpose**

Upload file chung.

### **Location**

shared/components/upload/FileUploadBox.tsx

### **Props**

type FileUploadBoxProps = {

accept: string\[\];

multiple?: boolean;

maxSizeMB?: number;

maxFiles?: number;

onFilesSelected: (files: File\[\]) =\> void;

disabled?: boolean;

};

### **Design**

- Dashed border: \#e560bc.

- Background: \#fff3f8.

- Icon: upload cloud pastel purple.

- Drag active: gradient border.

### **States**

- Idle.

- Dragging.

- Uploading.

- Success.

- Error.

## **8.2. PageBatchUploader**

### **Purpose**

Upload nhiều page trong chapter.

### **Location**

features/page/components/PageBatchUploader.tsx

### **Props**

type PageBatchUploaderProps = {

chapterId: string;

maxFiles?: number; // default 50

maxSizeMB?: number; // default 50

onUploadComplete?: () =\> void;

};

### **Rules**

Max 50 pages/upload

Max 50MB/image

Supported: PNG, JPG, JPEG, WEBP

### **UI**

- Dropzone.

- File list preview.

- Upload progress.

- Error per file.

- Upload button.

## **8.3. ManuscriptUploader**

### **Purpose**

Upload manuscript PDF/images.

### **Location**

features/manuscript/components/ManuscriptUploader.tsx

### **Accept**

PDF

PNG

JPG

JPEG

WEBP

### **Props**

type ManuscriptUploaderProps = {

seriesId: string;

onUploaded?: () =\> void;

};

## **9. Series Components**

## **9.1. SeriesCard**

### **Purpose**

Hiển thị series trong grid.

### **Location**

features/series/components/SeriesCard.tsx

### **Props**

type SeriesCardProps = {

series: {

id: string;

title: string;

coverUrl?: string;

genre: string\[\];

status: string;

publicationType?: "WEEKLY" \| "MONTHLY";

currentRank?: number;

progress?: number;

updatedAt: string;

};

onClick?: () =\> void;

};

### **Design**

- White card.

- Rounded 20px.

- Cover 16:9 hoặc poster ratio.

- Pastel gradient placeholder nếu chưa có cover.

- StatusBadge.

- Progress bar dùng \#9065d5 → \#e560bc.

## **9.2. SeriesForm**

### **Purpose**

Create/update series.

### **Fields**

- Title.

- Description.

- Genre.

- Target audience.

- Publication type.

- Cover upload.

### **Props**

type SeriesFormProps = {

defaultValues?: SeriesFormValues;

mode: "create" \| "edit";

onSubmit: (values: SeriesFormValues) =\> void;

};

## **9.3. SeriesMemberTable**

### **Purpose**

Quản lý members trong series.

### **Columns**

| **Name** | **Email** | **Role** | **Status** | **Joined At** | **Actions** |
|----------|-----------|----------|------------|---------------|-------------|

### **Actions**

- Change role.

- Remove member.

- Resend invite.

## **10. Page Workspace Components**

## **10.1. PageWorkspace**

### **Purpose**

Container chính cho workspace page.

### **Location**

features/page/components/PageWorkspace.tsx

### **Props**

type PageWorkspaceProps = {

pageId: string;

mode: "MANGAKA" \| "EDITOR" \| "ASSISTANT_VIEW";

};

### **Includes**

- PageCanvas.

- PageListPanel.

- RegionPanel.

- TaskPanel.

- CommentPanel.

- AiBubblePanel.

- WorkspaceToolbar.

## **10.2. PageCanvas**

### **Purpose**

Hiển thị manga page và overlay annotation/region.

### **Location**

features/page/components/PageCanvas.tsx

### **Props**

type NormalizedRect = {

x: number;

y: number;

width: number;

height: number;

};

type CanvasOverlay = {

id: string;

type: "REGION" \| "AI_BUBBLE" \| "COMMENT" \| "TASK";

rect: NormalizedRect;

label?: string;

status?: string;

confidence?: number;

};

type PageCanvasProps = {

imageUrl: string;

imageWidth: number;

imageHeight: number;

overlays: CanvasOverlay\[\];

selectedOverlayId?: string;

mode: "view" \| "select" \| "pan" \| "annotate";

onCreateRect?: (rect: NormalizedRect) =\> void;

onSelectOverlay?: (overlayId: string) =\> void;

onUpdateOverlay?: (overlayId: string, rect: NormalizedRect) =\> void;

};

### **Must Have Behavior**

- Load image.

- Zoom in/out.

- Pan.

- Draw rectangle.

- Select overlay.

- Convert pixel coordinate to normalized coordinate.

- Render existing overlays.

- Keep overlay position correct when resized.

### **Overlay Color**

| **Type**        | **Border** | **Fill**                  |
|-----------------|------------|---------------------------|
| Manual Region   | \#9065d5   | rgba(144, 101, 213, 0.12) |
| AI Bubble       | \#e560bc   | rgba(229, 96, 188, 0.12)  |
| Editor Comment  | \#ff9971   | rgba(255, 153, 113, 0.15) |
| Approved Task   | \#c9d93b   | rgba(249, 248, 113, 0.25) |
| Revision Needed | \#ff7196   | rgba(255, 113, 150, 0.15) |

## **10.3. WorkspaceToolbar**

### **Purpose**

Toolbar cho canvas.

### **Props**

type WorkspaceToolbarProps = {

mode: "view" \| "select" \| "pan" \| "annotate";

onModeChange: (mode: string) =\> void;

onZoomIn: () =\> void;

onZoomOut: () =\> void;

onReset: () =\> void;

onRunAi?: () =\> void;

onCompare?: () =\> void;

};

### **Buttons**

Select

Rectangle

Pan

Zoom In

Zoom Out

Reset

Run AI

Compare

## **10.4. RegionPanel**

### **Purpose**

Hiển thị region đã chọn.

### **Props**

type RegionPanelProps = {

region?: Region;

canCreateTask?: boolean;

onCreateTask?: (regionId: string) =\> void;

onDeleteRegion?: (regionId: string) =\> void;

};

### **Display**

- Region type.

- Source: Manual/AI.

- Coordinates.

- Confidence.

- Linked task.

- Create Task button.

## **10.5. AiBubblePanel**

### **Purpose**

Hiển thị kết quả AI bubble detect.

### **Props**

type AiBubblePanelProps = {

pageId: string;

results: AiResult\[\];

isProcessing?: boolean;

onRunDetect: () =\> void;

onRunProcess: () =\> void;

onSaveRegions: () =\> void;

};

### **Display**

- Run bubble detect button.

- Run bubble process button.

- Processing state.

- Bubble count.

- Confidence list.

- Save regions button.

### **States**

- Not processed.

- Processing.

- Completed.

- Failed.

- Timeout.

## **10.6. BeforeAfterCompare**

### **Purpose**

So sánh version trước/sau.

### **Props**

type BeforeAfterCompareProps = {

beforeImageUrl: string;

afterImageUrl: string;

};

### **Behavior**

- Slider horizontal.

- Before label.

- After label.

- Reset slider.

## **11. Task Components**

## **11.1. CreateTaskDialog**

### **Purpose**

Tạo task từ region/page.

### **Location**

features/task/components/CreateTaskDialog.tsx

### **Props**

type CreateTaskDialogProps = {

open: boolean;

seriesId: string;

chapterId: string;

pageId: string;

regionId?: string;

onClose: () =\> void;

onCreated?: () =\> void;

};

### **Fields**

| **Field**   | **Type**    |
|-------------|-------------|
| Title       | Text        |
| Description | Textarea    |
| Task Type   | Select      |
| Assistant   | Select      |
| Priority    | Select      |
| Due Date    | Date picker |
| Base Rate   | Number      |

### **Rules**

- Assistant selector chỉ hiện assistants hợp lệ.

- Base rate auto-fill theo task type.

- Due date required.

- Title required.

- AssignedTo required.

## **11.2. TaskStatusStepper**

### **Purpose**

Hiển thị tiến trình task.

### **Props**

type TaskStatusStepperProps = {

status: TaskStatus;

};

### **Steps**

TODO

IN_PROGRESS

SUBMITTED

MANGAKA_APPROVED

EDITOR_APPROVED

### **Alternative State**

REVISION_REQUESTED

REJECTED

## **11.3. TaskCard**

### **Purpose**

Card task trong dashboard/list.

### **Props**

type TaskCardProps = {

task: {

id: string;

title: string;

type: string;

priority: string;

status: string;

dueDate?: string;

assignedTo?: string;

payment?: number;

};

};

### **Design**

- Priority color tag.

- StatusBadge.

- Due date warning nếu gần deadline.

- Payment estimate.

## **11.4. TaskDetailPanel**

### **Purpose**

Hiển thị chi tiết task.

### **Display**

- Title.

- Description.

- Series/chapter/page.

- Region preview.

- Assigned by.

- Assigned to.

- Due date.

- Status.

- Revision round.

- Payment estimate.

## **12. Submission Components**

## **12.1. SubmissionUploadForm**

### **Purpose**

Assistant upload kết quả.

### **Props**

type SubmissionUploadFormProps = {

taskId: string;

revisionRound: number;

onSubmitted?: () =\> void;

};

### **Fields**

- File upload.

- Note.

### **Rules**

- Không sửa submission cũ.

- Nếu revision requested, tạo version mới.

- Upload button disabled khi task không ở trạng thái hợp lệ.

## **12.2. SubmissionReviewPanel**

### **Purpose**

Mangaka/Editor review submission.

### **Props**

type SubmissionReviewPanelProps = {

submissionId: string;

role: "MANGAKA" \| "EDITOR";

onApprove: () =\> void;

onRequestRevision: () =\> void;

onReject: () =\> void;

};

### **Actions**

#### **Mangaka**

Approve

Request Revision

Reject

Add Comment

#### **Editor**

Final Approve

Request Revision

Reject

Resolve Comment

## **12.3. SubmissionVersionList**

### **Purpose**

Hiển thị các version submission.

### **Props**

type SubmissionVersionListProps = {

versions: Submission\[\];

currentVersion: number;

onSelectVersion: (version: number) =\> void;

};

## **13. Comment & Review Components**

## **13.1. CommentPanel**

### **Purpose**

Panel comment dùng trong page workspace, task detail, submission review.

### **Props**

type CommentPanelProps = {

targetType: "MANUSCRIPT" \| "CHAPTER" \| "PAGE" \| "TASK" \| "SUBMISSION";

targetId: string;

pageId?: string;

annotationId?: string;

currentUserRole: SystemRole;

};

### **Features**

- Comment list.

- Add comment.

- Status badge.

- Mark fixed.

- Verify fixed.

- Resolve.

- Reopen.

### **Role-based Actions**

| **Action**   | **Role**  |
|--------------|-----------|
| Mark fixed   | Assistant |
| Verify fixed | Mangaka   |
| Resolve      | Editor    |
| Reopen       | Editor    |

## **13.2. CommentItem**

### **Purpose**

Hiển thị một comment.

### **Props**

type CommentItemProps = {

comment: Comment;

actions?: React.ReactNode;

};

### **Display**

- Author.

- Content.

- Status.

- Created date.

- Updated date.

- Linked annotation button.

## **13.3. CommentStatusFlow**

### **Purpose**

Hiển thị flow trạng thái comment.

### **Steps**

OPEN

FIXED_BY_ASSISTANT

VERIFIED_BY_MANGAKA

RESOLVED_BY_EDITOR

## **13.4. ReviewActionBar**

### **Purpose**

Thanh action review.

### **Used In**

- Manuscript review.

- Page review.

- Submission review.

### **Props**

type ReviewActionBarProps = {

canApprove?: boolean;

canRequestRevision?: boolean;

canReject?: boolean;

onApprove?: () =\> void;

onRequestRevision?: () =\> void;

onReject?: () =\> void;

};

## **14. Board Components**

## **14.1. BoardVotePanel**

### **Purpose**

Board vote cho series.

### **Props**

type BoardVotePanelProps = {

seriesId: string;

currentVote?: "APPROVE" \| "REJECT" \| "NEEDS_REVISION";

canVote: boolean;

onVote: (vote: string, reason?: string) =\> void;

};

### **UI**

- Three vote cards:

  - Approve.

  - Reject.

  - Needs Revision.

- Reason textarea.

- Submit vote button.

## **14.2. VoteSummaryCard**

### **Purpose**

Hiển thị tổng quan vote.

### **Props**

type VoteSummaryCardProps = {

approve: number;

reject: number;

needsRevision: number;

totalMembers: number;

isTie?: boolean;

};

### **Display**

- Vote progress bar.

- Majority indicator.

- Tie alert.

- Chair decision needed badge.

## **14.3. TieBreakDialog**

### **Purpose**

Board Chair xử lý hòa phiếu.

### **Props**

type TieBreakDialogProps = {

open: boolean;

seriesId: string;

voteSummary: VoteSummary;

onDecision: (decision: BoardDecisionType, reason?: string) =\> void;

};

### **Only Visible To**

BOARD_CHAIR

## **14.4. BoardDecisionHistory**

### **Purpose**

Hiển thị lịch sử quyết định Board.

### **Columns**

| **Date** | **Decision** | **Vote Summary** | **Decided By** | **Tie-break** |
|----------|--------------|------------------|----------------|---------------|

## **15. Ranking Components**

## **15.1. RankingTable**

### **Purpose**

Hiển thị bảng xếp hạng.

### **Props**

type RankingTableProps = {

rankings: Ranking\[\];

showActions?: boolean;

};

### **Columns**

| **Rank** | **Previous** | **Series** | **Vote Count** | **Reader Score** | **Normalized** | **Final Score** | **Status** |
|----------|--------------|------------|----------------|------------------|----------------|-----------------|------------|

### **Formula**

normalizedReaderScore = readerScore \* 10

finalScore = (voteCount \* 0.7) + (normalizedReaderScore \* 0.3)

## **15.2. RankingImportForm**

### **Purpose**

Board nhập ranking data.

### **Props**

type RankingImportFormProps = {

period?: string;

onImport: (items: RankingImportItem\[\]) =\> void;

};

### **Fields**

- Period.

- Series.

- Vote count.

- Reader score 1–10.

### **Validation**

- Vote count \>= 0.

- Reader score \>= 1.

- Reader score \<= 10.

## **15.3. RankingFormulaCard**

### **Purpose**

Giải thích công thức ranking trong UI.

### **Display**

Reader Score Scale: 1–10

normalizedReaderScore = readerScore \* 10

finalScore = voteCount \* 0.7 + normalizedReaderScore \* 0.3

## **15.4. AtRiskBadge**

### **Purpose**

Hiển thị cảnh báo series nguy cơ.

### **Props**

type AtRiskBadgeProps = {

status: "NORMAL" \| "WARNING" \| "AT_RISK";

};

## **16. Payroll Components**

## **16.1. PayrollSummaryCard**

### **Purpose**

Tổng quan payroll.

### **Props**

type PayrollSummaryCardProps = {

month: string;

totalPending: number;

totalConfirmed: number;

totalPaid: number;

};

## **16.2. EarningTable**

### **Purpose**

Hiển thị earning theo task.

### **Columns**

| **Task** | **Assistant** | **Type** | **Base** | **Bonus/Penalty** | **Final** | **Status** |
|----------|---------------|----------|----------|-------------------|-----------|------------|

## **16.3. EarningBreakdown**

### **Purpose**

Chi tiết cách tính tiền task.

### **Props**

type EarningBreakdownProps = {

basePayment: number;

bonusRate: number;

bonusAmount: number;

penaltyAmount: number;

revisionFee: number;

finalPayment: number;

timingStatus: string;

};

### **Display Formula**

finalPayment = basePayment \* (1 + bonusRate) + revisionFee

### **Timing Badges**

| **Timing**      | **Badge**  |
|-----------------|------------|
| EARLY           | +10% Early |
| ON_TIME         | On time    |
| LATE_WITHIN_24H | -5% Late   |
| LATE            | Late       |

## **16.4. ConfirmPayoutDialog**

### **Purpose**

Mangaka xác nhận payout.

### **Props**

type ConfirmPayoutDialogProps = {

open: boolean;

earningId?: string;

month?: string;

amount: number;

onConfirm: () =\> void;

onCancel: () =\> void;

};

## **17. Notification Components**

## **17.1. NotificationBell**

### **Purpose**

Hiển thị số notification chưa đọc.

### **Props**

type NotificationBellProps = {

unreadCount: number;

};

### **Behavior**

- Click mở dropdown.

- Badge nếu unread \> 0.

- Link tới notification center.

## **17.2. NotificationDropdown**

### **Purpose**

Dropdown preview notification.

### **Props**

type NotificationDropdownProps = {

notifications: Notification\[\];

onMarkRead: (id: string) =\> void;

};

### **Display**

- Icon theo type.

- Title.

- Message short.

- Time.

- Unread indicator.

## **17.3. NotificationList**

### **Purpose**

Full notification center.

### **Features**

- Filter all/unread.

- Mark all as read.

- Delete notification.

- Click navigate.

## **18. Admin Components**

## **18.1. UserManagementTable**

### **Purpose**

Admin quản lý user.

### **Columns**

| **Avatar** | **Name** | **Email** | **Role** | **Status** | **Created At** | **Actions** |
|------------|----------|-----------|----------|------------|----------------|-------------|

### **Actions**

- View detail.

- Change role.

- Suspend.

- Activate.

## **18.2. ChangeRoleDialog**

### **Purpose**

Admin đổi role user.

### **Props**

type ChangeRoleDialogProps = {

open: boolean;

userId: string;

currentRole: SystemRole;

onSubmit: (role: SystemRole) =\> void;

};

## **18.3. BoardMemberTable**

### **Purpose**

Admin quản lý board members.

### **Actions**

- Add member.

- Set chair.

- Remove member.

- Activate/inactivate.

## **18.4. TaskRateEditor**

### **Purpose**

Admin chỉnh task rates.

### **Fields**

- Task type.

- Rate.

- Currency.

- Is active.

## **19. Feedback Components**

## **19.1. LoadingState**

### **Purpose**

Reusable loading UI.

### **Variants**

page

card

table

button

canvas

## **19.2. ErrorState**

### **Purpose**

Reusable error display.

### **Props**

type ErrorStateProps = {

title?: string;

message: string;

retryText?: string;

onRetry?: () =\> void;

};

## **19.3. UploadProgress**

### **Purpose**

Hiển thị tiến độ upload.

### **Props**

type UploadProgressProps = {

fileName: string;

progress: number;

status: "uploading" \| "success" \| "error";

errorMessage?: string;

};

## **20. Component Styling Rules**

### **20.1. General Style**

- Dùng background sáng.

- Card trắng hoặc pastel rất nhẹ.

- Border mềm.

- Shadow nhẹ.

- Rounded lớn.

- Không dùng nền đen.

- Không dùng neon gắt.

- Không dùng contrast quá mạnh.

### **20.2. Button Style**

Primary button:

Background: \#9065d5

Text: white

Hover: \#7f55c7

Secondary button:

Background: \#ffe6f2

Text: \#e560bc

Hover: \#ffd4eb

Warning button:

Background: \#ffc95e

Text: \#3a2a00

Hover: \#ffbd3d

Danger button:

Background: \#ff7196

Text: white

Hover: \#f05f86

### **20.3. Card Style**

.card {

background: \#ffffff;

border: 1px solid \#eadff6;

border-radius: 20px;

box-shadow: 0 12px 32px rgba(229, 96, 188, 0.08);

}

### **20.4. Panel Style**

.panel {

background: \#fff7ec;

border: 1px solid \#f3d7e7;

border-radius: 18px;

}

## **21. Accessibility Rules**

### **21.1. Required**

- Button phải có accessible label.

- Icon-only button phải có aria-label.

- Status không chỉ dựa vào màu, phải có text.

- Input phải có label.

- Dialog phải focus trap.

- Table action phải keyboard accessible.

- Canvas action cần có alternative panel controls.

### **21.2. Color Contrast**

Pastel UI dễ bị nhạt, nên:

- Text chính dùng \#2f243a.

- Không dùng text trắng trên màu vàng nhạt.

- Badge vàng dùng text nâu đậm.

- Button chính dùng purple với text trắng.

## **22. Component Build Priority**

### **Phase 1 — Foundation Components**

1\. AppShell

2\. RoleSidebar

3\. AppHeader

4\. StatusBadge

5\. MetricCard

6\. DataTable

7\. EmptyState

8\. ConfirmDialog

9\. LoadingState

10\. ErrorState

### **Phase 2 — Core Manga Components**

11\. SeriesCard

12\. SeriesForm

13\. SeriesMemberTable

14\. FileUploadBox

15\. ManuscriptUploader

16\. PageBatchUploader

17\. PageCanvas

18\. WorkspaceToolbar

19\. RegionPanel

20\. PageWorkspace

### **Phase 3 — Workflow Components**

21\. CreateTaskDialog

22\. TaskCard

23\. TaskStatusStepper

24\. TaskDetailPanel

25\. SubmissionUploadForm

26\. SubmissionReviewPanel

27\. CommentPanel

28\. CommentItem

29\. CommentStatusFlow

### **Phase 4 — Governance Components**

30\. BoardVotePanel

31\. VoteSummaryCard

32\. TieBreakDialog

33\. RankingTable

34\. RankingImportForm

35\. RankingFormulaCard

36\. AtRiskBadge

### **Phase 5 — Supporting Components**

37\. PayrollSummaryCard

38\. EarningTable

39\. EarningBreakdown

40\. ConfirmPayoutDialog

41\. NotificationBell

42\. NotificationDropdown

43\. UserManagementTable

44\. TaskRateEditor

## **23. Component Definition of Done**

Một component được xem là hoàn thành khi:

1.  Có TypeScript props rõ ràng.

2.  Không hardcode API trong component thuần UI.

3.  Có loading state nếu cần.

4.  Có empty state nếu cần.

5.  Có error state nếu cần.

6.  Có disabled state.

7.  Có responsive behavior tối thiểu.

8.  Dùng pastel theme đúng.

9.  Không dùng màu tối làm nền chính.

10. Không expose action sai role.

11. Có accessibility cơ bản.

12. Dễ reuse ở nhiều screen.

13. Tách logic API ra hooks hoặc service.

14. Tên component rõ nghĩa.

15. Có thể demo trong MVP flow.
