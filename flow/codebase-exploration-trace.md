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

---

## Phiên (2026-06-20) — Smoke test API thay thế mock cho mobile

Môi trường: MongoDB (mongod) đang chạy ở 27017, server MangaFlow đang chạy ở 3001, `server/.env` tồn tại. Login dùng so khớp mật khẩu thật (demo account: editor/board@mangaflow.local).

Kết quả smoke test các read-endpoint mobile gọi (qua `mobileWorkflowDataSource` -> `apiMobileWorkflowDataSource`):

| Endpoint | Role | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| POST /auth/login | editor | 200 OK | accessToken trả về |
| POST /auth/login | board | 200 OK | accessToken trả về |
| GET /dashboard/editor/summary | editor | 200 | object (reviewQueue, recentActivity...) |
| GET /editor/manuscripts/review-queue | editor | 200 | 3 item, shape {series, manuscript} khớp mapper |
| GET /submissions/review-queue | editor | 200 | 0 item (DB state hiện tại) |
| GET /dashboard/board/summary | board | 200 | object (boardQueue.pendingVotes=2) |
| GET /board/queue | board | 200 | 2 item, có seriesStatus/decisionStatus/voteSummary khớp mapper |
| GET /rankings | board | 200 | 1 item, có readerScore/finalScore/voteCount khớp mapper |

Xác nhận mapper khớp dữ liệu thật:
- Editor manuscripts: `series.status`, `series.genres`, `manuscript.version` -> map đúng.
- Board queue: `seriesTitle`, `decisionStatus`, `voteSummary.{APPROVE,REJECT,NEEDS_REVISION}`, `voteCount`, `seriesStatus` -> map đúng; lọc `seriesStatus === "BOARD_REVIEW"` cho reviews và `=== "AT_RISK"` cho at-risk.
- Rankings: `seriesId.title`, `period`, `readerScore`, `finalScore`, `voteCount`, `status` -> map đúng.

Hooks dùng API live mặc định:
- `use-editor-mobile-flow.ts` và `use-board-mobile-flow.ts` đều default `dataSource = mobileWorkflowDataSource` (live + fallback mock), KHÔNG dùng mock thuần.

Phần còn giữ mock (đúng thiết kế, KHÔNG có endpoint read tương ứng để thay):
- `getEditorReadiness`: trả `editorReadinessResult` mock — chưa wire vì cần chapterId đã chọn từ live; backend có `GET /chapters/:id/readiness` nhưng mobile chưa expose chapterId.
- `getEditorComments`: comments rỗng/mock cho tới khi có taskId chọn từ live submission.
- `getBoardDecisionHistory`: tổng hợp từ reviews + rankings live + shape mock-safe.
- `priorityChapter`, `activity` của editor/board home: một phần fallback mock khi summary live thiếu field.

Quan sát nhỏ (không phải lỗi): `dashboard/editor/summary.reviewQueue.manuscripts` trả 0 trong khi `editor/manuscripts/review-queue` trả 3 -> thẻ "Review manuscripts" trên Home hiển thị 0, nhưng danh sách Review vẫn có 3 item thật. Đếm ở summary và queue do hai nguồn khác nhau ở backend.

Mutation (vote, approve, request-revision, finalize, tie-break, at-risk) vẫn là confirmation-only UI, chưa wire — đúng high-risk lane.

Kết luận: toàn bộ read-API mà mobile cần đã hoạt động (200) và đã thay thế mock thông qua lớp `apiMobileWorkflowDataSource` + fallback. Mobile đang call API thật khi server chạy, tự fallback mock khi lỗi mạng.

---

## Phiên (2026-06-20) — Sửa lệch số liệu Home (Editor + Board)

Vấn đề: `dashboard/*/summary` trả count khác với danh sách review-queue/board-queue thật (vd editor summary.manuscripts=0 nhưng review-queue có 3 item) -> thẻ Home hiển thị sai.

Sửa trong `mobile/src/services/mobile-workflow-data-source.ts`:
- `getEditorHome`: fetch song song summary + manuscripts + submissions + readiness; lấy `manuscriptsCount = manuscriptItems.length || summary... || 0` và `finalCount = submissionItems.length || ...`. `priorityChapter` tái dùng `manuscriptItems[0]` (bỏ 1 lần refetch).
- `getBoardHome`: fetch song song summary + seriesReviews + atRiskCases; `pendingVotes = seriesReviews.length || summary... || 0`, `atRiskReviews = atRiskCases.length || ...`.

Nguyên tắc: ưu tiên độ dài list live (thứ user mở được), fallback summary, cuối cùng 0. Giảm bớt số lần gọi API thừa.

Verify:
- `npm run lint --prefix mobile` (tsc clean), `npm test --prefix mobile` (22/22 pass).
- Smoke logic với server live:
  - Editor manuscripts: summary=0 / list=3 -> Home hiển thị 3 (khớp).
  - Editor submissions: summary=0 / list=0 -> Home hiển thị 0.
  - Board pendingVotes: summary=2 / BOARD_REVIEW list=2 -> Home hiển thị 2.
  - Board atRisk: summary=0 / AT_RISK list=0 -> Home hiển thị 0.

Mutation vẫn chưa wire (high-risk lane) — chờ xác nhận phạm vi trước khi làm.

---

## Phiên (2026-06-20) — Chọn story kế tiếp bằng Harness/trace và hoàn thiện Editor mutation slice

Kiểm trước khi code:
- Harness CLI `query matrix` và `query backlog --open` đều báo `database not found at harness.db` -> Harness durable matrix/backlog chưa active trong workspace này.
- Không thấy `docs/stories`/backlog mobile riêng; nguồn chọn story thực tế là `mobile/MOBILE_AGENT_CONTEXT.md`, `flow/codebase-exploration-trace.md`, `flow/mobile-api-progress.md`, và `docs/Flow-*`.
- `Next Story Picker` trong mobile context: read-only API replacement đã xong; mutation/auth/signed URL/readiness publish/payroll là high-risk lane.
- Worktree đã có nhánh code dở cho Editor mutations, nên story kế tiếp nhỏ nhất và đúng spec là hoàn thiện lát cắt Editor-only mutation UI/API. Không mở Board mutation, readiness publish, payroll, Assistant, hay role mới.

Scope đã hoàn thiện:
- `mobile/src/services/mobile-workflow-data-source.ts`: thêm mutation methods Editor proposal/final approval gọi live API, không fallback mock âm thầm cho mutation.
  - `POST /api/editor/series/:seriesId/request-revision`
  - `POST /api/editor/series/:seriesId/reject`
  - `POST /api/editor/series/:seriesId/forward-to-board`
  - `POST /api/submissions/:submissionId/request-revision`
  - `POST /api/submissions/:submissionId/editor-approve`
- `mobile/src/hooks/use-editor-mobile-flow.ts`: thêm note state, busy/error state, reload sau mutation; validate note bắt buộc cho revision/reject; `add-comment` vẫn local vì mobile chưa có full page/task context.
- `mobile/src/components/mf.tsx`: `MFButton` hỗ trợ disabled; `MFConfirmationPanel` hỗ trợ note input, error, busy, confirmDisabled.
- `mobile/src/screens/editor-action-panels.tsx` + `editor-screens.tsx`: panel Editor hiển thị live endpoint, note input, loading/error; copy nhấn mạnh backend vẫn sở hữu validation/permission/notification/audit.
- `mobile/src/__tests__/mobile-data.test.mjs`: cập nhật guard cho note input/live Editor endpoints, giữ Board endpoints ở future/mock state.

Ranh giới giữ nguyên:
- Board vote/finalize/tie-break/at-risk vẫn là confirmation-only UI, story riêng.
- Readiness/comment/payroll/signed URL chưa wire mutation.
- Mobile không tự tính permission/workflow/readiness/ranking/payroll.

Verify:
- `npm --prefix mobile run lint` -> pass.
- `npm --prefix mobile run test` -> 22/22 pass.
- `npm --prefix mobile run build` -> Expo web export pass.

---

## Phiên (2026-06-20) — Audit API thật cho Editor mobile review/comments/readiness

Yêu cầu kiểm:
- Trang review về manuscripts.
- Trang comments.
- Trang readiness/readlines (đối chiếu code hiện tại là `Readiness`).
- Liệt kê phần còn mock/fallback.

Kết luận nhanh:
- Manuscripts/review đã gọi API thật cho queue và các action an toàn.
- Comments đã gọi API thật cho task comments + resolve/reopen, nhưng context hiện lấy theo task đầu tiên từ final submission queue; vẫn fallback mock nếu thiếu `taskId` hoặc API lỗi.
- Readiness đã gọi API thật theo `chapterId`, nhưng vẫn fallback mock nếu thiếu `chapterId` hoặc API lỗi; một số nút trên UI vẫn là placeholder.

API thật đang được gọi:
- `GET /api/editor/manuscripts/review-queue` qua `getEditorManuscripts()`.
- `POST /api/editor/series/:seriesId/start-review`.
- `POST /api/editor/series/:seriesId/request-revision`.
- `POST /api/editor/series/:seriesId/reject`.
- `POST /api/editor/series/:seriesId/forward-to-board`.
- `GET /api/submissions/review-queue` qua `getEditorSubmissions()`.
- `GET /api/tasks/:taskId` để enrich final approval detail.
- `GET /api/chapters/:chapterId` để enrich final approval detail.
- `GET /api/chapters/:chapterId/pages` để lấy page metadata read-only.
- `GET /api/comments/task/:taskId` qua `getEditorComments()`.
- `POST /api/comments` trong action add-comment của final approval.
- `POST /api/comments/:commentId/resolve`.
- `POST /api/comments/:commentId/reopen`.
- `GET /api/chapters/:chapterId/readiness` qua `getEditorReadiness()`.

Phần vẫn còn mock/fallback có chủ đích:
- `mobileWorkflowDataSource` vẫn là live API data source có mock fallback cho read methods. Mutation không fallback âm thầm; mutation gọi live API trực tiếp và surface lỗi backend.
- Manuscripts/review:
  - Nếu `/editor/manuscripts/review-queue` lỗi thì fallback về `manuscripts` mock.
  - Visual cover vẫn dùng `coverTone`/local UI asset, chưa có signed file URL.
  - Một số field display có default text như subtitle, editor recommendation, version khi backend thiếu dữ liệu.
  - `forward-to-board` hiện gửi `suggestedPublicationType: "MONTHLY"` cố định từ hook vì mobile chưa có control chọn publication type trong panel.
  - Không auto-call `GET /api/editor/series/:seriesId/review` vì route/service backend có thể start review theo side effect; mobile dùng explicit `POST /start-review` để người dùng chủ động.
- Comments:
  - Nếu live submission queue không có `taskId`, hoặc comments API lỗi, màn Comments fallback về `commentMetrics`, `productionComments`, `commentActivity`.
  - Comments tab hiện chọn context bằng task đầu tiên có `taskId` trong final submission queue, chưa có task/comment scope selector riêng.
  - Thumbnail/cover/page visual vẫn là local display (`coverTone`, page text), chưa tải signed file assets.
  - Nút `Open blockers` trong comments callout vẫn là UI placeholder, chưa route/filter riêng.
- Readiness:
  - Nếu live submission queue không có `chapterId`, hoặc readiness API lỗi, màn Readiness fallback về `editorReadinessResult`.
  - Readiness screen chỉ đọc backend result, chưa wire mutation publish/mark-ready/schedule.
  - Nút `Open blockers` và `Schedule publication mock` trên Readiness vẫn là placeholder UI.
  - Readiness logic vẫn do backend `PublicationReadinessService` sở hữu; mobile không tự tính lại checklist.
- Editor Home:
  - Home đã gọi `/dashboard/editor/summary`, manuscripts, submissions, readiness.
  - Card `Resolve comments` vẫn lấy số từ `commentMetrics[0]?.value` thay vì live comments count vì comments cần task context trước.

Ranh giới còn giữ:
- Không wire signed URL/file access.
- Không wire publish/mark-ready/schedule publication.
- Không tự tính readiness/ranking/workflow transition trên mobile.
- Không gọi Admin/Assistant/Payroll lanes từ mobile Editor scope.

---

## Phiên (2026-06-20) — MF-HIOS-108 Mangaka -> Editor -> Board mobile proposal summary flow

Branch:
- `codex/mf-hios-108-mobile-proposal-summary-flow`

Scope khóa trước khi code:
- Mangaka vẫn tạo/upload/submit series bằng web hiện có.
- Mobile không thêm Mangaka role.
- Mobile chỉ cho Editor/Board xem proposal summary, duyệt, vote, finalize bằng API thật.
- Không mở signed file download/preview trên mobile; chỉ hiển thị manuscript metadata.

Backend thay đổi:
- `GET /api/board/queue` bổ sung read-only decision readiness fields:
  - `eligibleBoardCount`
  - `quorum`
  - `canFinalize`
- Backend vẫn là nguồn quyết định thật; `canFinalize` chỉ để UI phản ánh trạng thái, `POST /decisions/finalize` vẫn tự kiểm eligible/quorum/plurality.

Mobile data/API wiring:
- `mobile/src/domain/workflow.ts`: thêm `SeriesProposalSummary`; `EditorManuscriptReviewItem` có `requestedPublicationType`; `BoardVoteSummary` có optional `quorum/canFinalize`.
- `mobile/src/services/mobile-workflow-data-source.ts`:
  - thêm `getSeriesProposalSummary(seriesId, role)`.
  - gọi live `GET /api/series/:seriesId/summary` bằng token Editor hoặc Board.
  - map pitch fields, requested publication type, current manuscript metadata, board review summary.
  - fallback read-only summary từ queue card nếu live summary lỗi.
  - Board queue mapper dùng `eligibleBoardCount/quorum/canFinalize`.
- Mutation vẫn gọi live API trực tiếp, không fallback mock âm thầm.

Mobile UI/hook:
- `useEditorMobileFlow`: selected manuscript tự fetch proposal summary; forward-to-board lấy default cadence từ summary/requestedPublicationType.
- `useBoardMobileFlow`: selected Board review tự fetch proposal summary.
- `SeriesProposalSummaryPanel`: dùng chung cho Editor/Board, hiển thị pitch + manuscript metadata + Board decision summary; không request signed URL.
- `EditorProposalDecisionPanel`: thêm selector `WEEKLY/MONTHLY`, gửi `suggestedPublicationType` từ UI thay vì hardcode `"MONTHLY"`.
- `BoardVotePanel`: hiển thị quorum từ backend và disable finalize khi `canFinalize === false`.

Verify:
- `npm --prefix mobile run test` -> pass 23/23.
- `npm --prefix server run test -- src/modules/board/board.service.test.ts src/modules/manuscript/manuscript.service.test.ts src/modules/series/series.service.test.ts` -> pass 27/27.
- `npm --prefix mobile run lint` -> pass.
- `npm --prefix mobile run build` -> pass.
- `npm --prefix server run test` -> fail ngoài scope ở `src/shared/policies/accessPolicy.service.test.ts` và `src/modules/submission/submission.service.test.ts`; Board service test của slice này pass trong full run.

---

## Phiên (2026-06-21) — MF-HIOS-109 mobile placeholder polish

Branch:
- `codex/mf-hios-109-mobile-placeholder-polish`

Scope:
- Dọn các placeholder an toàn trên mobile Editor.
- Không thêm API mutation mới, không mở publication scheduling hoặc signed file access.

Scope đã hoàn thiện:
- `mobile/src/screens/editor-screens.tsx`:
  - Comments `Open blockers` chuyển thành toggle filter thật cho blocking comments.
  - Readiness `Open blockers` chuyển thành toggle filter thật cho failed readiness checks.
  - `Schedule publication mock` được thay bằng boundary card giải thích schedule/publish nằm ngoài slice mobile Editor hiện tại.
  - Loading label `Loading mock Editor home...` đổi thành `Loading Editor home...`.
- `mobile/src/MangaFlowMobileApp.tsx`:
  - Cập nhật copy từ mock-only sang live API + local reference fallback.
  - Board handoff copy phản ánh votes/finalize/tie-break/at-risk đã gọi live endpoints.
  - Profile timeline ghi rõ các story còn lại: publication scheduling, signed file previews, Board decision history.
- `mobile/src/components/mf.tsx`:
  - Error title đổi từ `Could not load this mock flow` sang `Could not load this mobile flow`.
- `mobile/src/__tests__/mobile-data.test.mjs`:
  - Guard blocker filter state, publication scheduling boundary, và copy live/fallback mới.

Verify:
- `npm --prefix mobile run test` -> pass 23/23.
- `npm --prefix mobile run lint` -> pass.
- `npm --prefix mobile run build` -> pass.

Ranh giới giữ nguyên:
- Publication scheduling/publish chưa wire.
- Signed file preview/download chưa wire.
- Board decision history vẫn là follow-up.

---

## Phiên (2026-06-20) — MF-HIOS-107 mobile safe Editor API actions

Branch:
- Tạo nhánh mới theo format hiện có: `codex/mf-hios-107-mobile-safe-editor-api-actions`.

Kiểm trước khi code:
- Worktree sạch trên `dev`.
- Chỉ nối nhóm API an toàn còn lại trong mobile Editor scope:
  - `POST /api/editor/series/:seriesId/start-review`
  - `POST /api/comments`
  - `POST /api/comments/:commentId/reopen`
  - `GET /api/chapters/:chapterId/pages`
- Không gọi `GET /api/editor/series/:seriesId/review` ngầm vì service có side-effect start review khi manuscript đang `SUBMITTED`; thay bằng action explicit `Start review`.
- Không mở signed URL/file download, payroll, Assistant/Admin, hoặc publication publish lane.

Scope đã hoàn thiện:
- `mobile/src/domain/workflow.ts`: thêm `start-review` vào `EditorProposalAction`; submission item giữ optional `seriesId/pageId/pageCount`.
- `mobile/src/services/mobile-workflow-data-source.ts`: thêm `startEditorProposalReview`, `createEditorComment`, `reopenEditorComment`; enrich submission detail bằng page metadata `GET /chapters/:chapterId/pages`.
- `mobile/src/hooks/use-editor-mobile-flow.ts`: `start-review` gọi live API; `add-comment` gọi live comment API khi có `seriesId/taskId`; thêm `reopenSelectedComment`.
- `mobile/src/screens/editor-action-panels.tsx`: proposal panel có nút `Start review`; add-comment chuyển sang live endpoint + note input bắt buộc.
- `mobile/src/screens/editor-panels.tsx` + `editor-screens.tsx`: comment detail hỗ trợ `Reopen comment`; final approval detail hiển thị `Page metadata`.
- `mobile/src/__tests__/mobile-data.test.mjs`: guard start-review, add-comment, reopen, pages metadata, và copy boundary.

Verify:
- `npm --prefix mobile run lint` -> pass.
- `npm --prefix mobile run test` -> 22/22 pass.
- `npm --prefix mobile run build` -> Expo web export pass.

---

## Phiên (2026-06-20) — Mobile remaining Editor API wiring branch

Branch:
- Tạo nhánh mới theo format hiện có: `codex/mf-hios-105-mobile-remaining-api-wiring`.

Kiểm trước khi code:
- API còn lại trong mobile scope là Editor comments/readiness read + resolve comment mutation.
- Không mở signed URL, payroll, Assistant/Admin, hoặc publish/mark-ready vì mobile context vẫn giữ các lane đó ngoài scope.
- Backend contracts:
  - `GET /api/comments/task/:taskId`
  - `POST /api/comments/:commentId/resolve`
  - `GET /api/chapters/:chapterId/readiness`

Scope đã hoàn thiện:
- `mobile/src/domain/workflow.ts`: `EditorSubmissionReviewItem` giữ optional `taskId/chapterId`; readiness result giữ optional `chapterId/chapterStatus`.
- `mobile/src/services/mobile-workflow-data-source.ts`: submission mapper lấy `taskId/chapterId`; comments dùng live task comments API; readiness dùng live chapter readiness API; resolve comment dùng live mutation endpoint. Nếu live queue thiếu id hoặc API lỗi thì fallback mock theo boundary cũ.
- `mobile/src/hooks/use-editor-mobile-flow.ts`: thêm `resolveSelectedComment`, reload sau mutation và surface lỗi backend.
- `mobile/src/screens/editor-panels.tsx` + `editor-screens.tsx`: Comment detail có nút `Resolve comment`, disabled khi busy và không hiện cho comment đã `RESOLVED_BY_EDITOR`.
- `mobile/src/__tests__/mobile-data.test.mjs`: guard endpoint comments/readiness, resolve mutation, optional ids, và UI resolve action.

Verify trước merge:
- `npm --prefix mobile run lint` -> pass.
- `npm --prefix mobile run test` -> 22/22 pass.
- `npm --prefix mobile run build` -> Expo web export pass.

---

## Phiên (2026-06-20) — MF-HIOS-106 mobile auth/session + Editor detail APIs

Branch:
- Tạo nhánh mới theo format hiện có: `codex/mf-hios-106-mobile-auth-editor-detail-apis`.

Kiểm trước khi code:
- Worktree sạch trên `dev`.
- `auth/logout` đã tồn tại trong mobile nhưng chưa gửi `refreshToken` body nên backend logout route không revoke đúng refresh token.
- API tiếp theo hợp scope mobile:
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
  - `GET /api/tasks/:taskId`
  - `GET /api/chapters/:chapterId`
- Không mở signed URL, payroll, Assistant/Admin, hoặc publication mark-ready/publish lane.

Scope đã hoàn thiện:
- `mobile/src/services/mobile-auth.ts`: sau login gọi `GET /api/auth/me` để verify/hydrate user; logout gửi `{ refreshToken }` body và vẫn clear mobile workflow token cache trong `finally`.
- `mobile/src/domain/workflow.ts`: `EditorSubmissionReviewItem` thêm optional `chapterStatus`, `taskPriority`, `taskDueDate`.
- `mobile/src/services/mobile-workflow-data-source.ts`: submission queue mapper enrich từng item bằng `GET /api/tasks/:taskId` và `GET /api/chapters/:chapterId`; detail API fail thì fallback item gốc, không làm rơi cả queue.
- `mobile/src/screens/editor-screens.tsx`: final approval detail hiển thị `Task detail` và `Chapter detail` từ live detail APIs.
- `mobile/src/__tests__/mobile-data.test.mjs`: guard `auth/me`, refresh-token logout body, task/chapter detail endpoints, và UI rows.

Verify:
- `npm --prefix mobile run lint` -> pass.
- `npm --prefix mobile run test` -> 22/22 pass.
- `npm --prefix mobile run build` -> Expo web export pass.

---

## Phiên (2026-06-20) — Board finalize decision slice cho mobile

Kiểm trước khi code:
- Backend contract: `POST /api/board/series/:seriesId/decisions/finalize` nhận `{ decision?, publicationType?, note? }`.
- `board.service.ts` tự kiểm Board member eligibility, quorum, plurality; nếu hòa thì set `TIE_BREAK_REQUIRED`; nếu approve thì cần `publicationType`.
- Mobile không tự đoán kết quả vote/quorum, chỉ gửi finalize request với `publicationType` của selected review và note optional.

Scope đã hoàn thiện:
- `mobile/src/services/mobile-workflow-data-source.ts`: thêm `finalizeBoardDecision`, gọi live endpoint trực tiếp không fallback mock âm thầm.
- `mobile/src/hooks/use-board-mobile-flow.ts`: thêm `pendingFinalize`, `finalizeNote`, start/confirm/cancel finalize, reload sau mutation và surface lỗi backend.
- `mobile/src/screens/board-action-panels.tsx`: thêm `BoardFinalizeConfirmationPanel`, live endpoint copy, note input; `BoardVotePanel` có nút `Finalize Board decision`.
- `mobile/src/screens/board-screens.tsx`: nối finalize confirmation vào Board reviews.
- `mobile/src/__tests__/mobile-data.test.mjs`: guard finalize method, endpoint, hook, và component export.

Ranh giới giữ nguyên:
- Backend vẫn sở hữu quorum, tie-break required state, final status transition, notifications, audit.
- Mobile không thêm Admin override hoặc role mới.

Verify:
- `npm --prefix mobile run lint` -> pass.
- `npm --prefix mobile run test` -> 22/22 pass.
- `npm --prefix mobile run build` -> Expo web export pass.

---

## Phiên (2026-06-20) — Board mutation slice cho mobile

Kiểm trước khi code:
- Dựa trên `server/src/modules/board/board.validation.ts`, `board.routes.ts`, `board.service.ts`, và `server/src/shared/workflow/status.ts`.
- Board API live hiện có:
  - `POST /api/board/series/:seriesId/votes` với `{ value, note }`.
  - `POST /api/board/series/:seriesId/decisions/tie-break` với `{ value, publicationType?, note }`; backend yêu cầu `publicationType` khi `value=APPROVE` và chỉ Board Chair được tie-break.
  - `POST /api/board/series/:seriesId/at-risk-decisions` với `{ decision, note }`.
- Không wire finalize/quorum UX trong slice này vì mobile hiện chưa có màn finalize riêng; backend vẫn sở hữu quorum, final decision, status transition, notification, audit.

Scope đã hoàn thiện:
- `mobile/src/services/mobile-workflow-data-source.ts`: thêm Board mutation methods, gọi live endpoint trực tiếp và không fallback mock âm thầm cho mutation.
  - `castBoardVote`
  - `tieBreakBoardDecision`
  - `createBoardAtRiskDecision`
- `mobile/src/hooks/use-board-mobile-flow.ts`: thêm note state, busy/error state, reload sau mutation; vote thường gọi `/votes`, tie-break gọi `/decisions/tie-break`, at-risk gọi `/at-risk-decisions`.
- `mobile/src/screens/board-action-panels.tsx` + `board-screens.tsx`: panel Board hiển thị live endpoint, note input, loading/error; tie-break dùng action riêng và có đủ APPROVE / NEEDS_REVISION / REJECT.
- `mobile/src/__tests__/mobile-data.test.mjs`: cập nhật guard để bắt Board live mutation endpoints, hook state, và audit-boundary copy.

Ranh giới giữ nguyên:
- Mobile không tự finalize Board decision/quorum và không tự tính ranking/readiness.
- At-risk decision vẫn cần backend xác nhận Series đang `AT_RISK`.
- Tie-break vẫn do backend chặn nếu user không phải Board Chair hoặc decision chưa `TIE_BREAK_REQUIRED`.

Verify:
- `npm --prefix mobile run lint` -> pass.
- `npm --prefix mobile run test` -> 22/22 pass.
- `npm --prefix mobile run build` -> Expo web export pass.
