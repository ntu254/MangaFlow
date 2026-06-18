# MangaFlow REST API Documentation

**Base URL:** `http://localhost:5000/api`  
**Auth:** Bearer JWT — `Authorization: Bearer <access_token>`  
**Response envelope:** `{ success: boolean, data: T, message?: string }`

---

## Roles

| Role | Description |
|---|---|
| `ADMIN` | System administrator |
| `MANGAKA` | Series author/creator |
| `EDITOR` | Tantou editor — reviews manuscripts and tasks |
| `ASSISTANT` | Production assistant — completes assigned tasks |
| `BOARD` | Editorial board member — votes on series |

---

## Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Check if server is running |

---

## 🔐 Auth — `/api/auth`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | None | — | Login with email & password. Rate-limited (5 req/15min) |
| `POST` | `/api/auth/logout` | None | — | Logout (clear refresh token) |
| `POST` | `/api/auth/refresh-token` | None | — | Exchange refresh token for new access token |
| `GET` | `/api/auth/me` | ✅ | Any | Get current authenticated user |
| `POST` | `/api/auth/admin/users` | ✅ | ADMIN | Admin creates a new user account |

**Login request body:**
```json
{ "email": "user@example.com", "password": "secret" }
```
**Login response:**
```json
{ "success": true, "data": { "accessToken": "...", "user": { "id": "...", "email": "...", "role": "EDITOR" } } }
```

---

## 📊 Dashboard — `/api/dashboard`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/dashboard/admin/sidebar-summary` | ✅ | ADMIN | Admin sidebar stats and system health |
| `GET` | `/api/dashboard/mangaka/summary` | ✅ | MANGAKA | Mangaka task & series overview |
| `GET` | `/api/dashboard/assistant/summary` | ✅ | ASSISTANT | Assistant task metrics |
| `GET` | `/api/dashboard/editor/summary` | ✅ | EDITOR | Editor review queue counts |
| `GET` | `/api/dashboard/board/summary` | ✅ | BOARD | Board pending votes and at-risk series |

---

## 📚 Series — `/api/series`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/series` | ✅ | Any | List all series (filterable by status, role) |
| `GET` | `/api/series/:seriesId` | ✅ | Any | Get series detail |
| `GET` | `/api/series/:seriesId/summary` | ✅ | Any | Get series summary for dashboard cards |
| `POST` | `/api/series` | ✅ | MANGAKA | Create a new series |
| `PATCH` | `/api/series/:seriesId` | ✅ | MANGAKA | Update series metadata |
| `POST` | `/api/series/:seriesId/submit` | ✅ | MANGAKA | Submit series to editor review |
| `POST` | `/api/series/:seriesId/submit-to-editor` | ✅ | MANGAKA | Alias: submit series to editor |
| `POST` | `/api/series/:seriesId/manuscripts/uploads` | ✅ | MANGAKA | Upload a manuscript to a series |
| `GET` | `/api/series/:seriesId/members` | ✅ | MANGAKA / EDITOR / ASSISTANT (series member) | List series production team |
| `POST` | `/api/series/:seriesId/members` | ✅ | MANGAKA / EDITOR | Add a member to the series team |
| `PATCH` | `/api/series/:seriesId/members/:memberId` | ✅ | MANGAKA / EDITOR | Update a member's role/status |
| `DELETE` | `/api/series/:seriesId/members/:memberId` | ✅ | MANGAKA / EDITOR | Remove a member from the series team |
| `GET` | `/api/series/:seriesId/eligible-assistants` | ✅ | MANGAKA / EDITOR / ADMIN | List assistants available to assign |

---

## ✏️ Editor — `/api/editor`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/editor/manuscripts/review-queue` | ✅ | EDITOR | List manuscripts awaiting editor review |
| `GET` | `/api/editor/series/:seriesId/review` | ✅ | EDITOR | Get current review data for a series |
| `POST` | `/api/editor/series/:seriesId/start-review` | ✅ | EDITOR | Begin editor review session for a series |
| `POST` | `/api/editor/series/:seriesId/request-revision` | ✅ | EDITOR | Request revisions from Mangaka |
| `POST` | `/api/editor/series/:seriesId/reject` | ✅ | EDITOR | Reject the series |
| `POST` | `/api/editor/series/:seriesId/forward-to-board` | ✅ | EDITOR | Forward approved series to Board |

**Request revision body:**
```json
{ "note": "Please fix the panel layout on page 5." }
```

---

## 📜 Manuscripts — `/api/manuscripts`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/manuscripts/:manuscriptId/request-revision` | ✅ | EDITOR | Request revision on a specific manuscript |
| `POST` | `/api/manuscripts/:manuscriptId/forward-to-board` | ✅ | EDITOR | Forward manuscript to board |
| `POST` | `/api/manuscripts/:manuscriptId/reject` | ✅ | EDITOR | Reject a manuscript |

---

## 🗳️ Board — `/api/board`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/board/queue` | ✅ | BOARD | List series awaiting board vote |
| `POST` | `/api/board/series/:seriesId/votes` | ✅ | BOARD | Cast a vote on a series |
| `POST` | `/api/board/series/:seriesId/vote` | ✅ | BOARD | Alias: cast vote |
| `POST` | `/api/board/series/:seriesId/decisions/finalize` | ✅ | BOARD | Finalize board decision |
| `POST` | `/api/board/series/:seriesId/finalize-decision` | ✅ | BOARD | Alias: finalize decision |
| `POST` | `/api/board/series/:seriesId/decisions/tie-break` | ✅ | BOARD | Board chair resolves a tie |
| `POST` | `/api/board/series/:seriesId/tie-break` | ✅ | BOARD | Alias: tie-break |
| `POST` | `/api/board/series/:seriesId/at-risk-decisions` | ✅ | BOARD | Create an at-risk intervention decision |

**Vote body:**
```json
{ "vote": "APPROVE" }
```
> vote: `"APPROVE"` | `"REJECT"` | `"NEEDS_REVISION"`

---

## 📖 Chapters — `/api/chapters`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/chapters` | ✅ | MANGAKA / EDITOR (series member) | Create a new chapter |
| `GET` | `/api/chapters/series/:seriesId` | ✅ | Any | List chapters in a series |
| `GET` | `/api/chapters/:chapterId` | ✅ | Any | Get chapter detail |
| `GET` | `/api/chapters/:chapterId/readiness` | ✅ | ADMIN / MANGAKA / EDITOR | Get chapter publication readiness checklist |
| `POST` | `/api/chapters/:chapterId/mark-ready` | ✅ | EDITOR (chapter member) | Mark chapter as production-ready |
| `PATCH` | `/api/chapters/:chapterId/status` | ✅ | MANGAKA / EDITOR (chapter member) | Update chapter status |
| `POST` | `/api/chapters/:chapterId/pages` | ✅ | MANGAKA / EDITOR (chapter member) | Add a page to the chapter |
| `GET` | `/api/chapters/:chapterId/pages` | ✅ | Any | List pages of a chapter |

---

## 🖼️ Pages — `/api/pages`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/pages/:pageId` | ✅ | Get a page with its regions |
| `POST` | `/api/pages/:pageId/ai-segment` | ✅ | Trigger AI segmentation for a page |

---

## 📁 Files — `/api/files`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/files/:fileAssetId` | ✅ | Get file asset metadata |
| `POST` | `/api/files/upload` | ✅ | Upload a file asset |

---

## ✅ Tasks — `/api/tasks`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/tasks` | ✅ | MANGAKA / EDITOR (series member) | Create a new task |
| `GET` | `/api/tasks/:taskId` | ✅ | Any | Get task detail |
| `GET` | `/api/tasks/series/:seriesId` | ✅ | Any | List tasks in a series |
| `GET` | `/api/tasks/chapter/:chapterId` | ✅ | Any | List tasks in a chapter |
| `GET` | `/api/tasks/assignee/:assigneeId` | ✅ | Any | List tasks assigned to a user |
| `PATCH` | `/api/tasks/:taskId/status` | ✅ | Any | Update task status |
| `PATCH` | `/api/tasks/:taskId/priority` | ✅ | Any | Update task priority |
| `PATCH` | `/api/tasks/:taskId/due-date` | ✅ | Any | Update task due date |

> Task status values: `TODO` · `IN_PROGRESS` · `SUBMITTED` · `REVISION_REQUESTED` · `APPROVED` · `REJECTED`

---

## 📝 Task Types — `/api/task-types`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/task-types` | ✅ | Any | List active task types |
| `GET` | `/api/task-types/:taskTypeId` | ✅ | ADMIN | Get a task type |
| `GET` | `/api/task-types/with-rates` | ✅ | ADMIN | List task types with rate info |
| `DELETE` | `/api/task-types/:taskTypeId` | ✅ | ADMIN | Delete a task type |

---

## 📨 Submissions — `/api`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/tasks/:taskId/submissions` | ✅ | Assistant submits work for a task |
| `GET` | `/api/tasks/:taskId/submissions` | ✅ | List all submissions for a task |
| `GET` | `/api/submissions/review-queue` | ✅ | List submissions pending review (Editor view) |
| `POST` | `/api/submissions/:submissionId/mangaka-approve` | ✅ | Mangaka approves a submission |
| `POST` | `/api/submissions/:submissionId/request-revision` | ✅ | Request revision on a submission |
| `POST` | `/api/submissions/:submissionId/reject` | ✅ | Reject a submission |
| `POST` | `/api/submissions/:submissionId/editor-approve` | ✅ | Editor final approval of a submission |
| `POST` | `/api/submissions/:submissionId/editor-reject` | ✅ | Editor rejects from MANGAKA_APPROVED state |

**Create submission body:**
```json
{ "resultText": "...", "fileAssetId": "..." }
```
**Review action body:**
```json
{ "reviewerNote": "Please redo the background shading." }
```

---

## 💬 Comments — `/api/comments`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/comments` | ✅ | Create a comment on a task |
| `GET` | `/api/comments/task/:taskId` | ✅ | List comments on a task |
| `POST` | `/api/comments/:id/mark-fixed` | ✅ | Assistant marks comment as fixed |
| `POST` | `/api/comments/:id/verify-fixed` | ✅ | Mangaka verifies the fix |
| `POST` | `/api/comments/:id/resolve` | ✅ | Editor resolves the comment |
| `POST` | `/api/comments/:id/reopen` | ✅ | Reopen a resolved comment |

> Comment status flow: `OPEN` → `FIXED_BY_ASSISTANT` → `VERIFIED_BY_MANGAKA` → `RESOLVED_BY_EDITOR`

---

## 🏆 Rankings — `/api/rankings`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/rankings` | ✅ | BOARD | List all rankings |
| `POST` | `/api/rankings/import` | ✅ | BOARD | Import reader ranking data |
| `POST` | `/api/rankings/:rankingId/submit` | ✅ | BOARD | Submit ranking for review |
| `POST` | `/api/rankings/:rankingId/finalize` | ✅ | BOARD | Finalize ranking results |
| `POST` | `/api/rankings/:rankingId/void` | ✅ | BOARD / ADMIN | Void a ranking |
| `GET` | `/api/rankings/my-rankings` | ✅ | MANGAKA | Mangaka's own ranking history |

---

## 💰 Payroll — `/api/payroll`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/payroll/tasks/:taskId/calculate` | ✅ | Calculate earning for a completed task |
| `POST` | `/api/payroll/tasks/:taskId/confirm` | ✅ | Admin/Editor confirms the earning amount |
| `POST` | `/api/payroll/earnings/:earningId/mark-paid` | ✅ | Admin marks earning as paid |
| `GET` | `/api/payroll/earnings` | ✅ | List all earnings (filtered per actor) |

---

## 📅 Publications — `/api/publications`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/publications` | ✅ | EDITOR | Create a publication record for a chapter |
| `PATCH` | `/api/publications/:publicationId` | ✅ | EDITOR | Update publication details |
| `POST` | `/api/publications/:publicationId/schedule` | ✅ | EDITOR | Schedule a publication date |
| `POST` | `/api/publications/:publicationId/cancel` | ✅ | EDITOR | Cancel a scheduled publication |
| `POST` | `/api/publications/:publicationId/publish` | ✅ | EDITOR | Mark as published |

---

## 🔔 Notifications — `/api/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | ✅ | List notifications for current user |
| `PATCH` | `/api/notifications/:notificationId/read` | ✅ | Mark a notification as read |
| `PATCH` | `/api/notifications/:notificationId/archive` | ✅ | Archive a notification |

> Notification status: `UNREAD` → `READ` → `ARCHIVED`

---

## 🛡️ Admin — `/api/admin`

> All routes require **ADMIN** role.

### Users
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/users` | List all users |
| `POST` | `/api/admin/users` | Create a new user |
| `PATCH` | `/api/admin/users/:userId` | Update user details |
| `DELETE` | `/api/admin/users/:userId` | Delete user |
| `PATCH` | `/api/admin/users/:userId/role` | Change user role |
| `PATCH` | `/api/admin/users/:userId/status` | Activate or suspend user |

### Board Members
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/board-members` | List all board members |
| `POST` | `/api/admin/board-members` | Add a user to the board |
| `PATCH` | `/api/admin/board-members/:userId/status` | Activate/deactivate board member |
| `PATCH` | `/api/admin/board-members/:userId/chair` | Set or remove board chair status |

### Task Types
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/task-types` | List all task types |
| `POST` | `/api/admin/task-types` | Create a task type |
| `PATCH` | `/api/admin/task-types/:taskTypeId` | Update a task type |
| `PATCH` | `/api/admin/task-types/:taskTypeId/status` | Toggle task type active/inactive |
| `DELETE` | `/api/admin/task-types/:taskTypeId` | Delete a task type |

### Audit Logs
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/audit-logs` | List all audit log entries |

---

## 🌐 Public Reader — `/api/public`

> No authentication required.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/public/series/:seriesSlug` | Get published series info by slug |
| `GET` | `/api/public/chapters/:chapterSlug` | Get chapter by slug |
| `GET` | `/api/public/chapters/:chapterId/pages` | List pages of a published chapter |
| `POST` | `/api/public/reader-metrics` | Record reader engagement metrics |

**Reader metrics body:**
```json
{ "chapterId": "...", "timeSpentSeconds": 120, "pagesRead": 15 }
```

---

## 📖 Swagger UI

Interactive docs available at: `http://localhost:5000/api-docs`  
Requires running `npm run swagger --prefix server` once to generate `swagger-output.json`.

---

## Common Error Codes

| Status | Meaning |
|---|---|
| `400` | Validation error — check request body/params |
| `401` | Unauthenticated — missing or expired token |
| `403` | Unauthorized — insufficient role/permission |
| `404` | Resource not found |
| `409` | Conflict — duplicate or invalid state transition |
| `429` | Rate limited (login endpoint) |
| `500` | Internal server error |
