# Live E2E User-flow Report — 2026-07-28

## Kết luận

Đã chạy 59 scenario bằng Playwright Chromium thật qua frontend, backend, MongoDB và
AI service. Toàn bộ case pass; không có skip, flaky, stderr hoặc lỗi ngoài dự
kiến.

| Chỉ số | Kết quả |
| --- | ---: |
| Tổng test | 59 |
| Pass | 59 |
| Fail / Skip / Flaky | 0 / 0 / 0 |
| Chuỗi nghiệp vụ xuyên role | 35/35 |
| Vòng đời Assistant task | 7/7 |
| Board cancel / no-quorum | 3/3 |
| Proposal revision / reject / withdraw | 5/5 |
| Board reject độc lập | 1/1 |
| Region → Task → Submission → Approval | 1/1 |
| Material version/review/immutability | 1/1 |
| Route theo role | 28/28 route trong 5 phiên actor |
| AI health contract | 1/1 |
| Thời gian | 311.242 giây |
| Ảnh bằng chứng | 75 |

Browser diagnostics chỉ ghi nhận các response `409` có chủ đích: Admin thử tạo
Board member thứ sáu, Tantou thử publish trước `scheduledAt`, và Editor thử xóa
Material đã `APPROVED`. Đây là các kiểm thử guard, không phải lỗi hồi quy.

## Môi trường

| Thành phần | Địa chỉ |
| --- | --- |
| Frontend E2E | `http://localhost:3100` |
| Backend E2E | `http://localhost:3101` |
| AI service | `http://localhost:8000` |
| MongoDB | `mongodb://127.0.0.1:27017/mangaflow_e2e` |
| Browser | Playwright Chromium, Desktop Chrome |

`globalSetup` chỉ reset database có tên chính xác `mangaflow_e2e`. Database phát
triển `mangaflow` không bị reset hoặc thay đổi.

## Các luồng đã kiểm chứng

### 1. Chuỗi nghiệp vụ chính xuyên role

1. Admin đăng nhập, tạo tài khoản Mangaka, Assistant và Editor.
2. Tài khoản mới đăng nhập đúng role và vào đúng dashboard.
3. Mangaka tạo proposal, upload manuscript/material và submit.
4. Editor claim proposal và chuyển sang Board.
5. Board Chair mở VotingSession; ba thành viên vote APPROVE.
6. Chair finalize, hệ thống tự provision Series.
7. Mangaka bắt đầu production, tạo Chapter và upload nhiều Page.
8. Mangaka đổi thứ tự Page, reload để xác nhận order lưu trong DB, xóa Page và
   xác nhận `index`/`pageNumber` được đánh lại liên tục.
9. AI thật chạy detect bubble và whitening với model local `best.pt`.
10. Mangaka gửi Chapter sang Tantou Review; Editor yêu cầu revision có target.
11. Mangaka reply comment, đánh dấu `ADDRESSED`, thay asset cho toàn bộ Page cần
    revision và resubmit.
12. Tantou đọc reply, chuyển `ADDRESSED → REOPENED`; Mangaka address lại; Tantou
    chuyển `ADDRESSED → RESOLVED` rồi approve Chapter.
13. Tantou schedule; publish sớm bị chặn với `PUBLICATION_NOT_DUE`.
14. Khi đến `scheduledAt`, Tantou publish; Chapter và Publication cùng chuyển
    `PUBLISHED`.

### 2. Board split-vote và tie-break

1. Mangaka tạo proposal độc lập; Editor claim và forward.
2. Board Chair mở session.
3. Năm thành viên vote `2 APPROVE + 2 REJECT + 1 ABSTAIN`.
4. Chair close session; trạng thái chuyển `TIE_BREAK_REQUIRED`.
5. Editor-in-chief bỏ phiếu weighted `APPROVE`.
6. Chair close lần hai; session `FINALIZED`, proposal được approve và Series
   được provision.

### 3. Board cancel và no-quorum

1. Chair cancel session; proposal trở về `PENDING_BOARD`.
2. Chair tạo session thay thế.
3. Close session không đủ phiếu tạo `NO_QUORUM`; proposal tiếp tục trở về
   `PENDING_BOARD`.
4. Phiếu của session đã cancel không bị tái sử dụng ở session mới.

### 4. Assistant task lifecycle

1. Assistant mở task đang blocked; UI không gửi lệnh `START` sai trạng thái.
2. Assistant `UNBLOCK → START`.
3. Assistant `BLOCK` với lý do bắt buộc, sau đó `UNBLOCK`.
4. Assistant upload và submit work.
5. Mangaka yêu cầu revision.
6. Assistant `REOPEN`, resubmit đúng submission hiện hành.
7. Mangaka approve; Assistant thấy task approved và earning đúng đơn vị tiền tệ
   gốc.

### 5. Proposal exception lifecycle

1. Mangaka submit proposal.
2. Editor claim và yêu cầu hai revision item.
3. Frontend chặn resubmit khi checklist chưa hoàn tất.
4. Mangaka resolve checklist và resubmit.
5. Editor reject với lý do bắt buộc.
6. Ở nhánh độc lập, Mangaka lưu draft rồi withdraw thành `WITHDRAWN`.

### 6. Public Reader

1. Chapter đã schedule nhưng chưa đến hạn không xuất hiện ở public catalog.
2. Sau publish, Series và Chapter xuất hiện ở `/read`.
3. Reader mở Chapter detail và tải thành công toàn bộ ảnh Page bằng display URL mới.

### 7. Board reject và decision history

1. Test tự tạo Proposal, Editor claim/forward và Chair mở VotingSession riêng.
2. Ba Board member vote `REJECT`; Chair close thành `FINALIZED/REJECTED`.
3. Proposal rời active Queue, xuất hiện trong Decisions, và terminal session pointers
   được xóa.

### 8. Region, Task và Assistant review

1. Mangaka dùng **Draw Region** kéo trực tiếp trên Konva canvas.
2. Mangaka chọn Assistant, rate, due date và tạo Task.
3. Assistant thấy Task, start, upload file thật và submit.
4. Mangaka mở Review Queue và approve; submission rời pending queue.

### 9. Material lifecycle

1. Mangaka tạo Material v1, upload v2 và chuyển `DRAFT → ACTIVE → IN_REVIEW`.
2. Tantou chuyển `IN_REVIEW → APPROVED`.
3. UI ẩn Replace/Delete; backend chặn xóa bằng
   `409 APPROVED_MATERIAL_IMMUTABLE` và giữ bản ghi để audit.

## Route coverage theo role

| Role | Route đã kiểm tra | Kết quả |
| --- | --- | ---: |
| Admin | dashboard, users, rates, notifications | 4/4 |
| Mangaka | dashboard, submissions, series, tasks, review, rankings, notifications | 7/7 |
| Assistant | dashboard, tasks, submissions, earnings, notifications | 5/5 |
| Editor | dashboard, review, series, publications, notifications | 5/5 |
| Board | dashboard, queue, sessions, rankings, at-risk, decisions, notifications | 7/7 |

Mỗi actor đăng nhập một lần rồi mở toàn bộ route trong scope để phản ánh phiên sử
dụng thực tế và không tạo tải giả lên auth rate limiter. Từng route được kiểm tra:
không redirect sai về login, không có trang lỗi và không có API response từ 400 trở lên.

## Lỗi phát hiện và đã sửa trong vòng kiểm thử này

### E2E-006 — EIC không thấy proposal cần tie-break

- Nguyên nhân: client so sánh proposal status với cả chuỗi
  `"A,B,C"` thay vì tách danh sách multi-status.
- Sửa: tách status bằng dấu phẩy và lọc theo tập giá trị.
- Regression: EIC thấy proposal, vote weighted và Chair finalize thành công.

### E2E-007 — Session detail thiếu proposal ở trạng thái tie-break

- Nguyên nhân: query không bao gồm `TIE_BREAK`; hướng dẫn UI cũng chưa nói rõ
  Chair phải close lần hai.
- Sửa: bổ sung status và cập nhật nội dung thao tác.

### E2E-008 — Lifecycle control của Assistant đặt sai actor

- Trước sửa: control START/BLOCK/UNBLOCK/REOPEN xuất hiện trong vùng Mangaka,
  trong khi Assistant không có đủ control.
- Sửa: Mangaka chỉ giữ quyền quản lý phù hợp; lifecycle control chuyển sang
  Assistant và tuân theo trạng thái task.

### E2E-009 — Task blocked vẫn có thể gửi START

- Sửa frontend: task blocked mở Studio để xử lý, không tự START.
- Sửa backend: START task blocked trả `409 TASK_BLOCKED`.
- Bổ sung regression backend đảm bảo status và `startedAt` không bị mutation.

### E2E-010 — Resubmit dùng submission ID cũ

- Nguyên nhân: request thiếu `expectedCurrentSubmissionId`, gây conflict khi
  resubmit sau revision.
- Sửa: lấy submission mới nhất và gửi optimistic concurrency ID chính xác.

### UX-002 — Submit panel trùng lặp và “Save Draft” không đúng hợp đồng API

- Xóa panel submit thứ hai.
- Chỉ cho submit khi task được assign, không blocked và đang `IN_PROGRESS`.
- Xóa nút “Save Draft” giả vì endpoint hiện tại luôn tạo submission.

### E2E-011 — Earnings hiển thị hardcode JPY

- Sửa type để giữ `currency` và `period`.
- Format từng earning theo currency gốc; summary được nhóm theo currency, không
  cộng lẫn các đồng tiền.

### E2E-012 — Comment ADDRESSED không thể được Tantou xác nhận

- UI hiển thị “Reopen” thay vì “Resolve” cho comment `ADDRESSED`.
- Sửa Inspector để Tantou có cả hai quyết định hợp lệ trên comment `ADDRESSED`:
  `Resolve` khi đã đạt và `Reopen` khi cần Mangaka xử lý tiếp.

### E2E-013 — Chapter revision rơi vào dead-end vì không thể thay Page

- `REQUEST_REVISION` chuyển Page sang `REVISION_REQUIRED`, nhưng UI chỉ có Upload
  Page mới; Page cũ vẫn chặn readiness.
- Bổ sung `Replace revision` trên đúng thumbnail.
- Backend giữ nguyên page ID/thứ tự, cập nhật asset và tự chuyển Page về
  `UPLOADED`.

### E2E-014 — Editor Studio route luôn hiện Series Monitor

- Parent route `/app/editor/series` thiếu `<Outlet />`, nên child Studio không
  bao giờ render.
- Chuyển Series Monitor thành index route và để parent render Outlet.

### E2E-015 — Nút Resolve gọi nhầm endpoint reopen

- Handler diễn giải trạng thái đích như trạng thái hiện tại, nên `RESOLVED` bị
  map sang `/reopen`.
- Sửa mapping theo intent: target `RESOLVED` gọi resolve; target `OPEN` hoặc
  `REOPENED` gọi reopen.

### E2E-016 — Publications không cập nhật sau schedule/publish

- Mutation chỉ invalidate chapter detail, không refresh query
  `/chapters?mine=true`.
- Invalidate toàn bộ `chapterKeys.all`; tab Scheduled/Published cập nhật ngay.

### E2E-017 — Comment chưa có reply thread và UI thiếu nhánh reopen thực tế

- Thêm `POST /comments/:commentId/replies`; reply giữ `parentCommentId`, kế thừa
  target/scope từ parent và luôn non-blocking.
- Thêm form Reply trong Studio Inspector, hiển thị reply phân cấp và giữ lifecycle
  của parent độc lập.
- E2E xác nhận Mangaka reply, Tantou reopen từ `ADDRESSED`, Mangaka address lại,
  Tantou resolve và approve.

### E2E-018 — Page reorder chỉ tồn tại ở local UI, delete không chuẩn hóa thứ tự

- Thêm `PATCH /chapters/:chapterId/pages/reorder` với exact permutation guard.
- Reorder và delete cập nhật embedded Page array atomically, đồng thời đánh lại
  `index` và `pageNumber` từ `1..N`.
- Thêm control Move left/Move right/Delete trong Chapter Pages; E2E reload trang để
  xác nhận thứ tự đã lưu trong DB và số trang liên tục sau delete.

### E2E-019 — Public Reader đổi URL nhưng không render Chapter

- Parent route `/read/$slug` thiếu `<Outlet />`, nên child Chapter không render dù URL đổi.
- Tách parent layout/index child, bổ sung public API chỉ trả Series/Chapter đã publish và
  cấp display URL mới cho Page.
- E2E xác nhận scheduled content bị ẩn và published Chapter đọc được toàn bộ ảnh.

### E2E-020 — Board Queue có tab terminal không thể có dữ liệu

- Backend đúng khi loại `APPROVED/REJECTED` khỏi active Queue, nhưng UI vẫn giữ hai tab chết.
- Xóa tab terminal, dùng Decisions làm lịch sử chính thức.
- Khi close `FINALIZED` hoặc `NO_QUORUM`, backend xóa active session/version pointers;
  tie-break vẫn giữ pointers đến khi giải quyết.

### E2E-021 — Material create lệch contract và approved record có thể bị xóa

- Frontend gửi `status: DRAFT` dù create schema chủ động default status, làm upload bị reject.
- Bỏ field thừa, đồng bộ quyền Material chỉ cho Mangaka/Tantou.
- `APPROVED` giờ không thể thêm version hoặc delete; UI ẩn Replace/Delete và backend trả
  `APPROVED_MATERIAL_IMMUTABLE`.

### E2E-022 — Seed production Series bị khóa bởi Proposal không liên quan

- `s-berserk-prod` trỏ tới draft `p-001` có title khác, làm Studio/Materials bị khóa sai.
- Bỏ liên kết proposal giả; seed production Series trở thành source of truth độc lập.

### E2E-HARNESS-01 — Test dùng chung seed và login quá mức

- Board reject từng phụ thuộc `p-004`; Assistant flow từng phụ thuộc trạng thái `tsk-002`.
- Hai flow giờ tự tạo Proposal/Session/Region/Task riêng nên chạy độc lập hoặc full suite đều được.
- 28 route được gom thành 5 phiên actor, giữ nguyên coverage và không kích hoạt auth rate limiter
  bằng tải login không thực tế.

## Các lỗi đã sửa từ vòng trước và vẫn pass regression

- Admin dashboard dùng API summary đúng quyền, không gọi Rankings ngoài phạm vi.
- API proposal chấp nhận canonical status `BOARD_REVIEW`.
- Auth payload rỗng trả `400 VALIDATION_ERROR`, không còn trả 500.
- Empty Chapter state chỉ còn một CTA tạo Chapter.
- E2E reset idempotent và fail-closed với database ngoài `mangaflow_e2e`.

## Xác minh kỹ thuật

| Kiểm tra | Kết quả |
| --- | --- |
| Live Playwright E2E | 59/59 pass |
| Chuỗi xuyên role tập trung | 35/35 pass |
| Assistant lifecycle tập trung | 7/7 pass |
| Material status/immutability backend | 5/5 pass |
| Board reject độc lập | 1/1 pass |
| Region → Task → Approval độc lập | 1/1 pass |
| Backend test START blocked | 1/1 pass |
| Backend test Page replacement | 1/1 pass |
| Frontend TypeScript | PASS |
| Backend TypeScript | PASS |
| Browser stderr | 0 byte |
| AI model health | `model_loaded: true` |

Full backend suite cũ vượt giới hạn chạy của tool trước khi Vitest in summary.
Không có assertion failure trong output đã chạy, nhưng kết quả đó vẫn được ghi
là **inconclusive do timeout**, không được tính là pass.

## Phạm vi sâu tiếp theo

Các nhánh nên kiểm thử ở vòng tiếp theo:

1. Comment permission matrix theo từng target (`REGION`, `TASK`, `SUBMISSION`) và
   reply nhiều cấp.
2. Region/task patch/delete guard, reassign và cancel; create/assign/submit/approve đã cover.
3. Publication postpone/reschedule và archive sau publish.
4. Earnings settlement/payment; vòng hiện tại mới xác nhận earning được tạo sau
   approval và hiển thị đúng currency.

## Bằng chứng

- [Playwright HTML report](../../artifacts/e2e-live/html-report/index.html)
- [JSON result](../../artifacts/e2e-live/results.json)
- [Console output 59 scenario](../../artifacts/e2e-live/full-run-59.out.log)
- [Admin dashboard](../../artifacts/e2e-live/screenshots/01-admin-dashboard.png)
- [AI whitening](../../artifacts/e2e-live/screenshots/08-live-ai-whitening.png)
- [EIC tie-break approved](../../artifacts/e2e-live/screenshots/12-eic-tie-break-approved.png)
- [Series từ tie-break](../../artifacts/e2e-live/screenshots/13-tie-break-series-provisioned.png)
- [Assistant task started](../../artifacts/e2e-live/screenshots/14-assistant-task-started.png)
- [Assistant work submitted](../../artifacts/e2e-live/screenshots/15-assistant-work-submitted.png)
- [Assistant earning created](../../artifacts/e2e-live/screenshots/16-assistant-earning-created.png)
- [Board cancel recovery](../../artifacts/e2e-live/screenshots/15-board-cancel-restored-pending-board.png)
- [Board no-quorum recovery](../../artifacts/e2e-live/screenshots/17-board-no-quorum-restored-pending-board.png)
- [Tantou requested Chapter revision](../../artifacts/e2e-live/screenshots/18-tantou-requested-chapter-revision.png)
- [Page reorder/delete persisted](../../artifacts/e2e-live/screenshots/23-mangaka-reordered-deleted-pages.png)
- [Mangaka replied and addressed](../../artifacts/e2e-live/screenshots/24-mangaka-replied-addressed-comment.png)
- [Tantou reopened addressed comment](../../artifacts/e2e-live/screenshots/25-tantou-reopened-addressed-comment.png)
- [Tantou approved resubmission](../../artifacts/e2e-live/screenshots/26-tantou-approved-resubmitted-chapter.png)
- [Chapter scheduled](../../artifacts/e2e-live/screenshots/21-tantou-scheduled-chapter.png)
- [Chapter published](../../artifacts/e2e-live/screenshots/22-tantou-published-chapter.png)
- [Public Reader published Chapter](../../artifacts/e2e-live/screenshots/28-public-reader-published-chapter.png)
- [Board rejected decision history](../../artifacts/e2e-live/screenshots/29-board-rejected-decision-history.png)
- [Mangaka created Region task](../../artifacts/e2e-live/screenshots/32-mangaka-created-region-task.png)
- [Assistant submitted Region task](../../artifacts/e2e-live/screenshots/33-assistant-submitted-region-task.png)
- [Mangaka approved Region task](../../artifacts/e2e-live/screenshots/34-mangaka-approved-region-task.png)
- [Material version in review](../../artifacts/e2e-live/screenshots/35-material-version-in-review.png)
- [Editor approved immutable Material](../../artifacts/e2e-live/screenshots/36-editor-approved-material.png)
