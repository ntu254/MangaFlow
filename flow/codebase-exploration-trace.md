# Codebase Exploration Trace — Mobile (React Native) Readiness

## Phiên làm việc

- Ngày: 2026-06-20
- Mục tiêu: Đọc harness + docs, hiểu codebase hiện tại, khám phá toàn bộ skills (Vercel/Build Web App plugin) để biết công cụ nào hỗ trợ code mobile React Native, và ghi trace lại.

## 1. Tài liệu harness đã đọc

- `repository-harness/AGENTS.md`: shim trỏ tới README + docs/HARNESS, FEATURE_INTAKE, ARCHITECTURE, CONTEXT_RULES và Rust CLI `scripts/bin/harness-cli.exe`.
- `repository-harness/README.md`: mô tả mô hình "harness" (agent-ready repo). Còn ở Harness v0.
- `repository-harness/docs/HARNESS.md`, `FEATURE_INTAKE.md`, `ARCHITECTURE.md`, `CONTEXT_RULES.md`: hiện là FILE RỖNG (stub) — chưa có nội dung.
- `harness-cli.exe query matrix`: lỗi `database not found at harness.db. Run: harness init` — harness chưa init trong repo này.

Kết luận: lớp harness mới ở dạng khung, chưa active. Nguồn ngữ cảnh thực tế nằm ở `docs/Flow-*.md` và `mobile/MOBILE_AGENT_CONTEXT.md`.

## 2. docs/ — Business flow specs (tiếng Việt)

13 file `Flow-00..Flow-12`. Flow-00 = nền tảng auth/user/role/permission của MangaFlow.

- Roles: ADMIN, MANGAKA, ASSISTANT, EDITOR, BOARD.
- User status: PENDING_INVITE, ACTIVE, INACTIVE, SUSPENDED.
- Permission 3 lớp: role-level, entity-level, action/screen-level.
- UI screen layer: Production Hub (Series), Page Studio (Page), Task Studio (Task) — KHÔNG phải DB entity.
- API auth: `/api/auth/login|logout|me|permissions`, admin user mgmt.
- Lưu ý: docs/product, docs/contracts, docs/stories được tham chiếu trong MOBILE_AGENT_CONTEXT NHƯNG các thư mục con đó hiện KHÔNG tồn tại / rỗng trong repo.

## 3. Cấu trúc monorepo

```
server/    Express + Mongoose + Socket.io + AWS SDK + swagger (backend, sở hữu permission/workflow)
client/    Vite + React 19 + TanStack + Tailwind + Radix + Konva (web app)
mobile/    Expo ~56 + React Native 0.85 + expo-router (app mobile)
ai-service/ Python venv (AI segmentation/region)
repository-harness/ Rust harness CLI + docs stub
.agents/skills/ 13 design/image skills
```

Root scripts: `npm run dev` chạy song song server/client/mobile/ai bằng concurrently. `npm run lint` mobile dùng `tsc --noEmit` (script tên `typecheck` ở root nhưng mobile chỉ có `lint`/`test`/`build`).

## 4. Mobile app (trọng tâm React Native)

Stack: Expo SDK 56, RN 0.85.3, React 19.2, expo-router (typed routes + react compiler), TS 6, lucide-react-native, reanimated 4, gesture-handler, safe-area-context, expo-image.

Scope (theo MOBILE_AGENT_CONTEXT.md): CHỈ 2 role mobile được duyệt — Tantou Editor và Board/Board Chair. Không thêm Admin/Mangaka/Assistant nếu không có story mới.

Kiến trúc mobile:
```
src/domain/    workflow.ts — types DTO khớp contract + status/action enums
src/data/      editor.ts, board.ts — mock data theo role
src/services/  mobile-workflow-data-source.ts (interface + mock + apiMobile* live),
               mobile-auth.ts (login/logout), mobile-api-config.ts (base URL platform-aware)
src/hooks/     use-editor-mobile-flow.ts, use-board-mobile-flow.ts
src/screens/   editor-screens, board-screens, *-panels, *-action-panels
src/components/ mf.tsx (UI primitives), themed-*, app-tabs, header-background
src/design/    tokens.ts (colors/spacing/radius/shadow/typography), icons.tsx
src/app/       expo-router entry (_layout.tsx, index.tsx)
```

Mock/API boundary: `mockMobileWorkflowDataSource` là điểm thay bằng API thật. Mobile KHÔNG được tự tính permission, workflow transition, readiness, ranking formula, payroll, signed URL — chỉ hiển thị kết quả backend.

API đã wire (read-only): auth login/logout, dashboard editor/board summary, editor review-queue, submissions review-queue, board queue, rankings. Base URL `EXPO_PUBLIC_API_BASE_URL` fallback `http://localhost:3001/api` (android emulator -> 10.0.2.2).

Mutation endpoints CHƯA wire (confirmation-only UI): forward-to-board, request-revision, reject, editor-approve, board votes/finalize/tie-break/at-risk — thuộc high-risk lane.

Story slices đã làm: MF-HIOS-095 .. 104 (foundation -> confirmation -> queue selection -> empty/error states -> rich previews -> handoff/profile -> panel/action componentization -> visual polish -> edge-case QA).

## 5. Skills (.agents/skills) — "Build Web App / Vercel plugin" tools

13 skills, sync từ github `Leonxlnx/taste-skill` (xem skills-lock.json). Không có plugin tên "Vercel" hay "Build Web App" riêng — đây là bộ taste/design skills. Phân loại:

Sinh ảnh (image-only, KHÔNG viết code):
- imagegen-frontend-mobile — ART DIRECTION cho concept màn hình mobile app (iOS/Android), trong khung phone mockup. ĐÂY là skill liên quan nhất cho thiết kế UI mobile RN.
- imagegen-frontend-web — 1 ảnh/section cho web landing.
- brandkit — brand guideline boards/logo.

Image-to-code / implement:
- image-to-code — sinh ảnh design rồi implement web frontend khớp ảnh.
- redesign-existing-projects — audit + nâng cấp project hiện có theo chuẩn cao cấp, giữ stack.

Design system / taste (chi phối code UI):
- design-taste-frontend (v2, 88KB, default), design-taste-frontend-v1 (React/Next, RSC, Tailwind version-lock guard).
- high-end-visual-design, minimalist-ui, industrial-brutalist-ui, gpt-taste (GSAP), stitch-design-taste (DESIGN.md cho Google Stitch).

Output discipline:
- full-output-enforcement — cấm placeholder/truncation, ép xuất code đầy đủ.

Mức hữu ích cho code mobile RN:
- Trực tiếp: imagegen-frontend-mobile (concept màn hình), full-output-enforcement (xuất code đầy đủ), redesign-existing-projects (audit/nâng cấp screens hiện có).
- Gián tiếp/cẩn trọng: các taste skill phần lớn nhắm web (Tailwind/Next/GSAP/RSC) nên nguyên tắc thẩm mỹ áp dụng được, nhưng cú pháp/stack KHÔNG áp thẳng vào RN/Expo (mobile dùng StyleSheet + tokens.ts, không Tailwind). Cần chuyển ngữ nguyên tắc, không copy code web.

## 6. Quan sát / rủi ro cho công việc tiếp theo

- Harness docs rỗng + CLI chưa init -> không dựa vào harness cho ngữ cảnh; dùng Flow-*.md + MOBILE_AGENT_CONTEXT.
- docs/product, docs/contracts, docs/stories được tham chiếu nhưng chưa có trong repo -> nếu cần story packet phải xác nhận lại.
- Mobile giữ ranh giới mock/API nghiêm ngặt: mọi mutation/permission là backend-owned.
- Mobile styling = design tokens + StyleSheet, KHÔNG Tailwind. Skill design web chỉ dùng làm nguyên tắc.
- Verify mobile: `npm run lint --prefix mobile` (tsc), `npm test --prefix mobile`, `npm run build --prefix mobile`.

## 7. Files đã đọc trong phiên

- repository-harness/{AGENTS.md, README.md, docs stubs}
- docs/Flow-00.md (+ liệt kê Flow-01..12)
- skills-lock.json + 13 SKILL.md (headers/đầu file), imagegen-frontend-mobile sâu hơn
- mobile/{package.json, app.json, README.md, MOBILE_AGENT_CONTEXT.md}
- mobile/src/{domain/workflow.ts, design/tokens.ts, services/mobile-api-config.ts, components/mf.tsx (đầu file)}
- flow/{auth-ui-logout-progress.md, mobile-api-progress.md, mobile-auth-ui-progress.md}
- root package.json

---

## Phiên tiếp theo (2026-06-20) — Dọn Profile / Logout / nhãn role

Yêu cầu user và thay đổi trong `mobile/src/MangaFlowMobileApp.tsx`:

1. Xóa thanh chuyển đổi nhanh role (`roleSwitch` + component `RoleButton` + styles liên quan). Role giờ chỉ xác định khi đăng nhập, không switch tay trong app.
2. Xóa card "Logout Editor/Board session" (`RoleLogoutTestCard` + styles `logoutTest*`).
3. Nhãn role Board: đổi "Board Chair" -> "Board Member" ở header subtitle và badge profile (giữ "Board Chair" ở phần mô tả scope vì đó là sub-role tie-break có thật). Editor giữ "Tantou Editor".
4. Đổi nút "Logout from mobile" -> "Logout".
5. Đẩy nút Logout xuống CUỐI trang profile (sau MFDetailList + MFTimeline) thay vì ngay dưới hero.

Cập nhật test `mobile/src/__tests__/mobile-data.test.mjs`: assert nút `"Logout"` tồn tại và `doesNotMatch` các chuỗi đã xóa (Logout from mobile / Logout Board session / Logout Editor session).

Vẫn giữ: session strip phía trên (email + chip logout nhanh), `setRole` dùng cho điều hướng sau login.

Verify: `npm run lint --prefix mobile` (tsc clean), `npm test --prefix mobile` (22/22 pass).
