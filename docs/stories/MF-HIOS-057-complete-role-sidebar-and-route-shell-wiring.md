# MF-HIOS-057: Complete Role Sidebar and Route Shell Wiring

## Problem
Sau MF-HIOS-090, chỉ ADMIN có sidebar + route đầy đủ. Các role còn lại (MANGAKA, EDITOR, BOARD, ASSISTANT) rơi vào `DEFAULT_SECTIONS` trống hoặc không có route tương ứng, gây trắng trang/404 khi click sidebar.

## Goal
Hoàn thiện route shell và sidebar config cho tất cả role, đảm bảo:
- Không có role nào rơi vào `DEFAULT_SECTIONS` rỗng.
- Mọi sidebar item đều có route tồn tại.
- Route chưa implement hiển thị `ComingSoonPage`, không crash.
- `ProtectedRoute` vẫn check role.
- Sidebar chỉ là navigation, không cấp quyền nghiệp vụ.
- Backend vẫn là source of truth cho permission.

## Approach

### 1. Route Registry
Tạo `client/src/routes/app-routes.registry.ts` chứa `APP_ROUTES` — single source of truth cho tất cả path theo role.

### 2. Placeholder Page
Tạo `client/src/shared/components/feedback/ComingSoonPage.tsx` — UI thống nhất cho route đã reserve nhưng chưa wire API.

### 3. Lazy Placeholder Routes
Cập nhật `client/src/routes/lazy-routes.tsx` (đổi `.ts` → `.tsx`) để thêm các `Lazy*ComingSoon` exports cho từng module placeholder.

### 4. Role Placeholder Config
Tạo `client/src/routes/role-placeholder-routes.ts` — danh sách placeholder config theo role, dùng `APP_ROUTES` để đảm bảo không hardcode path.

### 5. Sidebar Config
Cập nhật `client/src/shared/components/layout/role-sidebar.config.ts`:
- Thêm `MANGAKA_SECTIONS`, `EDITOR_SECTIONS`, `BOARD_SECTIONS`, `ASSISTANT_SECTIONS`.
- Thay path cũ bằng `APP_ROUTES.<role>.<key>`.
- Admin giữ nguyên badge động từ `adminBadgeLookup`.
- Các role khác không có badge động (hardcode "0").

### 6. Route Shell
Cập nhật `client/src/routes/AppRoutes.tsx`:
- Thêm route shell cho từng role qua `ProtectedRoute roles={[...]}`.
- Route chưa có page thật → trỏ đến lazy placeholder.
- Giữ lại route cũ đã tồn tại (`tasks`, `series/:id`, `chapters/:id`, `workspace/:taskId`, `review`, `board`, `notifications`).

## Acceptance Criteria

- [x] ADMIN / MANGAKA / ASSISTANT / EDITOR / BOARD đều có sidebar riêng.
- [x] Không role nào rơi vào `DEFAULT_SECTIONS` rỗng.
- [x] Mọi sidebar item đều có route tồn tại.
- [x] Route chưa implement hiển thị `ComingSoonPage`, không crash.
- [x] `ProtectedRoute` vẫn check role.
- [x] Sidebar không cấp quyền nghiệp vụ, chỉ là navigation.
- [x] Backend vẫn là source of truth cho permission.
- [x] `npm run build` pass.

## Files Modified

- `client/src/routes/app-routes.registry.ts` (new)
- `client/src/routes/lazy-routes.tsx` (renamed + expanded)
- `client/src/routes/role-placeholder-routes.ts` (new)
- `client/src/shared/components/feedback/ComingSoonPage.tsx` (new)
- `client/src/shared/components/layout/role-sidebar.config.ts` (modified)
- `client/src/routes/AppRoutes.tsx` (modified)

## Verification

```bash
npm run lint --prefix client  # PASS
npm run build --prefix client # PASS
powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-090.ps1  # PASS
```
