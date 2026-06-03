UI/UX Quality & Frontend Engineering Specification
1. Mục tiêu

Đảm bảo toàn bộ giao diện hệ thống đạt các tiêu chí:

Dễ sử dụng
Nhất quán
Responsive trên nhiều thiết bị
Hiệu năng tốt
Dễ bảo trì
Dễ mở rộng
Có khả năng kiểm thử
Xử lý đầy đủ các trạng thái dữ liệu và lỗi
2. Phạm vi áp dụng

Áp dụng cho toàn bộ màn hình
3. Thiết kế cấu trúc màn hình và luồng điều hướng
Mục tiêu

Xác định rõ:

Danh sách màn hình
Chức năng từng màn hình
Luồng di chuyển giữa các màn hình
Yêu cầu
Screen Inventory

Mỗi màn hình phải có:

Thuộc tính	Mô tả
Screen Name	Tên màn hình
URL	Route
Purpose	Mục đích
Actor	Ai sử dụng
Entry Point	Điểm vào
Exit Point	Điểm ra
User Flow Diagram

Phải thiết kế:

Happy Flow
Error Flow
Permission Flow

4. Thiết kế Layout Responsive
Breakpoint
Device	Width
Mobile	<768px
Tablet	768-1023px
Desktop	1024-1439px
Large Desktop	>=1440px
Layout Rules
Mobile
Single column
Drawer navigation
Sticky bottom actions
Tablet
Hybrid layout
Desktop
Sidebar
Multi-column layout
Responsive Checklist

Kiểm tra:

Overflow
Horizontal scroll
Text wrapping
Table responsiveness
Modal responsiveness
5. Tách UI thành Component nhỏ
Mục tiêu

Tăng khả năng:

Reuse
Testing
Maintainability
Quy tắc
Atomic Design
Atoms
 ↓
Molecules
 ↓
Organisms
 ↓
Pages

Ví dụ:

Button
Input
Avatar

↓

SearchBox
UserCard

↓

TaskTable
SubmissionPanel

↓

TaskPage
Component Rules

Component phải:

Single Responsibility
Reusable
Stateless nếu có thể
6. Quản lý State UI
Các loại State
Local State
useState()

Ví dụ:

Modal Open
Tab Active
Dropdown Open
Server State

Ví dụ:

Tasks
Series
Submissions
Notifications

Khuyến nghị:

TanStack Query
Global State

Ví dụ:

Auth User
Theme
Permissions

Khuyến nghị:

Zustand
Redux Toolkit
7. Xử lý dữ liệu từ Database/API
Quy trình chuẩn
Request
 ↓
Loading
 ↓
Success/Error
 ↓
Render
Bắt buộc
Loading State
<Skeleton />
Error State
<ErrorState />
Empty State
<EmptyState />
Retry
<Button>Retry</Button>
Không được
Blank Screen
Console Error
Infinite Loading
8. Xử lý vấn đề hình ảnh
Các lỗi thường gặp
Link hỏng

Hiển thị:

Fallback Image
Hình tải chậm

Sử dụng:

loading="lazy"
Hình sai tỉ lệ

Sử dụng:

object-fit: cover;
Hình quá lớn

Yêu cầu:

WebP
AVIF
Placeholder

Trước khi load:

<ImageSkeleton />
9. Thiết kế UI nhất quán
Design System

Phải định nghĩa:

Color
Primary
Secondary
Success
Warning
Error
Typography
Heading
Body
Caption
Spacing
4
8
12
16
24
32
48
Border Radius
4
8
12
16
Không được
Random spacing
Random font size
Random color
10. Tối ưu hiệu năng UI
Code Splitting

Bắt buộc:

React.lazy()
Suspense()
Lazy Loading

Áp dụng cho:

Images
Routes
Heavy Components
Memoization
useMemo()
useCallback()
React.memo()
Performance Targets
Metric	Target
FCP	< 2s
LCP	< 2.5s
TTI	< 3s
11. Xử lý lỗi giao diện thường gặp
Layout Error

Ví dụ:

Overflow
Broken Grid
Collapsed Layout
Data Error

Ví dụ:

Null
Undefined
Missing Field
Network Error

Ví dụ:

Timeout
500 Error
Offline
UI Rule

Không được để:

White Screen
Crash
Unhandled Error
12. Tương tác người dùng và phản hồi UI
Loading Feedback

Ví dụ:

Spinner
Skeleton
Progress Bar
Action Feedback

Ví dụ:

Save thành công
Upload thất bại
Task được tạo
Visual Feedback

Ví dụ:

Hover
Focus
Active
Disabled
13. Thiết kế UI cho trạng thái đặc biệt

Mỗi màn hình phải có đầy đủ:

Loading State
Đang tải dữ liệu...
Empty State
Chưa có dữ liệu
Error State
Đã xảy ra lỗi
Success State
Lưu thành công
Unauthorized State
Bạn không có quyền truy cập
No Internet State
Không có kết nối mạng
14. Accessibility & Usability
Accessibility

Bắt buộc:

Keyboard Navigation
Tab
Enter
Esc
ARIA

Ví dụ:

aria-label
aria-describedby
Contrast

Theo tiêu chuẩn:

WCAG AA
Focus State

Người dùng luôn biết đang focus ở đâu.

Usability

Kiểm tra:

Dễ học
Dễ tìm chức năng
Dễ sửa lỗi
Ít thao tác
15. Kiểm thử UI
Unit Test

Kiểm tra:

Component rendering
Button click
Form validation

Công cụ:

Vitest
Jest
RTL
Integration Test

Kiểm tra:

Form → API → UI Update

Task → Submission → Review

Login → Dashboard
E2E Test

Kiểm tra:

End-to-End User Journey

Ví dụ:

Login
 ↓
Create Series
 ↓
Assign Task
 ↓
Submit Work
 ↓
Approve Submission

Công cụ:

Playwright
Cypress
16. Definition of Done (DoD)

Một màn hình chỉ được xem là hoàn thành khi:

Có responsive đầy đủ
Có loading state
Có empty state
Có error state
Có success state
Có unauthorized state
Có fallback image
Có accessibility cơ bản
Có unit test
Có integration test
Không có console error
Lighthouse ≥ 90
Không có layout overflow
Không có route lỗi
Không có crash khi dữ liệu null
17. Checklist Review UI/UX

Trước khi merge PR phải kiểm tra:

 Responsive Mobile
 Responsive Tablet
 Responsive Desktop
 Loading State
 Empty State
 Error State
 Success State
 Unauthorized State
 No Internet State
 Image Fallback
 Skeleton Loading
 Keyboard Navigation
 ARIA Labels
 Consistent Design System
 No Layout Overflow
 No Console Error
 Unit Test Pass
 Integration Test Pass
 E2E Test Pass
 Lighthouse ≥ 90