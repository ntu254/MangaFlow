# MangaFlow — Mangaka Flow & Canonical States

## 1. Nguyên tắc tổng quan

MangaFlow là hệ thống production manga theo luồng:

```txt
Mangaka tạo Series Proposal
→ Editor review
→ Board duyệt Series
→ Mangaka sản xuất Chapter/Page
→ Mangaka tạo Task và assign Assistant
→ Assistant submit work
→ Mangaka review
→ Editor final approve
→ Chapter ready for publication
→ Publication / Ranking / Payroll
```

Các nguyên tắc quan trọng:

```txt
1. Mangaka là owner/producer/first reviewer.
2. Editor là final quality gate cho task/submission.
3. Board chỉ duyệt Series và ra quyết định cấp Series, không approve Chapter trong MVP.
4. Assistant chỉ làm Task được assign, không có quyền thao tác chapter-level.
5. Payroll chỉ sinh sau khi Task đạt EDITOR_APPROVED.
6. Raw AuditLog là internal, UI thường chỉ hiển thị user-safe activity.
7. Production Hub, Page Studio, Task Studio là UI/screen layer, không phải core DB entity.
```

---

# 2. Role boundary

## Mangaka

Mangaka được:

```txt
- Tạo Series Proposal
- Upload manuscript draft / cover draft / concept / reference
- Submit proposal cho Editor
- Tạo Chapter sau khi Series ONGOING
- Upload / replace / delete / reorder Page nếu chưa có active task
- Mở Page Studio
- Tạo Region
- Tạo Task cho Page/Region
- Assign Assistant đủ điều kiện
- Review submission của Assistant
- Approve / request revision / reject ở bước Mangaka review
- Xem readiness blockers của Chapter
```

Mangaka không được:

```txt
- Approve Series
- Final approve Task
- Approve Chapter trực tiếp
- Mark ready for publication nếu role không phải Editor/Admin
- Xử lý payroll/payment
- Thấy raw AuditLog
- Làm Board action
```

## Editor

Editor được:

```txt
- Review Series Proposal
- Request revision / reject / forward to Board
- Tạo/manage task nếu được phép
- Final review Task Submission
- Editor approve / request revision / reject
- Run readiness check
- Mark Chapter READY_FOR_PUBLICATION khi đủ điều kiện
```

Editor không approve trực tiếp toàn bộ Chapter nếu task chưa `EDITOR_APPROVED`.

## Board

Board được:

```txt
- Review Series do Editor forward
- Approve/reject Series Proposal
- Quyết định publicationType: WEEKLY hoặc MONTHLY
- Ra quyết định cấp Series theo ranking/performance:
  CONTINUE / WARNING / CANCEL / COMPLETE
```

Board không approve Chapter trong MVP.

## Assistant

Assistant được:

```txt
- Xem task được assign
- Làm việc trong Task Studio
- Submit work version
- Xem comment/context liên quan task của mình
```

Assistant không được:

```txt
- Xem toàn bộ Series/Chapter/Page nếu không được assign
- Tạo/manage task
- Approve submission
- Dùng Chapter Production Overview như workspace chính
```

---

# 3. Series lifecycle

## Series status

Dùng canonical enum:

```ts
type SeriesStatus =
  | "DRAFT"
  | "EDITOR_REVIEW"
  | "REVISION_REQUESTED"
  | "BOARD_REVIEW"
  | "ONGOING"
  | "AT_RISK"
  | "CANCELLED"
  | "COMPLETED"
  | "ARCHIVED"
  | "REJECTED"
  | "WITHDRAWN";
```

Không dùng `APPROVED` làm main status. Sau khi Board duyệt, Series chuyển sang:

```txt
ONGOING
```

Nếu cần lưu dấu duyệt, dùng metadata:

```ts
approvedAt?: Date;
approvedBy?: UserId;
publicationType?: "WEEKLY" | "MONTHLY";
```

## Series transition

```txt
DRAFT
→ Mangaka submit
→ EDITOR_REVIEW

EDITOR_REVIEW
→ Editor request revision
→ REVISION_REQUESTED

REVISION_REQUESTED
→ Mangaka upload revision / resubmit
→ EDITOR_REVIEW

EDITOR_REVIEW
→ Editor forward to Board
→ BOARD_REVIEW

BOARD_REVIEW
→ Board approve
→ ONGOING

BOARD_REVIEW / EDITOR_REVIEW
→ Rejected
→ REJECTED

DRAFT / EDITOR_REVIEW / REVISION_REQUESTED
→ Mangaka withdraw
→ WITHDRAWN

ONGOING
→ Ranking/performance warning
→ AT_RISK

AT_RISK
→ Board continue
→ ONGOING

ONGOING / AT_RISK
→ Board cancel
→ CANCELLED

ONGOING
→ Story finished
→ COMPLETED

Any inactive/old state
→ ARCHIVED
```

---

# 4. Manuscript Version lifecycle

Manuscript là tài liệu proposal/revision của Series. Không trộn với production pages.

## Manuscript Version status

```ts
type ManuscriptVersionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";
```

## Rule version

```txt
Upload lần đầu → tạo Version 1
Editor request revision → Mangaka upload lại → tạo Version 2
Request revision tiếp → upload lại → tạo Version 3
```

Không được upload một lần mà tự sinh Version 1, 2, 3.

## Manuscript file asset types

```ts
type ManuscriptAssetType =
  | "manuscript"
  | "cover_draft"
  | "character_concept"
  | "reference_image"
  | "other";
```

## R2 path đề xuất

```txt
series/{seriesSlug}-{seriesShortId}/manuscripts/v{versionNumber}-{versionShortId}/{assetType}/{fileAssetShortId}.{ext}
```

Ví dụ:

```txt
series/one-piece-6856a1/manuscripts/v1-6856b2/manuscript/6856c1.pdf
series/one-piece-6856a1/manuscripts/v1-6856b2/cover-draft/6856c2.jpg
series/one-piece-6856a1/manuscripts/v1-6856b2/character-concept/6856c3.png
```

UI tab Manuscript phải render từ DB metadata. Nếu R2 object bị xóa tay nhưng DB còn FileAsset, UI vẫn có thể hiện file. Khi preview/download fail, hệ thống nên báo:

```txt
File missing from storage
```

---

# 5. Chapter lifecycle

Chapter chỉ được tạo sau khi Series đã `ONGOING`.

## Chapter status

```ts
type ChapterStatus =
  | "DRAFT"
  | "IN_PRODUCTION"
  | "READY_FOR_PUBLICATION"
  | "PUBLISHED"
  | "ARCHIVED";
```

Không dùng `SCHEDULED` trong Chapter status. Nếu có lịch đăng, dùng `Publication.status = SCHEDULED`.

## Chapter transition

```txt
DRAFT
→ Upload page thành công
→ IN_PRODUCTION

IN_PRODUCTION
→ Tất cả required task đạt EDITOR_APPROVED
→ READY_FOR_PUBLICATION

READY_FOR_PUBLICATION
→ Publish
→ PUBLISHED

Any inactive/old chapter
→ ARCHIVED
```

## Chapter deletion rule

```txt
DRAFT, chưa có page/task/submission
→ cho Delete chapter

IN_PRODUCTION, có pages nhưng chưa có task/submission
→ có thể Delete với confirm + cascade cleanup

Có active task/submission/editor approved/published
→ không hard delete
→ dùng Cancel / Archive / Unpublish tùy giai đoạn
```

---

# 6. Page lifecycle

Page là production object thuộc Chapter.

## Page status

```ts
type PageStatus =
  | "PENDING"
  | "UPLOADING"
  | "PROCESSING"
  | "UPLOADED"
  | "PROCESSING_FAILED"
  | "IN_TASK"
  | "APPROVED"
  | "LOCKED";
```

## Page Studio gate

Chỉ mở Page Studio khi:

```ts
page.status === "UPLOADED" && Boolean(page.workingFileAssetId);
```

Nếu chưa đủ điều kiện:

```txt
PENDING / UPLOADING / PROCESSING
→ Processing assets…

PROCESSING_FAILED
→ Page processing failed. Retry upload or replace page.

UPLOADED nhưng thiếu workingFileAssetId
→ Missing working image.
```

## Page file assets

Page upload cần 3 asset:

```txt
Original
Working Image
Thumbnail
```

R2 path đề xuất:

```txt
series/{seriesSlug}-{seriesShortId}/chapters/ch{chapterNumber}-{chapterShortId}/pages/p{pageNumber}-{pageShortId}/{assetRole}/{fileAssetShortId}.{ext}
```

Ví dụ:

```txt
series/one-piece-6856a1/chapters/ch13-6860c1/pages/p018-6860d2/original/6860e1.png
series/one-piece-6856a1/chapters/ch13-6860c1/pages/p018-6860d2/working/6860e2.webp
series/one-piece-6856a1/chapters/ch13-6860c1/pages/p018-6860d2/thumbnail/6860e3.webp
```

## Page delete / replace / reorder rule

```txt
Page chưa có task
→ Allow delete / replace / reorder

Page có active task
→ Block delete / replace / reorder
→ Tooltip: “This page has active tasks. Cancel or finish tasks first.”

Page có submission / approved task / published chapter
→ Không hard delete từ UI thường
```

MVP an toàn:

```txt
Nếu chapter đã có bất kỳ active task nào
→ disable global reorder
```

---

# 7. Region lifecycle

Region là vùng thao tác trong Page Studio, dùng làm target cho task hoặc annotation.

## Region status gợi ý

```ts
type RegionStatus = "ACTIVE" | "LOCKED" | "DELETED";
```

## Coordinate rule

Region coordinates phải lưu theo Working Image, không lưu theo viewport/canvas hiện tại.

Nên dùng normalized bounds:

```ts
type NormalizedRegionBounds = {
  x: number; // 0..1 relative to working image width
  y: number; // 0..1 relative to working image height
  width: number; // 0..1 relative to working image width
  height: number; // 0..1 relative to working image height
};
```

Validation:

```txt
x >= 0
y >= 0
width > 0
height > 0
x + width <= 1
y + height <= 1
```

## Region delete rule

```txt
Region chưa có active task
→ Allow delete with confirm

Region có active task
→ Block delete
→ Tooltip: “This region has active tasks. Cancel or finish those tasks first.”
```

---

# 8. SeriesMember / Team lifecycle

Production Team là UI layer. Entity thật nên là `SeriesMember`.

## SeriesMember status

```ts
type SeriesMemberStatus = "INVITED" | "ACTIVE" | "PAUSED" | "REMOVED";
```

Assistant eligible khi:

```txt
User role = ASSISTANT
User active
SeriesMember.status = ACTIVE
Không bị conflict nếu có rule workload/deadline
```

Team membership không có nghĩa Assistant được thấy toàn bộ Series/Chapter/Page. Assistant chỉ thấy task được assign.

---

# 9. Task lifecycle

Task là đơn vị công việc chính trong production.

## Task status

```ts
type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "MANGAKA_APPROVED"
  | "EDITOR_APPROVED"
  | "REJECTED"
  | "CANCELLED";
```

UI label:

```txt
TODO → Assigned
IN_PROGRESS → In progress
SUBMITTED → Waiting Mangaka review
REVISION_REQUESTED → Revision requested
MANGAKA_APPROVED → Waiting Editor final review
EDITOR_APPROVED → Final approved
REJECTED → Rejected
CANCELLED → Cancelled
```

## Active task statuses

```txt
TODO
IN_PROGRESS
SUBMITTED
REVISION_REQUESTED
MANGAKA_APPROVED
```

## Finished task statuses

```txt
EDITOR_APPROVED
REJECTED
CANCELLED
```

## Task transition

```txt
TODO
→ Assistant start
→ IN_PROGRESS

IN_PROGRESS
→ Assistant submit
→ SUBMITTED

SUBMITTED
→ Mangaka approve
→ MANGAKA_APPROVED

SUBMITTED
→ Mangaka request revision
→ REVISION_REQUESTED

REVISION_REQUESTED
→ Assistant resubmit
→ SUBMITTED

MANGAKA_APPROVED
→ Editor final approve
→ EDITOR_APPROVED

MANGAKA_APPROVED
→ Editor request revision
→ REVISION_REQUESTED

SUBMITTED / MANGAKA_APPROVED
→ Reviewer reject
→ REJECTED

TODO / IN_PROGRESS / REVISION_REQUESTED
→ Authorized user cancel
→ CANCELLED
```

## Duplicate active task guard

Không được tạo duplicate active task cho cùng:

```txt
targetType + targetId + taskType
```

Ví dụ không tạo 2 task `LETTERING` active cho cùng một Region.

---

# 10. Submission lifecycle

Submission là từng lần Assistant nộp bài. Submission phải versioned, không overwrite bản cũ.

## Submission status

```ts
type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "MANGAKA_APPROVED"
  | "EDITOR_APPROVED"
  | "REJECTED";
```

## Submission transition

```txt
DRAFT
→ Assistant submit
→ SUBMITTED

SUBMITTED
→ Mangaka approve
→ MANGAKA_APPROVED

SUBMITTED
→ Mangaka request revision
→ REVISION_REQUESTED

REVISION_REQUESTED
→ Assistant submit new version
→ SUBMITTED

MANGAKA_APPROVED
→ Editor final approve
→ EDITOR_APPROVED

MANGAKA_APPROVED
→ Editor request revision
→ REVISION_REQUESTED

SUBMITTED / MANGAKA_APPROVED
→ Reject
→ REJECTED
```

Mangaka approve chưa tạo earning. Earning chỉ tạo sau `EDITOR_APPROVED`.

---

# 11. Review flow

## Assistant submit

```txt
Assistant làm task trong Task Studio
→ Upload submission asset / note
→ Submit
→ Task.status = SUBMITTED
→ Submission.status = SUBMITTED
→ Notification gửi cho Mangaka
```

## Mangaka review

Mangaka thấy queue:

```txt
Pending Mangaka review
```

Action:

```txt
Approve
→ Task.status = MANGAKA_APPROVED
→ Submission.status = MANGAKA_APPROVED
→ Chuyển sang Editor final review

Request changes
→ Task.status = REVISION_REQUESTED
→ Submission.status = REVISION_REQUESTED
→ Bắt buộc có feedback

Reject
→ Task.status = REJECTED
→ Submission.status = REJECTED
```

## Editor final review

Editor thấy queue:

```txt
Pending Editor final review
```

Action:

```txt
Final approve
→ Task.status = EDITOR_APPROVED
→ Submission.status = EDITOR_APPROVED
→ Earning eligible

Request changes
→ Task.status = REVISION_REQUESTED
→ Submission.status = REVISION_REQUESTED

Reject
→ Task.status = REJECTED
→ Submission.status = REJECTED
```

---

# 12. Chapter readiness

Chapter chỉ chuyển `READY_FOR_PUBLICATION` khi:

```txt
Tất cả required task của chapter đạt EDITOR_APPROVED
Không còn pending Mangaka review
Không còn pending Editor final review
Không còn required page/task blocker
```

Editor/Admin mới được:

```txt
Mark ready for publication
```

Mangaka có thể xem readiness blockers nhưng không trực tiếp final approve chapter.

---

# 13. Publication lifecycle

## Publication status

```ts
type PublicationStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "PUBLISHED"
  | "FAILED"
  | "CANCELLED";
```

Publication scheduling nằm sau Chapter `READY_FOR_PUBLICATION`.

Rule:

```txt
Chapter.status = READY_FOR_PUBLICATION
→ Create Publication SCHEDULED
→ Publish thành công
→ Publication.status = PUBLISHED
→ Chapter.status = PUBLISHED
```

Không đưa `SCHEDULED` vào Chapter status.

---

# 14. Ranking / Board decision

Ranking là flow sau khi chapter/series đã có dữ liệu reader/performance.

## Series ranking decision

```ts
type BoardDecision = "CONTINUE" | "WARNING" | "CANCEL" | "COMPLETE";
```

Mapping:

```txt
CONTINUE
→ Series.status = ONGOING

WARNING
→ Series.status = AT_RISK

CANCEL
→ Series.status = CANCELLED

COMPLETE
→ Series.status = COMPLETED
```

Board decision là cấp Series/ranking, không phải approval cấp Chapter trong MVP.

---

# 15. Earnings lifecycle

Assistant earning chỉ sinh sau khi Task đạt `EDITOR_APPROVED`.

## AssistantEarning status

```ts
type AssistantEarningStatus = "PENDING" | "CONFIRMED" | "PAID" | "VOID";
```

Rule:

```txt
Task.status = MANGAKA_APPROVED
→ chưa tạo earning

Task.status = EDITOR_APPROVED
→ tạo earning eligible / pending

Admin/Finance confirm
→ CONFIRMED

Payment tracking complete
→ PAID
```

Payment thực tế có thể ngoài hệ thống; MangaFlow chỉ tracking.

---

# 16. Comment / Annotation / Activity

## Feedback status

```ts
type FeedbackStatus = "OPEN" | "RESOLVED" | "REOPENED";
```

Comment/annotation phải gắn target rõ:

```txt
Series
Chapter
Page
Region
Task
Submission
```

Activity tab không render raw AuditLog. Chỉ hiển thị whitelist event an toàn:

```txt
page uploaded
task created
task assigned
task reassigned
submission submitted
submission approved
submission rejected
chapter marked ready
chapter published
```

Ẩn:

```txt
internal admin audit
payout
role grant
system fields
security-sensitive logs
```

---

# 17. Notification status

```ts
type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED";
```

Events quan trọng cho Mangaka:

```txt
SERIES_REVISION_REQUESTED
SERIES_APPROVED
TASK_SUBMITTED
TASK_REVISION_REQUESTED
TASK_MANGAKA_APPROVED
TASK_EDITOR_APPROVED
CHAPTER_READY_FOR_PUBLICATION
PUBLICATION_SCHEDULED
CHAPTER_PUBLISHED
```

---

# 18. Delete / Withdraw / Archive rules

## Series

```txt
DRAFT, chưa submit, chưa có production data
→ Delete draft

EDITOR_REVIEW / REVISION_REQUESTED / BOARD_REVIEW
→ Withdraw proposal

ONGOING / AT_RISK
→ Request cancellation hoặc Board/Admin cancel

PUBLISHED data / payroll / ranking history
→ Không hard delete từ UI thường
→ Archive / Cancel / Complete
```

## Chapter

```txt
DRAFT, chưa có page/task
→ Delete chapter

IN_PRODUCTION, có page nhưng chưa có task/submission
→ Delete chapter allowed with confirm + cleanup

Có task/submission/approved/published
→ Block hard delete
→ Cancel / Archive / Unpublish tùy stage
```

## Page

```txt
Chưa có task
→ Delete / Replace / Reorder allowed

Có active task
→ Block delete / replace / reorder

Có submission / approved / published
→ Không hard delete từ normal UI
```

## Region

```txt
Chưa có active task
→ Delete allowed with confirm

Có active task
→ Block delete
```

Nên ưu tiên soft delete:

```ts
deletedAt?: Date;
deletedBy?: UserId;
deleteReason?: string;
archivedAt?: Date;
```

Cleanup R2 nên chạy sau hoặc qua queue để tránh DB còn metadata nhưng R2 đã mất object.

---

# 19. Frontend screen mapping cho Mangaka

## `/app/series/new`

Wizard:

```txt
Basic Info
→ Pitch
→ Manuscript
→ Review & Submit
```

Action:

```txt
Save draft
Upload manuscript files
Submit for Editor review
```

## `/app/series/$id`

Tabs gợi ý:

```txt
Overview
Chapters
Team
Tasks
Reviews
Manuscript
Activity
```

## `/app/chapters/$id`

Chapter Production Overview:

```txt
Pages
Tasks
Reviews
Readiness
Comments
Activity
```

Không có:

```txt
Submit chapter for review
Approve chapter
Board approve chapter
Assistant chapter-level action
Payout column
```

## `/app/pages/$id/studio`

Page Studio:

```txt
Load Working Image
Draw/select/update/delete Region
View Original in read-only compare mode
No AI/realtime in basic scope
```

## `/app/tasks/$id/studio`

Task Studio cho Assistant:

```txt
View assigned task context
Upload work
Submit version
Read related feedback
```

---

# 20. State summary

## Series

```txt
DRAFT
EDITOR_REVIEW
REVISION_REQUESTED
BOARD_REVIEW
ONGOING
AT_RISK
CANCELLED
COMPLETED
ARCHIVED
REJECTED
WITHDRAWN
```

## Manuscript Version

```txt
DRAFT
SUBMITTED
REVISION_REQUESTED
APPROVED
REJECTED
ARCHIVED
```

## Chapter

```txt
DRAFT
IN_PRODUCTION
READY_FOR_PUBLICATION
PUBLISHED
ARCHIVED
```

## Page

```txt
PENDING
UPLOADING
PROCESSING
UPLOADED
PROCESSING_FAILED
IN_TASK
APPROVED
LOCKED
```

## SeriesMember

```txt
INVITED
ACTIVE
PAUSED
REMOVED
```

## Task

```txt
TODO
IN_PROGRESS
SUBMITTED
REVISION_REQUESTED
MANGAKA_APPROVED
EDITOR_APPROVED
REJECTED
CANCELLED
```

## Submission

```txt
DRAFT
SUBMITTED
REVISION_REQUESTED
MANGAKA_APPROVED
EDITOR_APPROVED
REJECTED
```

## Publication

```txt
DRAFT
SCHEDULED
PUBLISHED
FAILED
CANCELLED
```

## Earning

```txt
PENDING
CONFIRMED
PAID
VOID
```

## Feedback

```txt
OPEN
RESOLVED
REOPENED
```

## Notification

```txt
UNREAD
READ
ARCHIVED
```

---

# 21. Chốt nghiệp vụ

```txt
Mangaka tạo và điều phối production.
Assistant chỉ làm task được assign.
Mangaka review bước 1.
Editor final approve bước 2.
Board duyệt Series/ranking, không duyệt Chapter MVP.
Chapter ready chỉ khi mọi required task EDITOR_APPROVED.
Payroll chỉ sinh sau EDITOR_APPROVED.
Không hard delete entity đã đi sâu vào production.
```
