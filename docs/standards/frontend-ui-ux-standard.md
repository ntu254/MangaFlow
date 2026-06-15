# UI/UX Frontend Specification

## 1. Mục tiêu tài liệu

Tài liệu này định nghĩa tiêu chuẩn UI/UX và Frontend cho dự án, dùng làm chuẩn chung cho thiết kế giao diện, tổ chức code, xây dựng component, xử lý trạng thái, responsive, accessibility, performance và review chất lượng trước khi bàn giao.

Mục tiêu chính:

* Đảm bảo UI nhất quán trên toàn hệ thống.
* Đảm bảo UX dễ hiểu, dễ thao tác, đúng nghiệp vụ.
* Đảm bảo frontend dễ mở rộng, dễ bảo trì.
* Đảm bảo code có cấu trúc rõ ràng, có khả năng tái sử dụng.
* Đảm bảo sản phẩm đạt tiêu chuẩn production.

---

# 2. Phạm vi áp dụng

Tài liệu áp dụng cho toàn bộ frontend của dự án, bao gồm:

* Web app
* Admin dashboard
* Editor dashboard
* Board dashboard
* Assistant workspace
* Mangaka workspace
* Mobile web responsive
* Component library
* Form, table, modal, layout, navigation
* State management
* API integration
* Permission UI
* Performance
* Accessibility

---

# 3. Nguyên tắc UI/UX tổng quát

## 3.1. User-first

Mọi giao diện phải được thiết kế dựa trên nhu cầu thật của người dùng.

Mỗi màn hình cần trả lời được:

* Người dùng là ai?
* Người dùng muốn làm gì?
* Hành động chính là gì?
* Sau khi thao tác xong thì điều gì xảy ra?
* Nếu lỗi xảy ra thì người dùng sửa như thế nào?

## 3.2. Clarity first

Giao diện phải rõ ràng hơn là phức tạp.

Ưu tiên:

* Text dễ hiểu.
* Hành động chính nổi bật.
* Không nhồi quá nhiều thông tin.
* Không để người dùng phải đoán.
* Không dùng thuật ngữ kỹ thuật nếu người dùng không cần biết.

## 3.3. Consistency

Toàn bộ hệ thống phải nhất quán về:

* Màu sắc
* Font chữ
* Khoảng cách
* Button
* Form
* Modal
* Table
* Badge
* Toast
* Empty state
* Error state
* Icon
* Navigation
* Layout

## 3.4. Progressive disclosure

Không hiển thị tất cả thông tin cùng lúc.

Thông tin nên được chia theo mức độ quan trọng:

1. Nội dung chính
2. Hành động chính
3. Thông tin hỗ trợ
4. Chi tiết nâng cao
5. Log hoặc metadata

## 3.5. Feedback rõ ràng

Mọi hành động của người dùng phải có phản hồi.

Ví dụ:

* Loading khi đang xử lý.
* Toast khi thành công.
* Error message khi thất bại.
* Progress khi upload.
* Disabled state khi chưa đủ điều kiện.
* Confirm dialog với hành động nguy hiểm.

---

# 4. User Flow Specification

Trước khi code một màn hình, cần xác định user flow.

## 4.1. Mẫu user flow

```txt
User vào màn hình
→ Xem dữ liệu chính
→ Thực hiện hành động
→ Hệ thống xử lý
→ Hiển thị kết quả
→ User chuyển sang bước tiếp theo
```

## 4.2. Ví dụ flow tạo Series

```txt
Mangaka login
→ Vào Dashboard
→ Chọn Create Series
→ Nhập thông tin series
→ Upload cover
→ Validate dữ liệu
→ Save draft hoặc Submit for review
→ Hiển thị trạng thái submitted
→ Editor nhận yêu cầu review
```

## 4.3. Flow bắt buộc phải có

Mỗi feature cần mô tả đủ:

* Happy path
* Error path
* Empty path
* Permission denied path
* Loading path
* Cancel path
* Success path

---

# 5. Information Architecture

## 5.1. Nguyên tắc tổ chức thông tin

Thông tin quan trọng nhất phải được đặt ở vị trí dễ nhìn nhất.

Thứ tự ưu tiên:

1. Tiêu đề màn hình
2. Trạng thái hiện tại
3. Hành động chính
4. Nội dung chính
5. Bộ lọc hoặc công cụ phụ
6. Metadata
7. Log hoặc lịch sử

## 5.2. Ví dụ màn Chapter Review

Thông tin ưu tiên cao:

* Chapter title
* Series name
* Current status
* Preview content
* Comment panel
* Approve button
* Request changes button

Thông tin ưu tiên thấp:

* Internal ID
* Raw metadata
* Created timestamp
* Audit log

---

# 6. Design System Specification

## 6.1. Design token

Dự án cần có bộ design token thống nhất.

Bao gồm:

```txt
Color
Typography
Spacing
Radius
Shadow
Border
Z-index
Breakpoint
Icon size
Animation duration
```

## 6.2. Color system

Cần định nghĩa các nhóm màu:

```txt
Primary
Secondary
Success
Warning
Danger
Info
Neutral
Background
Surface
Border
Text primary
Text secondary
Text disabled
```

Không được hardcode màu trực tiếp trong nhiều nơi nếu không cần thiết.

Không nên:

```tsx
<div className="text-[#123456] bg-[#fafafa]" />
```

Nên:

```tsx
<div className="text-text-primary bg-surface" />
```

## 6.3. Typography

Cần có chuẩn typography:

```txt
Display
Heading 1
Heading 2
Heading 3
Body
Body small
Caption
Label
Button text
```

Mỗi typography cần định nghĩa:

* Font size
* Font weight
* Line height
* Letter spacing nếu cần

## 6.4. Spacing

Dùng spacing scale thống nhất.

Ví dụ:

```txt
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
```

Không tự đặt spacing ngẫu nhiên.

## 6.5. Component library

Các component nền tảng cần có:

```txt
Button
IconButton
Input
Textarea
Select
Checkbox
Radio
Switch
Card
Badge
Avatar
Modal
Drawer
Popover
Tooltip
Dropdown
Tabs
Toast
Alert
Skeleton
Table
Pagination
Breadcrumb
Sidebar
Navbar
EmptyState
ErrorState
Upload
DatePicker
CommandMenu
```

---

# 7. Component Architecture

## 7.1. Phân loại component

Component được chia thành các nhóm:

```txt
UI Primitive
Composite Component
Feature Component
Layout Component
Page Component
Provider Component
```

## 7.2. UI Primitive

Là component nhỏ, tái sử dụng rộng.

Ví dụ:

```txt
Button
Input
Card
Badge
Avatar
Modal
Toast
```

UI primitive không được phụ thuộc business logic hoặc API.

## 7.3. Composite Component

Là component ghép từ nhiều UI primitive.

Ví dụ:

```txt
SearchBox
StatusFilter
UserMenu
NotificationBell
ConfirmDialog
FileUploadBox
```

## 7.4. Feature Component

Là component gắn với nghiệp vụ cụ thể.

Ví dụ:

```txt
SeriesForm
ChapterReviewPanel
CommentThread
ApprovalTimeline
MangakaDashboardStats
```

## 7.5. Layout Component

Dùng để tổ chức bố cục.

Ví dụ:

```txt
AuthLayout
DashboardLayout
SettingsLayout
WorkspaceLayout
ReviewLayout
```

## 7.6. Page Component

Page component chịu trách nhiệm compose layout, gọi feature và kết nối route.

Page không nên chứa quá nhiều logic UI phức tạp.

---

# 8. Frontend Folder Structure

## 8.1. Cấu trúc đề xuất

```txt
src/
  app/
    admin/
    board/
    editor/
    assistant/
    mangaka/
    auth/

  features/
    auth/
      components/
      hooks/
      services/
      schemas/
      types.ts

    users/
      components/
      hooks/
      services/
      schemas/
      types.ts

    series/
      components/
      hooks/
      services/
      schemas/
      types.ts

    chapters/
      components/
      hooks/
      services/
      schemas/
      types.ts

    reviews/
      components/
      hooks/
      services/
      schemas/
      types.ts

    comments/
      components/
      hooks/
      services/
      schemas/
      types.ts

    notifications/
      components/
      hooks/
      services/
      schemas/
      types.ts

    dashboard/
      components/
      hooks/
      services/
      types.ts

    permissions/
      components/
      hooks/
      services/
      types.ts

  shared/
    components/
      ui/
      layout/
      feedback/
      data-display/
      form/
      navigation/

    hooks/
    lib/
    utils/
    constants/
    types/
    config/

  services/
    api-client.ts
    query-client.ts

  styles/
    globals.css
```

## 8.2. Nguyên tắc tổ chức

* Code theo feature/domain.
* Component dùng chung đặt trong shared.
* API của feature đặt trong chính feature đó.
* Type của feature đặt gần feature.
* Không gom tất cả component vào một thư mục lớn duy nhất.
* Không để page component chứa toàn bộ logic.

---

# 9. Naming Convention

## 9.1. Component name

Component dùng PascalCase.

Ví dụ:

```txt
SeriesForm
ChapterReviewPanel
UserAvatarMenu
CreateChapterPage
```

## 9.2. Hook name

Hook bắt đầu bằng `use`.

Ví dụ:

```txt
useSeriesList
useCreateSeries
useChapterDetail
useApproveChapter
```

## 9.3. Handler name

Handler cần mô tả hành động rõ ràng.

Không nên:

```txt
handleClick
doSubmit
onChangeData
```

Nên:

```txt
handleApproveChapter
handleSubmitSeriesForm
handleUploadCoverImage
handleRequestChanges
```

## 9.4. Type name

Type nên rõ domain.

Ví dụ:

```ts
type SeriesStatus = "draft" | "submitted" | "approved" | "rejected"

type ChapterStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "published"
  | "archived"
```

---

# 10. State Management Specification

## 10.1. Phân loại state

| Loại state     | Ví dụ                       | Nơi quản lý        |
| -------------- | --------------------------- | ------------------ |
| Local UI state | Modal open, tab active      | useState           |
| Form state     | Create series form          | React Hook Form    |
| Server state   | Series list, chapter detail | TanStack Query/SWR |
| Global state   | Auth user, theme, sidebar   | Zustand/Context    |
| URL state      | Search, filter, page, sort  | URL search params  |
| Derived state  | Filtered count, total       | Tính từ data gốc   |

## 10.2. Nguyên tắc

* Không đưa mọi state vào global store.
* Không duplicate state nếu có thể tính từ data gốc.
* Form state phải có validation schema.
* Server state phải có cache, loading, error, refetch.
* Filter, sort, pagination nên lưu trên URL nếu cần share link.

## 10.3. Ví dụ chuẩn

```txt
Auth user → global state
Series list → server state
Create series form → form state
Modal open → local state
Page/filter/sort → URL state
```

---

# 11. API Integration Specification

## 11.1. Nguyên tắc API layer

Component không gọi API trực tiếp nếu logic phức tạp.

Không nên:

```tsx
useEffect(() => {
  fetch("/api/series")
}, [])
```

Nên tổ chức:

```txt
features/
  series/
    services/
      series.api.ts
    hooks/
      useSeriesList.ts
      useCreateSeries.ts
```

## 11.2. API service

API service chịu trách nhiệm:

* Gọi endpoint
* Truyền params
* Nhận response
* Throw error chuẩn
* Không chứa UI logic

## 11.3. Query hook

Query hook chịu trách nhiệm:

* Loading state
* Error state
* Cache
* Refetch
* Mutation
* Optimistic update nếu cần

Ví dụ:

```tsx
const { data, isLoading, error } = useSeriesList(params)
```

## 11.4. Error format

API error nên được map thành format thống nhất:

```ts
type AppError = {
  code: string
  message: string
  fieldErrors?: Record<string, string>
}
```

---

# 12. Form UX Specification

## 12.1. Form bắt buộc có

Mỗi form cần có:

* Label rõ ràng
* Validation
* Error message dưới field
* Required/optional state
* Submit loading
* Disabled khi không hợp lệ
* Prevent double submit
* Success feedback
* Cancel hoặc back nếu cần
* Unsaved changes warning nếu form dài

## 12.2. Không dùng placeholder thay label

Không nên:

```txt
[Enter title...]
```

Nên:

```txt
Title
[Enter title...]
```

## 12.3. Validation

Validation cần có:

* Client validation
* Server validation
* Field-level error
* Form-level error

## 12.4. Upload UX

Upload cần có:

* File type validation
* File size validation
* Preview
* Upload progress
* Remove file
* Retry khi lỗi
* Error message rõ ràng

---

# 13. Table Specification

## 13.1. Table production cần có

Một table chuẩn cần hỗ trợ:

* Loading state
* Empty state
* Error state
* Search
* Filter
* Sort
* Pagination
* Row action
* Bulk action nếu cần
* Status badge
* Permission-based action
* Column responsive
* Mobile card layout nếu cần

## 13.2. Row action

Không nên hiển thị quá nhiều button trên một row.

Nên dùng:

```txt
Primary action + More menu
```

Ví dụ:

```txt
View | ...
```

Trong menu:

```txt
Edit
Assign
Approve
Request changes
Archive
```

## 13.3. Empty state

Empty state phải hướng dẫn hành động tiếp theo.

Không nên:

```txt
No data
```

Nên:

```txt
No chapters submitted yet.
When a mangaka submits a chapter, it will appear here.
```

---

# 14. Dashboard UX Specification

Dashboard phải trả lời được:

* Hôm nay người dùng cần làm gì?
* Có gì đang chờ xử lý?
* Có cảnh báo gì?
* Số liệu nào quan trọng?
* Bấm vào đâu để xử lý nhanh?

## 14.1. Dashboard nên có

```txt
Summary cards
Pending tasks
Recent activity
Quick actions
Important alerts
Charts nếu thật sự cần
Table/list công việc gần nhất
```

## 14.2. Không nên

* Nhồi quá nhiều chart.
* Hiển thị số liệu không có ý nghĩa hành động.
* Để dashboard chỉ là trang trang trí.
* Không có quick action.

---

# 15. Responsive Specification

## 15.1. Breakpoint

Dự án cần định nghĩa breakpoint rõ ràng.

Ví dụ:

```txt
Mobile: < 640px
Tablet: 640px - 1024px
Desktop: 1024px - 1440px
Large desktop: > 1440px
```

## 15.2. Layout behavior

| Thiết bị      | Layout              |
| ------------- | ------------------- |
| Mobile        | Single column       |
| Tablet        | 1-2 columns         |
| Desktop       | Sidebar + content   |
| Large desktop | Max width container |

## 15.3. Table responsive

Trên mobile, table phức tạp nên chuyển thành card list.

```txt
Desktop: Table
Mobile: Card list
```

## 15.4. Touch target

Button và interactive element trên mobile cần đủ lớn để bấm dễ.

---

# 16. Accessibility Specification

## 16.1. Keyboard navigation

Người dùng phải có thể dùng keyboard để:

* Tab qua các element
* Mở modal
* Đóng modal bằng Escape
* Submit form
* Chọn dropdown
* Di chuyển trong menu

## 16.2. Semantic HTML

Ưu tiên dùng HTML đúng nghĩa.

Không nên:

```tsx
<div onClick={handleSubmit}>Submit</div>
```

Nên:

```tsx
<button type="submit">Submit</button>
```

## 16.3. Form accessibility

Form cần:

* Label gắn với input
* Error message rõ
* Required field được thông báo
* Không chỉ dùng màu để báo lỗi

## 16.4. Icon button

Icon-only button phải có accessible label.

Ví dụ:

```tsx
<button aria-label="Delete chapter">
  <TrashIcon />
</button>
```

## 16.5. Color contrast

Text và background phải có độ tương phản đủ đọc.

Không dùng màu quá nhạt cho nội dung quan trọng.

---

# 17. Performance Specification

## 17.1. Tiêu chí chính

Frontend cần tối ưu:

* Loading speed
* Interaction speed
* Bundle size
* Image size
* API caching
* Re-render
* Large list/table
* Route splitting

## 17.2. Checklist performance

```txt
Optimize image
Lazy load route nặng
Dynamic import component nặng
Cache server state
Debounce search
Virtualize list dài
Pagination table
Không fetch trùng lặp
Không render lại không cần thiết
Không import full library nếu chỉ dùng một phần
```

## 17.3. Large data

Nếu danh sách lớn:

* Dùng pagination
* Dùng infinite scroll nếu phù hợp
* Dùng virtualization nếu render nhiều row
* Filter/sort nên xử lý server-side nếu data lớn

---

# 18. Permission UI Specification

## 18.1. Role-based UI

Frontend cần xử lý UI theo role.

Ví dụ role:

```txt
Admin
Board
Editor
Assistant
Mangaka
```

## 18.2. Nguyên tắc

* Không có quyền thì không hiển thị action.
* Nếu action bị khóa do điều kiện, disable và giải thích lý do.
* Backend vẫn phải validate quyền.
* Không tin tưởng frontend để bảo mật.

## 18.3. Ví dụ

```txt
Mangaka: Create series, upload chapter
Assistant: Prepare draft, tag content
Editor: Review, comment, request changes
Board: Approve/reject final
Admin: Manage users, roles, settings
```

---

# 19. Loading, Empty, Error, Success State

## 19.1. Loading state

Dùng:

* Skeleton cho content layout
* Spinner cho action nhỏ
* Progress bar cho upload hoặc xử lý dài

## 19.2. Empty state

Empty state cần có:

* Message rõ
* Giải thích ngắn
* CTA nếu phù hợp

Ví dụ:

```txt
No series yet.
Create your first series to start publishing chapters.
[Create Series]
```

## 19.3. Error state

Error state cần có:

* Lý do dễ hiểu
* Cách xử lý
* Retry nếu có thể

Ví dụ:

```txt
We could not load the chapter list.
Please check your connection and try again.
[Retry]
```

## 19.4. Success state

Success state cần có:

* Toast
* Redirect nếu cần
* Status update
* Clear next action

---

# 20. Toast, Modal, Dialog Specification

## 20.1. Toast

Toast dùng cho feedback ngắn.

Loại toast:

```txt
Success
Error
Warning
Info
```

Không dùng toast cho thông tin quá quan trọng cần người dùng đọc kỹ.

## 20.2. Modal

Modal dùng khi:

* Cần xác nhận hành động
* Cần nhập thông tin ngắn
* Cần tập trung vào một tác vụ

Không dùng modal cho form quá dài nếu có thể dùng page riêng.

## 20.3. Confirm dialog

Hành động nguy hiểm cần confirm.

Ví dụ:

```txt
Delete
Archive
Reject
Remove user
Cancel submission
```

Confirm dialog cần nói rõ hậu quả.

---

# 21. Frontend Security Specification

Frontend cần chú ý:

* Không lưu token nhạy cảm sai cách.
* Không expose secret key.
* Không tin dữ liệu từ client.
* Validate input.
* Escape nội dung user-generated content.
* Không render HTML tùy ý nếu chưa sanitize.
* Kiểm tra permission ở backend.
* Không hardcode credential.

---

# 22. TypeScript Specification

## 22.1. Nguyên tắc

* Không lạm dụng `any`.
* Type API response.
* Type form data.
* Type component props.
* Type enum/status.
* Dùng schema validation nếu dữ liệu từ API không chắc chắn.

## 22.2. Ví dụ

```ts
type SeriesStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "published"
  | "archived"

type Series = {
  id: string
  title: string
  description: string
  status: SeriesStatus
  coverUrl?: string
  createdAt: string
  updatedAt: string
}
```

---

# 23. Testing Specification

## 23.1. Các loại test

| Loại test         | Mục tiêu             |
| ----------------- | -------------------- |
| Unit test         | Test utils, hooks    |
| Component test    | Test component riêng |
| Integration test  | Test form, API mock  |
| E2E test          | Test flow thật       |
| Visual regression | Test UI không bị vỡ  |

## 23.2. Flow nên test

```txt
Login
Create series
Create chapter
Submit chapter
Editor review
Request changes
Approve chapter
Board final approve
Comment thread
Notification
Permission denied
```

## 23.3. UI state cần test

```txt
Loading
Empty
Error
Success
Disabled
Permission denied
Validation error
```

---

# 24. Code Review Checklist

Trước khi merge, cần kiểm tra:

```txt
UI đúng design
Responsive đầy đủ
Loading state đầy đủ
Empty state đầy đủ
Error state đầy đủ
Form validation đầy đủ
Permission UI đúng
Không hardcode bậy
Không duplicate component
Không dùng any không cần thiết
Không console.log
Không gọi API trực tiếp lung tung
Không tạo re-render không cần thiết
Naming rõ ràng
Component không quá lớn
TypeScript pass
Lint pass
Test pass
```

---

# 25. Definition of Done

Một task frontend chỉ được xem là hoàn thành khi đạt đủ:

```txt
Đúng nghiệp vụ
Đúng UI design
UX rõ ràng
Responsive
Accessible cơ bản
Loading/empty/error/success đầy đủ
API connected
Permission handled
Form validation đầy đủ
Không lỗi console
TypeScript pass
Lint pass
Test cơ bản pass
Code review pass
```

---

# 26. Tiêu chuẩn riêng cho MangaFlow

## 26.1. Role chính

```txt
Admin
Board
Editor
Assistant
Mangaka
```

## 26.2. Module chính

```txt
Auth
Dashboard
Users
Roles & Permissions
Series
Chapters
Reviews
Comments
Notifications
Uploads
Audit Log
Settings
```

## 26.3. Status chuẩn

```txt
draft
submitted
in_review
changes_requested
approved
rejected
published
archived
```

## 26.4. UI cần có cho Mangaka

```txt
Dashboard
My Series
Create Series
Edit Series
Series Detail
Create Chapter
Edit Chapter
Chapter Detail
Review Feedback
Comment Thread
Notifications
Profile
Settings
```

## 26.5. UI cần có cho Assistant

```txt
Dashboard
Assigned Tasks
Series Support
Chapter Preparation
Draft Review
Comment Support
Tagging
Metadata Suggestion
Notifications
Profile
Settings
```

## 26.6. UI cần có cho Editor

```txt
Dashboard
Review Queue
Chapter Review
Series Review
Comment Thread
Request Changes
Approval History
Notifications
Profile
Settings
```

## 26.7. UI cần có cho Board

```txt
Dashboard
Final Approval Queue
Series Approval
Chapter Approval
Decision History
Reports
Notifications
Profile
Settings
```

## 26.8. UI cần có cho Admin

```txt
Dashboard
User Management
Role Management
Permission Management
System Settings
Audit Log
Reports
Content Management
Notification Management
```

---

# 27. Frontend Quality Gate

Trước khi release, frontend cần pass các gate:

```txt
Build pass
TypeScript pass
Lint pass
Unit test pass
E2E critical flow pass
No blocking console error
Responsive check pass
Accessibility basic check pass
Performance acceptable
Permission check pass
```

---

# 28. Checklist cuối cùng cho Senior Frontend

```txt
1. Hiểu rõ user flow trước khi code
2. Biết chia kiến trúc frontend theo feature
3. Xây được design system
4. Tạo component tái sử dụng tốt
5. Quản lý state đúng loại
6. Kết nối API có layer rõ ràng
7. Xử lý đủ loading/empty/error/success
8. Làm form UX chuẩn
9. Làm table/dashboard chuẩn production
10. Responsive tốt
11. Có accessibility cơ bản
12. Có performance mindset
13. Biết xử lý permission UI
14. Viết TypeScript rõ ràng
15. Có testing cho flow quan trọng
16. Code dễ đọc, dễ review, dễ mở rộng
17. Không chỉ code đẹp mà phải đúng nghiệp vụ
```

---

# 29. Kết luận

Frontend senior không chỉ chịu trách nhiệm dựng giao diện. Frontend senior phải đảm bảo toàn bộ trải nghiệm người dùng, kiến trúc giao diện, khả năng mở rộng, khả năng bảo trì, hiệu năng, accessibility và chất lượng production.

Một UI đạt chuẩn không chỉ là “đẹp”, mà phải:

```txt
Dễ hiểu
Dễ dùng
Đúng nghiệp vụ
Nhanh
Ổn định
Accessible
Dễ mở rộng
Dễ bảo trì
Dễ test
Dễ bàn giao
```
