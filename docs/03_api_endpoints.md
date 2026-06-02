## API Endpoint Specification — MangaFlow

### 1. API Convention

### 1.1. Base URL

#### Local Development

http://localhost:5000/api

#### Production

https://mangaflow-api.railway.app/api

### 1.2. Authentication

Hệ thống sử dụng Clerk.

Frontend gửi request kèm Bearer token:

Authorization: Bearer \<clerk_session_token\>

Backend verify token bằng Clerk middleware, sau đó map clerkId sang User trong MongoDB.

### 1.3. Standard Success Response

{

"success": true,

"message": "OK",

"data": {}

}

### 1.4. Standard Error Response

{

"success": false,

"message": "Task not found",

"code": "TASK_NOT_FOUND",

"details": {}

}

### 1.5. Pagination Response

{

"success": true,

"message": "OK",

"data": \[\],

"pagination": {

"page": 1,

"limit": 20,

"total": 100,

"totalPages": 5

}

}

### 1.6. Common Query Params

| **Query** | **Meaning**      |
|-----------|------------------|
| page      | Current page     |
| limit     | Items per page   |
| search    | Search keyword   |
| sortBy    | Sort field       |
| sortOrder | asc or desc      |
| status    | Filter by status |
| role      | Filter by role   |
| fromDate  | Start date       |
| toDate    | End date         |

Example:

GET /api/tasks?page=1&limit=20&status=TODO&sortBy=createdAt&sortOrder=desc

## 2. Auth API

### 2.1. Purpose

Auth API dùng để đồng bộ Clerk user vào database nội bộ và lấy thông tin user hiện tại.

| **Method** | **Endpoint**              | **Access**    | **Description**                           |
|------------|---------------------------|---------------|-------------------------------------------|
| GET        | /auth/me                  | Authenticated | Lấy thông tin user hiện tại               |
| POST       | /auth/sync-user           | Authenticated | Sync Clerk user vào MongoDB               |
| POST       | /auth/complete-onboarding | Authenticated | Hoàn tất onboarding nếu user chưa có role |
| GET        | /auth/permissions         | Authenticated | Lấy danh sách quyền của user hiện tại     |

### 2.2. GET /auth/me

Response:

{

"success": true,

"data": {

"id": "mongo-user-id",

"clerkId": "clerk-user-id",

"email": "user@example.com",

"fullName": "Nguyen Dat",

"avatarUrl": "https://...",

"systemRole": "MANGAKA",

"status": "ACTIVE"

}

}

## 3. User API

### 3.1. Purpose

Quản lý user nội bộ trong hệ thống.

| **Method** | **Endpoint**                      | **Access**           | **Description**                 |
|------------|-----------------------------------|----------------------|---------------------------------|
| GET        | /users                            | Admin                | Lấy danh sách user              |
| GET        | /users/:userId                    | Admin / Self         | Lấy chi tiết user               |
| PATCH      | /users/:userId                    | Admin / Self limited | Cập nhật profile                |
| PATCH      | /users/:userId/role               | Admin                | Đổi system role                 |
| PATCH      | /users/:userId/status             | Admin                | Active / suspend user           |
| GET        | /users/:userId/series-memberships | Admin / Self         | Lấy các series mà user tham gia |
| GET        | /users/:userId/tasks              | Admin / Self         | Lấy task liên quan đến user     |
| GET        | /users/:userId/activity           | Admin                | Lấy activity log của user       |

### 3.2. PATCH /users/:userId/role

Request:

{

"systemRole": "EDITOR"

}

## 4. Series API

### 4.1. Purpose

Quản lý series manga.

| **Method** | **Endpoint**                      | **Access**                            | **Description**                 |
|------------|-----------------------------------|---------------------------------------|---------------------------------|
| GET        | /series                           | Authenticated                         | Lấy danh sách series theo quyền |
| POST       | /series                           | Mangaka / Admin                       | Tạo series mới                  |
| GET        | /series/:seriesId                 | Series member / Admin / Board summary | Lấy chi tiết series             |
| PATCH      | /series/:seriesId                 | Owner Mangaka / Co-Mangaka / Admin    | Cập nhật series                 |
| DELETE     | /series/:seriesId                 | Owner Mangaka / Admin                 | Xóa series draft                |
| POST       | /series/:seriesId/submit          | Owner Mangaka                         | Submit series cho Editor        |
| POST       | /series/:seriesId/assign-editor   | Admin / Editor Manager                | Assign Editor                   |
| POST       | /series/:seriesId/submit-to-board | Editor                                | Chuyển series lên Board         |
| POST       | /series/:seriesId/approve         | Board Decision                        | Approve series                  |
| POST       | /series/:seriesId/reject          | Board Decision                        | Reject series                   |
| POST       | /series/:seriesId/cancel          | Board                                 | Hủy series                      |
| POST       | /series/:seriesId/mark-at-risk    | Board / Editor                        | Đánh dấu nguy cơ                |
| GET        | /series/:seriesId/summary         | Board / Editor / Admin                | Lấy summary cho Board           |
| GET        | /series/:seriesId/progress        | Series member / Editor / Admin        | Lấy tiến độ series              |

### 4.2. POST /series

Request:

{

"title": "My Manga Series",

"description": "A story about...",

"genre": \["Action", "Fantasy"\],

"targetAudience": "Teen",

"publicationType": "WEEKLY"

}

### 4.3. POST /series/:seriesId/cancel

Request:

{

"reason": "Low ranking for multiple periods",

"decisionId": "board-decision-id"

}

## 5. Series Member API

### 5.1. Purpose

Quản lý user theo từng series.

| **Method** | **Endpoint**                               | **Access**            | **Description**         |
|------------|--------------------------------------------|-----------------------|-------------------------|
| GET        | /series/:seriesId/members                  | Series member / Admin | Lấy danh sách member    |
| POST       | /series/:seriesId/members/invite           | Owner Mangaka / Admin | Mời member vào series   |
| PATCH      | /series/:seriesId/members/:memberId/role   | Owner Mangaka / Admin | Đổi role trong series   |
| PATCH      | /series/:seriesId/members/:memberId/status | Owner Mangaka / Admin | Active / removed member |
| DELETE     | /series/:seriesId/members/:memberId        | Owner Mangaka / Admin | Xóa member khỏi series  |
| POST       | /series/:seriesId/members/accept-invite    | Invited user          | Chấp nhận lời mời       |
| POST       | /series/:seriesId/members/decline-invite   | Invited user          | Từ chối lời mời         |

### 5.2. POST /series/:seriesId/members/invite

Request:

{

"email": "assistant@example.com",

"role": "ASSISTANT"

}

## 6. Board Member API

### 6.1. Purpose

Quản lý hội đồng biên tập.

| **Method** | **Endpoint**                            | **Access**    | **Description**             |
|------------|-----------------------------------------|---------------|-----------------------------|
| GET        | /board/members                          | Admin / Board | Lấy danh sách board members |
| POST       | /board/members                          | Admin         | Thêm board member           |
| PATCH      | /board/members/:boardMemberId           | Admin         | Cập nhật board member       |
| DELETE     | /board/members/:boardMemberId           | Admin         | Xóa board member            |
| POST       | /board/members/:boardMemberId/set-chair | Admin         | Set Board Chair             |
| GET        | /board/chair                            | Admin / Board | Lấy Board Chair hiện tại    |

### 6.2. Board Rules

- Board có 3–7 người.

- Chỉ có 1 BOARD_CHAIR.

- BOARD_MEMBER được vote.

- BOARD_CHAIR được vote và tie-break.

## 7. Manuscript API

### 7.1. Purpose

Quản lý bản thảo sơ bộ của series.

| **Method** | **Endpoint**                                | **Access**                     | **Description**               |
|------------|---------------------------------------------|--------------------------------|-------------------------------|
| GET        | /series/:seriesId/manuscripts               | Series member / Editor / Admin | Lấy manuscript của series     |
| POST       | /series/:seriesId/manuscripts               | Mangaka / Admin                | Upload manuscript             |
| GET        | /manuscripts/:manuscriptId                  | Authorized user                | Lấy chi tiết manuscript       |
| PATCH      | /manuscripts/:manuscriptId                  | Mangaka / Admin                | Cập nhật thông tin manuscript |
| DELETE     | /manuscripts/:manuscriptId                  | Mangaka / Admin                | Xóa manuscript draft          |
| POST       | /manuscripts/:manuscriptId/submit           | Mangaka                        | Submit manuscript             |
| POST       | /manuscripts/:manuscriptId/request-revision | Editor                         | Yêu cầu sửa manuscript        |
| POST       | /manuscripts/:manuscriptId/approve          | Editor                         | Editor approve manuscript     |
| GET        | /manuscripts/:manuscriptId/versions         | Authorized user                | Lấy version history           |
| POST       | /manuscripts/:manuscriptId/versions         | Mangaka                        | Upload major version mới      |

### 7.2. POST /series/:seriesId/manuscripts

Content-Type:

multipart/form-data

Fields:

| **Field**   | **Type** | **Required** |
|-------------|----------|--------------|
| files       | File\[\] | Yes          |
| title       | string   | No           |
| description | string   | No           |
| note        | string   | No           |

## 8. Chapter API

### 8.1. Purpose

Quản lý chapter của series.

| **Method** | **Endpoint**                          | **Access**                     | **Description**            |
|------------|---------------------------------------|--------------------------------|----------------------------|
| GET        | /series/:seriesId/chapters            | Series member / Editor / Admin | Lấy chapter list           |
| POST       | /series/:seriesId/chapters            | Mangaka / Admin                | Tạo chapter                |
| GET        | /chapters/:chapterId                  | Authorized user                | Lấy chi tiết chapter       |
| PATCH      | /chapters/:chapterId                  | Mangaka / Editor / Admin       | Cập nhật chapter           |
| DELETE     | /chapters/:chapterId                  | Mangaka / Admin                | Xóa chapter draft          |
| POST       | /chapters/:chapterId/submit-to-editor | Mangaka                        | Submit chapter cho Editor  |
| POST       | /chapters/:chapterId/request-revision | Editor                         | Editor yêu cầu sửa chapter |
| POST       | /chapters/:chapterId/approve          | Editor                         | Editor approve chapter     |
| GET        | /chapters/:chapterId/progress         | Authorized user                | Lấy progress của chapter   |
| GET        | /chapters/:chapterId/readiness        | Mangaka / Editor / Admin       | Check publish readiness    |

### 8.2. POST /series/:seriesId/chapters

Request:

{

"title": "Chapter 1",

"chapterNumber": 1,

"deadline": "2026-07-01T00:00:00.000Z"

}

## 9. Page API

### 9.1. Purpose

Quản lý page manga trong chapter.

| **Method** | **Endpoint**                    | **Access**               | **Description**           |
|------------|---------------------------------|--------------------------|---------------------------|
| GET        | /chapters/:chapterId/pages      | Authorized user          | Lấy page list             |
| POST       | /chapters/:chapterId/pages      | Mangaka / Admin          | Upload pages              |
| GET        | /pages/:pageId                  | Authorized user          | Lấy chi tiết page         |
| PATCH      | /pages/:pageId                  | Mangaka / Editor / Admin | Cập nhật page             |
| DELETE     | /pages/:pageId                  | Mangaka / Admin          | Xóa page                  |
| POST       | /pages/:pageId/reorder          | Mangaka / Admin          | Đổi thứ tự page           |
| POST       | /pages/:pageId/submit           | Mangaka                  | Submit page cho Editor    |
| POST       | /pages/:pageId/mangaka-approve  | Mangaka                  | Mangaka approve page      |
| POST       | /pages/:pageId/editor-approve   | Editor                   | Editor final approve page |
| POST       | /pages/:pageId/request-revision | Editor / Mangaka         | Yêu cầu sửa page          |
| GET        | /pages/:pageId/versions         | Authorized user          | Lấy version history       |
| POST       | /pages/:pageId/versions         | Mangaka / Assistant      | Upload version mới        |
| GET        | /pages/:pageId/compare          | Authorized user          | Before/after compare      |

### 9.2. POST /chapters/:chapterId/pages

Content-Type:

multipart/form-data

Rules:

- Max 50 pages per upload.

- Max 50 MB per image.

- Store original unchanged.

- Generate AI copy max 2048px width.

- Generate preview max 1600px width.

- Generate thumbnail 300px width.

### 9.3. GET /pages/:pageId/compare

Query:

?fromVersion=1&toVersion=2

Response:

{

"success": true,

"data": {

"fromVersion": {

"versionNumber": 1,

"previewUrl": "https://..."

},

"toVersion": {

"versionNumber": 2,

"previewUrl": "https://..."

}

}

}

## 10. File Asset API

### 10.1. Purpose

Quản lý file lưu trên Cloudflare R2 / MinIO.

| **Method** | **Endpoint**                        | **Access**      | **Description**        |
|------------|-------------------------------------|-----------------|------------------------|
| GET        | /files/:fileId                      | Authorized user | Lấy metadata file      |
| GET        | /files/:fileId/signed-url           | Authorized user | Lấy private signed URL |
| DELETE     | /files/:fileId                      | Owner / Admin   | Xóa file nếu được phép |
| GET        | /files/owner/:ownerType/:ownerId    | Authorized user | Lấy file theo owner    |
| POST       | /files/:fileId/regenerate-preview   | Admin / Owner   | Tạo lại preview        |
| POST       | /files/:fileId/regenerate-thumbnail | Admin / Owner   | Tạo lại thumbnail      |

### 10.2. GET /files/:fileId/signed-url

Response:

{

"success": true,

"data": {

"url": "https://signed-url...",

"expiresIn": 900

}

}

## 11. Region API

### 11.1. Purpose

Quản lý vùng được chọn trên page.

| **Method** | **Endpoint**                   | **Access**                         | **Description**      |
|------------|--------------------------------|------------------------------------|----------------------|
| GET        | /pages/:pageId/regions         | Authorized user                    | Lấy regions của page |
| POST       | /pages/:pageId/regions         | Mangaka / Editor / Admin           | Tạo region           |
| GET        | /regions/:regionId             | Authorized user                    | Lấy chi tiết region  |
| PATCH      | /regions/:regionId             | Creator / Mangaka / Editor / Admin | Cập nhật region      |
| DELETE     | /regions/:regionId             | Creator / Mangaka / Editor / Admin | Xóa region           |
| POST       | /regions/:regionId/create-task | Mangaka / Editor / Admin           | Tạo task từ region   |

### 11.2. POST /pages/:pageId/regions

Request:

{

"type": "BUBBLE",

"source": "MANUAL",

"shape": "RECTANGLE",

"x": 0.15,

"y": 0.3,

"width": 0.22,

"height": 0.08

}

## 12. Annotation API

### 12.1. Purpose

Annotation là hình chữ nhật gắn trên page để review/comment.

| **Method** | **Endpoint**                       | **Access**               | **Description**                |
|------------|------------------------------------|--------------------------|--------------------------------|
| GET        | /pages/:pageId/annotations         | Authorized user          | Lấy annotation của page        |
| POST       | /pages/:pageId/annotations         | Mangaka / Editor / Admin | Tạo annotation                 |
| GET        | /annotations/:annotationId         | Authorized user          | Lấy chi tiết annotation        |
| PATCH      | /annotations/:annotationId         | Creator / Editor / Admin | Cập nhật annotation            |
| DELETE     | /annotations/:annotationId         | Creator / Editor / Admin | Xóa annotation                 |
| POST       | /annotations/:annotationId/comment | Authorized user          | Tạo comment gắn với annotation |

### 12.2. POST /pages/:pageId/annotations

Request:

{

"targetType": "PAGE",

"targetId": "page-id",

"type": "RECTANGLE",

"x": 0.15,

"y": 0.3,

"width": 0.22,

"height": 0.08,

"comment": "Dialogue bubble needs revision"

}

## 13. Task API

### 13.1. Purpose

Quản lý task được giao cho Assistant.

| **Method** | **Endpoint**                    | **Access**               | **Description**          |
|------------|---------------------------------|--------------------------|--------------------------|
| GET        | /tasks                          | Authenticated            | Lấy task theo quyền      |
| POST       | /tasks                          | Mangaka / Editor / Admin | Tạo task                 |
| GET        | /tasks/:taskId                  | Authorized user          | Lấy chi tiết task        |
| PATCH      | /tasks/:taskId                  | Mangaka / Editor / Admin | Cập nhật task            |
| DELETE     | /tasks/:taskId                  | Mangaka / Admin          | Xóa task nếu chưa submit |
| POST       | /tasks/:taskId/start            | Assigned Assistant       | Start task               |
| POST       | /tasks/:taskId/submit           | Assigned Assistant       | Submit task              |
| POST       | /tasks/:taskId/request-revision | Mangaka / Editor         | Yêu cầu sửa              |
| POST       | /tasks/:taskId/mangaka-approve  | Mangaka                  | Mangaka approve          |
| POST       | /tasks/:taskId/editor-approve   | Editor                   | Editor approve cuối      |
| POST       | /tasks/:taskId/reject           | Mangaka / Editor         | Reject task              |
| GET        | /tasks/:taskId/history          | Authorized user          | Lấy lịch sử task         |
| GET        | /tasks/:taskId/comments         | Authorized user          | Lấy comment của task     |

### 13.2. POST /tasks

Request:

{

"seriesId": "series-id",

"chapterId": "chapter-id",

"pageId": "page-id",

"regionId": "region-id",

"assignedTo": "assistant-user-id",

"title": "Clean speech bubble",

"description": "Remove text inside bubble and keep border clean",

"type": "CLEANUP",

"priority": "HIGH",

"dueDate": "2026-07-01T00:00:00.000Z",

"baseRate": 40

}

### 13.3. POST /tasks/:taskId/submit

Content-Type:

multipart/form-data

Fields:

| **Field** | **Type** | **Required** |
|-----------|----------|--------------|
| file      | File     | Yes          |
| note      | string   | No           |

Rules:

- Assistant không được sửa submission sau khi submit.

- Nếu revision requested, Assistant tạo submission version mới.

- Reject task thì payment = 0.

## 14. Submission API

### 14.1. Purpose

Quản lý bài nộp của Assistant.

| **Method** | **Endpoint**                                | **Access**         | **Description**            |
|------------|---------------------------------------------|--------------------|----------------------------|
| GET        | /submissions                                | Authenticated      | Lấy submissions theo quyền |
| GET        | /tasks/:taskId/submissions                  | Authorized user    | Lấy submissions của task   |
| POST       | /tasks/:taskId/submissions                  | Assigned Assistant | Tạo submission             |
| GET        | /submissions/:submissionId                  | Authorized user    | Lấy chi tiết submission    |
| POST       | /submissions/:submissionId/mangaka-approve  | Mangaka            | Mangaka approve submission |
| POST       | /submissions/:submissionId/editor-approve   | Editor             | Editor final approve       |
| POST       | /submissions/:submissionId/request-revision | Mangaka / Editor   | Yêu cầu sửa                |
| POST       | /submissions/:submissionId/reject           | Mangaka / Editor   | Reject submission          |
| GET        | /submissions/:submissionId/versions         | Authorized user    | Lấy versions               |
| GET        | /submissions/:submissionId/comments         | Authorized user    | Lấy comments               |

### 14.2. Submission Status

PENDING_MANGAKA_REVIEW

REVISION_REQUESTED

MANGAKA_APPROVED

EDITOR_APPROVED

REJECTED

## 15. Comment API

### 15.1. Purpose

Quản lý comment và quy trình resolve comment.

| **Method** | **Endpoint**                           | **Access**               | **Description**           |
|------------|----------------------------------------|--------------------------|---------------------------|
| GET        | /comments                              | Authenticated            | Lấy comment theo quyền    |
| POST       | /comments                              | Authenticated            | Tạo comment               |
| GET        | /comments/:commentId                   | Authorized user          | Lấy chi tiết comment      |
| PATCH      | /comments/:commentId                   | Creator / Editor / Admin | Cập nhật comment          |
| DELETE     | /comments/:commentId                   | Creator / Admin          | Xóa comment               |
| POST       | /comments/:commentId/mark-fixed        | Assistant                | Assistant mark fixed      |
| POST       | /comments/:commentId/verify-fixed      | Mangaka                  | Mangaka verify fixed      |
| POST       | /comments/:commentId/resolve           | Editor                   | Editor resolve officially |
| POST       | /comments/:commentId/reopen            | Editor                   | Editor reopen comment     |
| GET        | /comments/target/:targetType/:targetId | Authorized user          | Lấy comment theo target   |

### 15.2. Comment States

OPEN

FIXED_BY_ASSISTANT

VERIFIED_BY_MANGAKA

RESOLVED_BY_EDITOR

### 15.3. POST /comments

Request:

{

"targetType": "PAGE",

"targetId": "page-id",

"pageId": "page-id",

"annotationId": "annotation-id",

"content": "Please adjust this bubble text area"

}

### 15.4. POST /comments/:commentId/reopen

Request:

{

"reason": "The issue is still visible in the latest version"

}

## 16. Review API

### 16.1. Purpose

Quản lý review action trên manuscript, page, task, submission.

| **Method** | **Endpoint**                          | **Access**                       | **Description**        |
|------------|---------------------------------------|----------------------------------|------------------------|
| GET        | /reviews                              | Authenticated                    | Lấy review theo quyền  |
| POST       | /reviews                              | Mangaka / Editor / Board / Admin | Tạo review             |
| GET        | /reviews/:reviewId                    | Authorized user                  | Lấy chi tiết review    |
| PATCH      | /reviews/:reviewId                    | Reviewer / Admin                 | Cập nhật review        |
| DELETE     | /reviews/:reviewId                    | Reviewer / Admin                 | Xóa review             |
| GET        | /reviews/target/:targetType/:targetId | Authorized user                  | Lấy review theo target |

### 16.2. POST /reviews

Request:

{

"targetType": "MANUSCRIPT",

"targetId": "manuscript-id",

"decision": "REQUEST_REVISION",

"comment": "The pacing needs improvement before board review"

}

## 17. Board Vote API

### 17.1. Purpose

Quản lý vote của Editorial Board.

| **Method** | **Endpoint**                    | **Access**               | **Description**     |
|------------|---------------------------------|--------------------------|---------------------|
| GET        | /board/votes                    | Board / Admin            | Lấy vote list       |
| GET        | /board/votes/my                 | Board                    | Lấy vote của mình   |
| POST       | /series/:seriesId/votes         | Board                    | Vote cho series     |
| PATCH      | /series/:seriesId/votes/:voteId | Vote owner / Board Chair | Sửa vote nếu còn mở |
| DELETE     | /series/:seriesId/votes/:voteId | Vote owner / Admin       | Xóa vote nếu còn mở |
| GET        | /series/:seriesId/votes         | Board / Admin            | Lấy vote của series |
| GET        | /series/:seriesId/votes/summary | Board / Admin / Editor   | Lấy vote summary    |

### 17.2. POST /series/:seriesId/votes

Request:

{

"vote": "APPROVE",

"reason": "Strong concept and clear publication potential"

}

## 18. Board Decision API

### 18.1. Purpose

Quản lý quyết định chính thức của Board.

| **Method** | **Endpoint**                          | **Access**             | **Description**                 |
|------------|---------------------------------------|------------------------|---------------------------------|
| GET        | /board/decisions                      | Board / Admin          | Lấy decision list               |
| GET        | /board/decisions/:decisionId          | Board / Admin / Editor | Lấy chi tiết decision           |
| POST       | /series/:seriesId/decisions/finalize  | Board Chair / Admin    | Finalize decision               |
| POST       | /series/:seriesId/decisions/tie-break | Board Chair            | Tie-break decision              |
| GET        | /series/:seriesId/decisions           | Authorized user        | Lấy decision history của series |

### 18.2. POST /series/:seriesId/decisions/finalize

Request:

{

"decision": "APPROVED",

"reason": "Majority approved the series for monthly publication"

}

### 18.3. Decision Types

APPROVED

REJECTED

NEEDS_REVISION

CONTINUE

CANCEL

## 19. Publication API

### 19.1. Purpose

Quản lý lịch xuất bản weekly/monthly.

| **Method** | **Endpoint**                               | **Access**             | **Description**              |
|------------|--------------------------------------------|------------------------|------------------------------|
| GET        | /publications                              | Authenticated          | Lấy publication theo quyền   |
| POST       | /publications                              | Board / Editor / Admin | Tạo publication plan         |
| GET        | /publications/:publicationId               | Authorized user        | Lấy chi tiết publication     |
| PATCH      | /publications/:publicationId               | Board / Editor / Admin | Cập nhật publication         |
| DELETE     | /publications/:publicationId               | Board / Admin          | Xóa plan nếu chưa publish    |
| POST       | /publications/:publicationId/publish       | Editor / Board / Admin | Mark as published            |
| POST       | /publications/:publicationId/delay         | Editor / Board / Admin | Delay publication            |
| POST       | /publications/:publicationId/cancel        | Board / Admin          | Cancel publication           |
| GET        | /series/:seriesId/publications             | Authorized user        | Lấy lịch xuất bản của series |
| GET        | /chapters/:chapterId/publication-readiness | Editor / Admin         | Check readiness              |

### 19.2. POST /publications

Request:

{

"seriesId": "series-id",

"chapterId": "chapter-id",

"scheduleType": "WEEKLY",

"plannedDate": "2026-07-01T00:00:00.000Z",

"note": "Weekly release approved by board"

}

## 20. Ranking API

### 20.1. Purpose

Quản lý ranking dựa trên vote count và reader score.

Final formula:

normalizedReaderScore = readerScore \* 10

finalScore = (voteCount \* 0.7) + (normalizedReaderScore \* 0.3)

| **Method** | **Endpoint**                      | **Access**             | **Description**                |
|------------|-----------------------------------|------------------------|--------------------------------|
| GET        | /rankings                         | Authenticated          | Lấy ranking table              |
| POST       | /rankings/import                  | Board / Admin          | Import ranking data            |
| POST       | /rankings/calculate               | Board / Admin          | Calculate ranking cho period   |
| GET        | /rankings/:rankingId              | Authorized user        | Lấy ranking detail             |
| GET        | /series/:seriesId/rankings        | Authorized user        | Lấy ranking history của series |
| GET        | /rankings/periods                 | Authenticated          | Lấy danh sách kỳ ranking       |
| GET        | /rankings/periods/:period         | Authenticated          | Lấy ranking theo kỳ            |
| POST       | /rankings/:rankingId/mark-warning | Board / Editor / Admin | Mark warning                   |
| POST       | /rankings/:rankingId/mark-at-risk | Board / Editor / Admin | Mark at-risk                   |

### 20.2. POST /rankings/import

Request:

{

"period": "2026-W27",

"items": \[

{

"seriesId": "series-id",

"voteCount": 10000,

"readerScore": 8.5

}

\]

}

Response:

{

"success": true,

"data": {

"period": "2026-W27",

"importedCount": 1,

"items": \[

{

"seriesId": "series-id",

"voteCount": 10000,

"readerScore": 8.5,

"normalizedReaderScore": 85,

"finalScore": 7025,

"rank": 1

}

\]

}

}

## 21. Payroll API

### 21.1. Purpose

Tracking & Payroll Management cho Assistant.

Không tích hợp thanh toán thật trong MVP.

| **Method** | **Endpoint**                     | **Access**                        | **Description**                |
|------------|----------------------------------|-----------------------------------|--------------------------------|
| GET        | /payroll/me                      | Assistant                         | Assistant xem earning của mình |
| GET        | /payroll                         | Admin                             | Xem toàn bộ payroll            |
| GET        | /payroll/series/:seriesId        | Mangaka / Admin                   | Payroll theo series            |
| GET        | /payroll/assistants/:assistantId | Admin / Self / Mangaka if related | Payroll theo assistant         |
| GET        | /payroll/monthly                 | Mangaka / Admin                   | Monthly payroll summary        |
| POST       | /payroll/tasks/:taskId/calculate | System / Mangaka / Admin          | Calculate task earning         |
| POST       | /payroll/tasks/:taskId/confirm   | Mangaka / Admin                   | Confirm earning                |
| POST       | /payroll/monthly/confirm         | Mangaka / Admin                   | Confirm monthly payout         |
| POST       | /payroll/:earningId/mark-paid    | Mangaka / Admin                   | Mark paid manually             |
| POST       | /payroll/:earningId/cancel       | Mangaka / Admin                   | Cancel earning                 |

### 21.2. Bonus / Penalty Rules

| **Condition** | **Bonus / Penalty** |
|---------------|---------------------|
| Early ≤ 24h   | +10%                |
| On time       | 0%                  |
| Late ≤ 24h    | -5%                 |
| Late \> 24h   | Mark LATE, no bonus |

Formula:

finalPayment = basePayment \* (1 + bonusRate)

### 21.3. POST /payroll/tasks/:taskId/calculate

Response:

{

"success": true,

"data": {

"taskId": "task-id",

"basePayment": 100,

"bonusRate": 0.1,

"bonusAmount": 10,

"penaltyAmount": 0,

"revisionFee": 0,

"finalPayment": 110,

"timingStatus": "EARLY"

}

}

## 22. Task Rate API

### 22.1. Purpose

Cấu hình giá theo loại task.

| **Method** | **Endpoint**            | **Access**    | **Description**          |
|------------|-------------------------|---------------|--------------------------|
| GET        | /task-rates             | Authenticated | Lấy task rates           |
| POST       | /task-rates             | Admin         | Tạo task rate            |
| GET        | /task-rates/:taskRateId | Authenticated | Lấy chi tiết task rate   |
| PATCH      | /task-rates/:taskRateId | Admin         | Cập nhật task rate       |
| DELETE     | /task-rates/:taskRateId | Admin         | Xóa/deactivate task rate |

### 22.2. POST /task-rates

Request:

{

"taskType": "BACKGROUND",

"rate": 100,

"currency": "POINT",

"isActive": true

}

## 23. AI API

### 23.1. Purpose

Backend wrapper gọi AI Service FastAPI.

Frontend không gọi trực tiếp AI service trong production.

| **Method** | **Endpoint**                                 | **Access**               | **Description**         |
|------------|----------------------------------------------|--------------------------|-------------------------|
| GET        | /ai/health                                   | Admin                    | Check AI service health |
| POST       | /pages/:pageId/ai/bubble-detect              | Mangaka / Editor / Admin | Detect bubble           |
| POST       | /pages/:pageId/ai/bubble-whiten              | Mangaka / Editor / Admin | Whiten bubble           |
| POST       | /pages/:pageId/ai/bubble-process             | Mangaka / Editor / Admin | Full process            |
| POST       | /chapters/:chapterId/ai/batch-bubble-detect  | Mangaka / Editor / Admin | Batch detect pages      |
| POST       | /chapters/:chapterId/ai/batch-bubble-process | Mangaka / Editor / Admin | Batch process pages     |
| GET        | /pages/:pageId/ai/results                    | Authorized user          | Lấy AI result của page  |
| DELETE     | /pages/:pageId/ai/results/:resultId          | Mangaka / Editor / Admin | Xóa AI result           |

### 23.2. POST /pages/:pageId/ai/bubble-process

Flow:

Backend lấy AI copy của page

↓

Gửi sang FastAPI /bubble/process

↓

Nhận processed image + bubble metadata

↓

Upload processed image lên R2

↓

Convert bbox sang normalized regions

↓

Save regions vào MongoDB

Response:

{

"success": true,

"data": {

"pageId": "page-id",

"processedFileUrl": "https://...",

"bubbleCount": 6,

"regions": \[

{

"id": "region-id",

"type": "BUBBLE",

"source": "AI",

"x": 0.12,

"y": 0.08,

"width": 0.2,

"height": 0.1,

"confidence": 0.97

}

\]

}

}

## 24. Notification API

### 24.1. Purpose

Quản lý notification trong app.

| **Method** | **Endpoint**                        | **Access**         | **Description**              |
|------------|-------------------------------------|--------------------|------------------------------|
| GET        | /notifications                      | Authenticated      | Lấy notifications của user   |
| GET        | /notifications/unread-count         | Authenticated      | Lấy số notification chưa đọc |
| PATCH      | /notifications/:notificationId/read | Notification owner | Mark one as read             |
| PATCH      | /notifications/read-all             | Authenticated      | Mark all as read             |
| DELETE     | /notifications/:notificationId      | Notification owner | Xóa notification             |
| DELETE     | /notifications/clear-read           | Authenticated      | Xóa notification đã đọc      |

### 24.2. Notification Types

TASK_ASSIGNED

TASK_SUBMITTED

TASK_APPROVED

REVISION_REQUESTED

EDITOR_COMMENT

BOARD_DECISION

RANKING_WARNING

PAYROLL_CONFIRMED

PUBLICATION_UPDATED

## 25. Dashboard API

### 25.1. Purpose

Cung cấp dữ liệu dashboard theo từng role.

| **Method** | **Endpoint**         | **Access** | **Description**     |
|------------|----------------------|------------|---------------------|
| GET        | /dashboard/admin     | Admin      | Admin dashboard     |
| GET        | /dashboard/mangaka   | Mangaka    | Mangaka dashboard   |
| GET        | /dashboard/assistant | Assistant  | Assistant dashboard |
| GET        | /dashboard/editor    | Editor     | Editor dashboard    |
| GET        | /dashboard/board     | Board      | Board dashboard     |

### 25.2. GET /dashboard/mangaka

Response includes:

{

"success": true,

"data": {

"totalSeries": 3,

"activeSeries": 2,

"pendingSubmissions": 8,

"tasksDueSoon": 5,

"rankingWarnings": 1,

"monthlyPayrollPending": 420

}

}

## 26. Search API

### 26.1. Purpose

Global search theo quyền user.

| **Method** | **Endpoint**   | **Access**               | **Description**                |
|------------|----------------|--------------------------|--------------------------------|
| GET        | /search        | Authenticated            | Global search                  |
| GET        | /search/series | Authenticated            | Search series                  |
| GET        | /search/tasks  | Authenticated            | Search tasks                   |
| GET        | /search/users  | Admin / Mangaka / Editor | Search users for invite/assign |

### 26.2. GET /search

Query:

?q=keyword&type=series,task,page

## 27. Audit Log API

### 27.1. Purpose

Ghi và xem lịch sử hành động quan trọng.

| **Method** | **Endpoint**                             | **Access** | **Description**        |
|------------|------------------------------------------|------------|------------------------|
| GET        | /audit-logs                              | Admin      | Lấy audit logs         |
| GET        | /audit-logs/:auditLogId                  | Admin      | Lấy chi tiết audit log |
| GET        | /audit-logs/target/:targetType/:targetId | Admin      | Logs theo target       |
| GET        | /audit-logs/actor/:userId                | Admin      | Logs theo user         |

### 27.2. Important Audit Actions

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

## 28. Storage Admin API

### 28.1. Purpose

Theo dõi storage usage.

| **Method** | **Endpoint**               | **Access** | **Description**          |
|------------|----------------------------|------------|--------------------------|
| GET        | /storage/usage             | Admin      | Tổng dung lượng storage  |
| GET        | /storage/files             | Admin      | Danh sách files          |
| GET        | /storage/large-files       | Admin      | File lớn                 |
| GET        | /storage/by-owner-type     | Admin      | Usage theo owner type    |
| POST       | /storage/cleanup-orphans   | Admin      | Dọn file không còn owner |
| POST       | /storage/recalculate-usage | Admin      | Recalculate usage        |

## 29. System Health API

### 29.1. Purpose

Kiểm tra trạng thái hệ thống.

| **Method** | **Endpoint**     | **Access** | **Description**    |
|------------|------------------|------------|--------------------|
| GET        | /health          | Public     | Backend health     |
| GET        | /health/database | Admin      | MongoDB health     |
| GET        | /health/storage  | Admin      | R2/MinIO health    |
| GET        | /health/ai       | Admin      | AI service health  |
| GET        | /health/full     | Admin      | Full system health |

### 29.2. GET /health

Response:

{

"success": true,

"data": {

"status": "OK",

"service": "mangaflow-api",

"timestamp": "2026-06-02T00:00:00.000Z"

}

}

## 30. API Module Mapping

| **Module**   | **Main Routes**                                     |
|--------------|-----------------------------------------------------|
| auth         | /auth/\*                                            |
| user         | /users/\*                                           |
| series       | /series/\*                                          |
| seriesMember | /series/:seriesId/members/\*                        |
| board        | /board/\*                                           |
| manuscript   | /manuscripts/\*, /series/:seriesId/manuscripts/\*   |
| chapter      | /chapters/\*, /series/:seriesId/chapters/\*         |
| page         | /pages/\*, /chapters/:chapterId/pages/\*            |
| file         | /files/\*                                           |
| region       | /regions/\*, /pages/:pageId/regions/\*              |
| annotation   | /annotations/\*, /pages/:pageId/annotations/\*      |
| task         | /tasks/\*                                           |
| submission   | /submissions/\*                                     |
| comment      | /comments/\*                                        |
| review       | /reviews/\*                                         |
| vote         | /board/votes/\*, /series/:seriesId/votes/\*         |
| decision     | /board/decisions/\*, /series/:seriesId/decisions/\* |
| publication  | /publications/\*                                    |
| ranking      | /rankings/\*                                        |
| payroll      | /payroll/\*                                         |
| taskRate     | /task-rates/\*                                      |
| ai           | /ai/\*, /pages/:pageId/ai/\*                        |
| notification | /notifications/\*                                   |
| dashboard    | /dashboard/\*                                       |
| search       | /search/\*                                          |
| audit        | /audit-logs/\*                                      |
| storage      | /storage/\*                                         |
| health       | /health/\*                                          |

## 31. Recommended MVP API Implementation Order

### Step 1 — Foundation

/auth/me

/auth/sync-user

/users

/users/:userId

/health

### Step 2 — Series Core

/series

/series/:seriesId

/series/:seriesId/members

/series/:seriesId/manuscripts

### Step 3 — Chapter & Page

/series/:seriesId/chapters

/chapters/:chapterId/pages

/pages/:pageId

/pages/:pageId/versions

/files/:fileId/signed-url

### Step 4 — Annotation & Task

/pages/:pageId/regions

/pages/:pageId/annotations

/tasks

/tasks/:taskId

/tasks/:taskId/submit

### Step 5 — Submission & Review

/submissions

/submissions/:submissionId

/comments

/comments/:commentId/mark-fixed

/comments/:commentId/verify-fixed

/comments/:commentId/resolve

### Step 6 — Editor & Board

/manuscripts/:manuscriptId/approve

/chapters/:chapterId/approve

/pages/:pageId/editor-approve

/series/:seriesId/votes

/series/:seriesId/decisions/finalize

### Step 7 — Ranking & Publication

/rankings/import

/rankings/calculate

/publications

/publications/:publicationId/publish

### Step 8 — Payroll

/task-rates

/payroll/tasks/:taskId/calculate

/payroll/tasks/:taskId/confirm

/payroll/me

### Step 9 — AI

/ai/health

/pages/:pageId/ai/bubble-detect

/pages/:pageId/ai/bubble-process

/chapters/:chapterId/ai/batch-bubble-process

### Step 10 — Admin & Polish

/dashboard/\*

/notifications

/audit-logs

/storage/usage

/health/full
