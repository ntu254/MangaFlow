# Archive Series — MVP Guard Fixes (2026-08-03)

## Context

Audit của luồng Archive Series (frontend + backend) tìm ra 5 điểm lệch so với định nghĩa
CONTEXT.md: "Archive = retained but **inactive** Series". Quyết định phạm vi: **chỉ sửa 2 điểm
MVP**, còn lại ghi TODO.

## Decisions

1. **Backend guard tập trung** tại `assertCanMutateSeries` (không rải guard ở từng controller).
2. **UI studio chặn** qua `getStudioPermissions.canEnterStudio = false` khi ARCHIVED — tận dụng
   cơ chế `effectiveTab` fallback overview đã có sẵn ở `series-detail-page.tsx`.
3. Dùng 409 + code riêng (`SERIES_ARCHIVED` / `SERIES_DELETED`) thay vì 403 generic — mangaka vẫn
   đọc được series archived nên "no permission" sẽ gây hiểu lầm.
4. Không chặn HIATUS (tạm nghỉ, có thể quay lại) — chỉ ARCHIVED (+ deletedAt cho deleted).

## Backend Change

`backend/src/services/authorization.service.ts` — `assertCanMutateSeries`:

```ts
export async function assertCanMutateSeries(actor, series) {
  if (String(series.status) === "ARCHIVED") {
    throw new AppError(409, "Series is archived and cannot be modified.", "SERIES_ARCHIVED");
  }
  if (series.deletedAt) {
    throw new AppError(409, "Series is deleted and cannot be modified.", "SERIES_DELETED");
  }
  if (!(await canMutateSeries(actor, series))) throw forbidden(...);
}
```

Phạm vi bị chặn trên series archived (mọi thứ đi qua guard này):
- `patchSeries` (title/synopsis/cadence...)
- Chapter content + chapter actions (`assertCanMutateChapter` → `assertCanMutateSeries`)
- Task / region / studio-page mutations
- Material edits gắn series

Không gãy:
- `deleteSeries` tự check quyền (không qua guard) → vẫn xóa/dọn được series archived.
- `ARCHIVE`/`UNPUBLISH`/`START_PRODUCTION` trên series archived → 409 SERIES_ARCHIVED
  (thay cho 409 INVALID_TRANSITION cũ — cùng bản chất, không gãy flow).
- Invite accept có guard riêng (`SERIES_NOT_ACCEPTING_MEMBERS`).

## Frontend Changes

### A. `frontend/src/features/series/detail/components/series-overview.tsx` (dòng 132)

```ts
const canArchive =
  !!user &&
  ["PLANNING", "PRE_PRODUCTION", "ONGOING", "PUBLISHED", "PUBLIC"].includes(series.status) &&
  (isPublic ? isAssignedTantou : isOwner || isAssignedTantou);
```

`isPublic` (dòng 128) đã khớp `PUBLIC_SERIES_STATUSES` backend → điều kiện trùng khớp backend:
public → chỉ Tantou; private → owner hoặc Tantou; COMPLETED/HIATUS/DRAFT không hiện nút.

### B. `frontend/src/features/series/detail/model/studio-permissions.ts`

Đầu `getStudioPermissions`: `const archived = series.status === "ARCHIVED";`
Sau khi build set theo role: nếu `archived` → trả set với `canEnterStudio: false`
(giữ `mode`/`title` — không gãy component nào).

Hệ quả (xác minh trong code): `series-detail-page.tsx:103` gộp
`studioPermissions.canEnterStudio && !isLocked` → nút "Open Studio" (dòng 181-193) tự disabled
khi `canEnterStudio=false`, và studio tab fallback overview (dòng 106 `effectiveTab`).
Không cần sửa `series-detail-page.tsx`.

## Testing

- `backend/src/__tests__/admin-scope.test.ts`: thêm 2 case —
  1. `PATCH /series/:id` sau archive → 409 SERIES_ARCHIVED
  2. chapter action trên series archived → 409
- Frontend: Playwright smoke script (pattern các phiên trước) — mangaka mở series archived:
  không thấy Archive/Unpublish, Open Studio ẩn, `/studio` fallback overview; xóa script sau khi xong.

## Out of Scope (TODO — post-MVP)

1. Unarchive/restore (không có endpoint; admin sửa DB nếu cần).
2. `reason` + `archivedById` khi archive (parity với Proposal archive; audit đã có actor).
3. `assertPublishableSeries` chặn ARCHIVED (edge case: publish chapter đã schedule sau archive).
4. Copy dialog Delete ("can be restored by an administrator" — không có admin restore endpoint).
