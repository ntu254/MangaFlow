# Mangaka UI/UX Review

Ngay review: 2026-06-20
Pham vi: Toan bo UI cua role **Mangaka** tren client (`client/src`).
Muc tieu: KHONG redesign. Chi tim bug, diem cai thien, va kiem tra dong bo du lieu that (API) vs mock/hardcode.

Quy uoc:
- Duong dan dung goc `client/src`.
- So dong (`L..`) tham chieu tai thoi diem review, co the lech vai dong sau khi chinh sua.
- "Mock" = du lieu lay tu `@/entities` (lop du lieu gia) thay vi API that (`@/shared/api`, `@/shared/queries`).

---

## 0. Tom tat dieu hanh

Ve mat thi giac, UI Mangaka da chin va dong bo (design system token oklch navy/cream, dark mode, 46 component shadcn). **Khong can redesign.**

Van de lon nhat la **dong bo du lieu**: ton tai hai "the gioi" song song trong codebase — lop API that va lop mock `@/entities` — va nhieu man Mangaka quan trong van render tu mock hoac co nut bam khong wire vao API.

Phan loai nhanh muc do hoan thien tung man Mangaka:

| Man | Route/Component | Data | Tinh trang |
| --- | --- | --- | --- |
| New Series wizard | `routes/app/series/new.tsx` | API that | OK — chuan mau |
| Series Overview tab | `routes/app/series/$id.overview.tsx` | API that | OK |
| Series Manuscript tab | `routes/app/series/$id.manuscript.tsx` | API that | OK |
| Series Chapters tab | `routes/app/series/$id.chapters.tsx` | API that | OK (vai gia tri cung) |
| Series list | `routes/app/series/index.tsx` | API that | Progress random + pagination/filter gia |
| Series detail header/actions | `routes/app/series/$id.tsx` | API that | BUG casing role/status + gia tri cung |
| Tasks tab | `routes/app/series/$id.tasks.tsx` | API that | Doc that, tuong tac gia |
| Team tab | `routes/app/series/$id.team.tsx` | API doc, ghi gia | Mutation deu la toast gia |
| Reviews tab (Flow 06) | `routes/app/series/$id.reviews.tsx` | Mock | Mock toan bo, nut khong goi API |
| Activity tab | `routes/app/series/$id.activity.tsx` | Mock | Loader luon 404 voi data that |
| Revisions tab | `routes/app/series/$id.revisions.tsx` | Mock | Loader luon 404 voi data that |
| Publication tab | `routes/app/series/$id.publication.tsx` | — | "Coming Soon" placeholder |
| Review Queue | `routes/app/review.tsx` | Mock | Mock toan bo |
| Task Overview | `features/tasks/components/TasksWorkspace.tsx` | Mock | Mock toan bo |
| Dashboard | `features/dashboard/components/MangakaDash.tsx` (+5 panel) | Mock/cung | Khong dung `useDashboard` da co |
| Sidebar | `layouts/Sidebar.tsx` | mix | Badge "12" cung, Quick Create chet |

---

## 1. CRITICAL — Bug chan chuc nang / sai du lieu

### 1.1 Bug casing role lam chet toan bo action panel cua Series detail
File: `routes/app/series/$id.tsx`
- L177: `role === "MANGAKA" && series.status === "DRAFT"` -> nut **Delete Draft**
- L183: `role === "MANGAKA" && [...].includes(series.status)` -> nut **Withdraw Proposal**
- L189: `(role === "MANGAKA" || role === "ADMIN" || role === "BOARD_MEMBER")` -> nut **Cancel / Request Cancellation**
- L195: `role === "ADMIN"` -> nut **Hard Delete**

`useRole()` (xem `shared/lib/role.tsx`) luon tra **lowercase** (`"mangaka"`, `"admin"`, `"board"`). So sanh uppercase nen tat ca dieu kien deu false -> **cac nut hanh dong chinh cua Flow 01 khong bao gio hien**. Ngoai ra `"BOARD_MEMBER"` khong phai role hop le (role la `"board"`).
Fix: doi sang lowercase (`"mangaka"`, `"admin"`, `"board"`).

### 1.2 Bug casing status (toan cuc)
Backend tra status **uppercase** (`server/src/modules/series/series.repository.ts` giu nguyen `EDITOR_REVIEW`, `DRAFT`, `ONGOING`...). Nhung UI map theo **lowercase-hyphen**:
- `shared/ui/site/StatusBadge.tsx` (STATUS_MAP key: `editor-review`, `draft`, `ongoing`...) -> khong khop -> roi vao fallback, hien chuoi tho `EDITOR_REVIEW`.
- `routes/app/series/index.tsx` tab filter + `counts` so voi `s.status` lowercase -> dem sai, loc rong.
- `routes/app/series/$id.tsx` dieu kien o muc 1.1 cung dung uppercase (vo tinh dung phia backend nhung lech voi phan con lai cua app).

Fix de xuat: them 1 lop normalize dung chung (uppercase API <-> lowercase-hyphen UI) thay vi sua rai rac.

### 1.3 Tab Activity va Revisions luon 404 voi du lieu that
- `routes/app/series/$id.activity.tsx` (L11-15): loader `findSeries(params.id)` tu mock `@/entities`, `if (!s) throw notFound()`.
- `routes/app/series/$id.revisions.tsx` (L22-26): tuong tu.

Series that co id la Mongo ObjectId, khong khop id mock -> 2 tab nay **luon bao "Series not found"**.
Fix: thay loader bang `useSeriesSummary(id)` / API that.

### 1.4 Reviews tab (Flow 06) — mock toan bo, nut khong goi API
File: `routes/app/series/$id.reviews.tsx`
- Data: `submissions` tu mock; neu rong thi fallback `seriesSubmissions = submissions` (luon show data gia).
- Anh Original/Submitted la cung 1 anh Unsplash + blur (mock).
- Comment cung (hardcode trong JSX).
- L204: nut gui comment (Send) — khong wire.
- L210: nut **Request Changes** — khong wire.
- L214: nut **Approve** — khong wire.

Day la man cot loi cua Mangaka (duyet submission Assistant). Hien tai khong the duyet bai that.

### 1.5 Review Queue route (`/app/review`) — mock toan bo
File: `routes/app/review.tsx` loc `chapters` tu `@/entities`. Trong sidebar (`Sidebar.tsx` L48) badge cung `"12"`, va `features/dashboard/components/mangaka/ReviewQueueList.tsx` cung hardcode "12".

### 1.6 Task Overview (`/app/tasks`) — mock toan bo
File: `features/tasks/components/TasksWorkspace.tsx` (L3, L18) dung `allTasks` + `currentUserByRole` tu `@/entities`. Mangaka thay task gia thay vi task that cua series minh.

---

## 2. HIGH — Render data gia du da co API that san sang

### 2.1 Mangaka Dashboard tinh, khong dung `useDashboard` da co
`features/dashboard/components/MangakaDash.tsx` + cac panel:
- `mangaka/ProductionOverview.tsx`: 5 con so cung (`3, 12, 184, 27, 18`).
- `mangaka/MangakaRightPanel.tsx`: lich "May 15, 2025", activity & notification deu cung (Vagabond, Real, Slam Dunk).
- `mangaka/RecentChaptersList.tsx`: `isCompleted = i === 3 // fake for the mockup`, "18 / 20 pages", "Updated {i+1}h ago".
- `mangaka/MangakaHeader.tsx`: dung `currentUserByRole[role]` (user mock) thay vi `user` that tu context.
- `mangaka/MySeriesCarousel.tsx`: `series` tu mock.

Da ton tai `shared/queries/useDashboard.ts` -> `dashboardApi.mangaka()` (`/dashboard/mangaka/summary`) nhung **khong man nao dung**.
Luu y: backend `getMangakaSummaryService` (`server/src/modules/dashboard/dashboard.service.ts`) cung dang stub — `nextActions` hardcode, `countSeries()` co comment `// should filter by owner` nhung chua filter theo owner. Noi API can di kem hoan thien service nay.

### 2.2 Team tab — doc that, ghi gia
File: `routes/app/series/$id.team.tsx`
- Doc `summary.members` (that).
- `setStatus()` (L62-65) chi `toast.success("Simulated action...")` — khong goi API.
- Cac nut khong wire: Reactivate (L196), menu Pause (L204) / Remove (L216), Send Invite (L339), Resend (L297), Cancel (L300).
- `pendingInvites` (L67-69) la mang cung.
- Map status chi `active/paused`, mat `PENDING_INVITE`, `REMOVED` cua Flow 03.

Backend da co `series-member.service.ts` day du (add/pause/reactivate/remove + audit) — chi can wire.

### 2.3 Series detail header tron data that voi gia tri cung
File: `routes/app/series/$id.tsx`
- Genres cung (L124-127): Action / Fantasy / Dark Fantasy / Supernatural.
- `Pages 234 / 300` (L156), `Created Jan 12, 2024` (L160), `Chapters ... || 12` (L152).
- Description fallback (L106): "The world ended once. He remembers."
- Nut chua wire: Edit pencil (L115), "Open Page Workspace" (L173), "Series Settings" (L201).

### 2.4 Series list — progress ngau nhien va phan trang gia
File: `routes/app/series/index.tsx`
- L240: `const progress = Math.floor(Math.random()*60)+20 // Mock` -> thanh tien do nhay so moi lan render.
- Dropdown "Status" (L214) va "Publication Type" (L220) tinh, khong hoat dong.
- Pagination L387-405 (1,2,3...8) la tinh.
- Nut MoreHorizontal tren card (L268) chua wire.
- "1h ago" cung.

---

## 3. MEDIUM — UX, trang thai, dong bo

### 3.1 Tasks tab: data that nhung tuong tac gia
File: `routes/app/series/$id.tasks.tsx`
- Filter buttons (Chapter/Page/Status/Task Type/Assignee) L102 — no-op.
- Nut action Start/Open/Review (L167) + MoreVertical (L170) — no-op.
- Pagination (L193-199) + "Rows per page" (L205) — no-op.
- `getSubmission`/`getActionBtn` so theo status hyphen, nhung status that co the uppercase.

### 3.2 Hardcode mau sang, vo dark mode
- `$id.team.tsx`: avatar `bg-slate-100 text-slate-700`, input Quick Invite `bg-[#F5EFE6] border-[#E5DFD3]`.
- `$id.tasks.tsx`: badge `bg-blue-100 text-blue-600`, nhieu `bg-[#FCFAEF]`, `border-[#E5DFD3]`, `bg-slate-900`.
- `MangakaHeader.tsx`: `bg-[#FAF8F5]`.
- `series/index.tsx`: hero `bg-[#F7F5F0]`, text `text-[#061A2B]`.
Du an co dark mode (`styles.css`) -> cac cho nay lech tong o dark.

### 3.3 Loading/empty/error khong dong bo
Moi man tu che: cho thi `animate-pulse` text, cho "Loading series...", cho dung `EmptyState`. Chua co skeleton chuan. Nhieu man mock khong co nhanh error.

### 3.4 Dung `confirm()` native cho hanh dong nguy hiem
`$id.tsx`: `handleDeleteDraft`/`handleWithdraw`/`handleCancel`/`handleHardDelete` dung `confirm()`. Du an da co `alert-dialog` (shadcn) va pattern dialog dep ngay trong `new.tsx`. Nen thong nhat.

### 3.5 Quick Create trong Sidebar la nut chet
`layouts/Sidebar.tsx`: nut "New Series Proposal" (L159) va nut `+` (L145, L154) khong co `onClick`/`Link`, du route `/app/series/new` da ton tai.

### 3.6 Anh placeholder Unsplash hardcode
`$id.tsx`, `series/index.tsx`, `reviews` dung chung 1 link Unsplash. Offline/CSP chan se vo anh.

### 3.7 Nav Mangaka: doi chieu lai quyen
Sidebar cho Mangaka thay "Reader Preview" va "Rankings" — can doi chieu Flow 09/10 xem Mangaka co nen thay khong va o muc nao.

---

## 4. Diem tot (giu nguyen, khong sua)

- **New Series wizard** (`routes/app/series/new.tsx` + `features/series/new/*`): wired API that day du (create/update/submit), autosave, validation theo step, beforeunload guard, confirm dialog dep. Day la chuan mau nen nhan rong.
- Tab **overview / manuscript / chapters**: dung `useSeriesSummary`, `useChapterPages`, `useManuscripts`, `useFileDownloadUrl` that; co xu ly ca `in-production`/`in_production`.
- Design system (token oklch, dark mode, 46 component shadcn, `StatusBadge`, sidebar collapse) nhat quan, chin chu.

---

## 5. Uu tien de xuat (khi fix)

1. **Sua casing role/status**: them lop normalize dung chung (uppercase API <-> lowercase UI), fix ngay `$id.tsx`. Bug chan chuc nang, rui ro thap.
2. **Noi API that** cho Reviews tab (Flow 06), Team mutations (backend san sang), Review Queue.
3. **Noi Dashboard** vao `useDashboard("mangaka")`, dong thoi hoan thien `getMangakaSummaryService` (filter theo owner, bo hardcode).
4. **Bo `Math.random()` progress** + pagination/filter gia o series list & tasks tab (hoac an cho toi khi co API).
5. **Sua Activity/Revisions loader** dung API that (dang luon 404).
6. **Don hardcode mau sang** de dark mode khong vo; thong nhat loading/empty/error; thay `confirm()` bang alert-dialog.

---

## 6. Phu luc — Danh sach nut/tuong tac chua wire (kem so dong)

### `routes/app/series/$id.tsx`
| Dong | Phan tu | Trang thai |
| --- | --- | --- |
| L115 | Edit (pencil) tieu de | Khong wire |
| L173 | Open Page Workspace | Khong wire |
| L178 | Delete Draft | Co handler nhung **an do bug casing 1.1** |
| L184 | Withdraw Proposal | Co handler nhung **an do bug casing 1.1** |
| L190 | Cancel / Request Cancellation | Co handler nhung **an do bug casing 1.1** |
| L196 | Hard Delete | Co handler nhung **an do bug casing 1.1** |
| L201 | Series Settings | Khong wire |

### `routes/app/series/index.tsx`
| Dong | Phan tu | Trang thai |
| --- | --- | --- |
| L214 | Dropdown Status | Tinh |
| L220 | Dropdown Publication Type | Tinh |
| L268 | MoreHorizontal tren card | Khong wire |
| L387-405 | Pagination 1..8 | Tinh |
| L240 | Progress bar | `Math.random()` |

### `routes/app/series/$id.tasks.tsx`
| Dong | Phan tu | Trang thai |
| --- | --- | --- |
| L102 | Filter Chapter/Page/Status/Task Type/Assignee | No-op |
| L167 | Action Start/Open/Review | No-op |
| L170 | MoreVertical | No-op |
| L193-199 | Pagination | No-op |
| L205 | Rows per page | No-op |

### `routes/app/series/$id.team.tsx`
| Dong | Phan tu | Trang thai |
| --- | --- | --- |
| L62-65 | `setStatus()` | Chi toast gia |
| L191 | View profile | Khong wire |
| L196 | Reactivate | Goi `setStatus` gia |
| L204 | Pause member | Goi `setStatus` gia |
| L216 | Remove member | Goi `setStatus` gia |
| L297 | Resend invite | Khong wire |
| L300 | Cancel invite | Khong wire |
| L339 | Send Invite | Khong wire |

### `routes/app/series/$id.reviews.tsx`
| Dong | Phan tu | Trang thai |
| --- | --- | --- |
| L204 | Send comment | Khong wire |
| L210 | Request Changes | Khong wire |
| L214 | Approve | Khong wire |

### `layouts/Sidebar.tsx`
| Dong | Phan tu | Trang thai |
| --- | --- | --- |
| L48 | Badge Review Queue "12" | Hardcode |
| L145 | Quick Create `+` (collapsed) | Khong wire |
| L154 | Quick Create `+` (expanded) | Khong wire |
| L159 | New Series Proposal | Khong wire (route da co) |
