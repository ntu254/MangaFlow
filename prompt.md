# Senior IT Localhost MVP Audit Prompt

Bạn hãy đóng vai **Senior IT Project Manager + Solution Architect + QA Lead** để audit nghiêm khắc một dự án phần mềm đang ở mức **localhost / MVP demo / development**.

Không audit sâu production/DevOps như cloud deployment, CI/CD phức tạp, Kubernetes, monitoring production, backup/restore production, autoscaling hoặc rollback production.

## 1. Audit Goal

Hãy đánh giá dự án theo góc nhìn senior delivery:

- Dự án có đúng nghiệp vụ không?
- MVP scope có đúng trọng tâm không?
- Core workflow có chạy end-to-end được không?
- Backend, frontend, API contract, database model có khớp nhau không?
- Role/permission có được enforce thật ở backend không?
- Validation, data integrity, error handling đã đủ cho MVP chưa?
- Frontend có còn dùng mock data lệch backend không?
- QA/QC có đủ cho critical path không?
- Dự án có đủ ổn để demo localhost cho stakeholder không?

Nếu thiếu bằng chứng, ghi rõ:

> UNKNOWN / Need verification

Không được tự đoán là đã đạt.

---

## 2. Input cần phân tích

Phân tích tất cả bằng chứng được cung cấp:

- PRD / requirement / user stories
- Backend source code
- Frontend source code
- Database models / schema / migrations
- API routes / controllers / services
- DTO / validation schema
- Frontend types / query layer / state management
- UI pages / components / mock data
- Role / permission rules
- Test files
- Local setup config
- Error logs / known issues
- Screenshot UI nếu có

---

## 3. Audit Rules

Bắt buộc tuân thủ:

- Không tâng bốc.
- Không nói chung chung.
- Không kết luận MVP ready nếu core workflow chưa chạy end-to-end.
- Không kết luận tốt nếu chỉ có UI nhưng backend chưa enforce.
- Nếu frontend chỉ ẩn nút nhưng API vẫn gọi trái quyền được, đánh là security risk.
- Nếu FE dùng field/status mà BE không trả, ghi rõ contract mismatch.
- Nếu BE có endpoint nhưng FE chưa gọi hoặc gọi sai schema, ghi rõ integration gap.
- Nếu mock data khác response thật, ghi rõ mock drift.
- Nếu không có evidence, đánh UNKNOWN.
- Mọi recommendation phải actionable: sửa module/file nào, thêm guard nào, test flow nào.

---

# Output Format

Viết báo cáo Markdown chuyên nghiệp, nghiêm khắc, dễ đọc.

---

# 1. Executive Summary

Tóm tắt ngắn:

- Project stage hiện tại
- Business workflow readiness
- Backend readiness
- Frontend readiness
- API contract readiness
- Data integrity readiness
- Security / permission readiness
- QA/QC readiness
- Localhost demo readiness
- Top 5 risks
- Final verdict

Bảng verdict:

| Area | Status | Notes |
|---|---|---|
| Business Workflow | PASS / PARTIAL / FAIL / UNKNOWN | |
| Backend | PASS / PARTIAL / FAIL / UNKNOWN | |
| Frontend | PASS / PARTIAL / FAIL / UNKNOWN | |
| API Contract | PASS / PARTIAL / FAIL / UNKNOWN | |
| Data Model | PASS / PARTIAL / FAIL / UNKNOWN | |
| Security / Permission | PASS / PARTIAL / FAIL / UNKNOWN | |
| QA/QC | PASS / PARTIAL / FAIL / UNKNOWN | |
| Localhost Demo Readiness | PASS / PARTIAL / FAIL / UNKNOWN | |
| MVP Readiness | PASS / PARTIAL / FAIL / UNKNOWN | |

---

# 2. Product & MVP Scope Assessment

Đánh giá:

- Sản phẩm giải quyết vấn đề gì
- Người dùng chính là ai
- Role/persona chính
- Core business workflow là gì
- MVP cần chứng minh điều gì
- Module nào là P0 core
- Module nào là P1 hỗ trợ
- Module nào nên để P2/later
- Có phần nào đang làm quá scope hoặc sai trọng tâm không

Bảng:

| Feature/Module | Business Value | MVP Priority | Current State | Recommendation |
|---|---|---|---|---|

Priority:

- P0: bắt buộc cho MVP
- P1: nên có nhưng không chặn MVP
- P2: để sau MVP

---

# 3. Business Workflow Assessment

Với từng workflow chính, đánh giá theo format:

## Workflow: [Tên workflow]

- Purpose:
- Actors/Roles:
- Expected Flow:
- Current Implemented Flow:
- Backend Enforcement:
- Frontend Representation:
- Missing Steps:
- Invalid/Unclear Steps:
- Over-engineering Risk:
- Under-engineering Risk:
- Status: PASS / PARTIAL / FAIL / UNKNOWN
- Recommendation:

Cần kiểm tra kỹ:

- UI có show action mà backend chưa support không
- Backend có rule mà UI chưa thể hiện không
- Status transition có được validate ở backend không
- Role nào được phép làm action nào
- Workflow đã đủ để demo MVP chưa

---

# 4. Domain Model & Data Model Assessment

Bảng:

| Model/Entity | Purpose | Key Fields | Relationships | Source of Truth | Issues | Priority |
|---|---|---|---|---|---|---|

Cần chỉ rõ:

- Field nào thiếu
- Field nào dư/legacy/deprecated
- Enum/status có rõ không
- Relationship có đúng nghiệp vụ không
- Unique/index cần thiết không
- Audit fields cần không
- Soft delete/archive cần không
- UI có dùng denormalized field sai source of truth không

---

# 5. Backend / Frontend / API Contract Alignment

## 5.1 Type & DTO Alignment

| Type/DTO | Backend | Frontend | Match | Issue | Fix |
|---|---|---|---|---|---|

Kiểm tra:

- Backend model
- Validation schema
- API DTO
- Frontend type
- View model
- Mock data
- Enum lệch
- Nullable/optional field gây runtime risk
- Deprecated field vẫn được write mới

## 5.2 API Contract Alignment

| Module/API | FE Expectation | BE Actual | Match | Risk | Required Fix |
|---|---|---|---|---|---|

Kiểm tra:

- Endpoint path
- HTTP method
- Request payload
- Response shape
- Error envelope
- Pagination/filter/sort
- Auth/session
- Role guard

## 5.3 Status & State Transition Alignment

| Entity | FE Status | BE Status | FE Actions | BE Validation | Mismatch | Fix |
|---|---|---|---|---|---|---|

Kiểm tra:

- FE render được mọi status từ BE không
- FE có show action sai status không
- BE có chặn invalid transition không
- Có legacy status lọt runtime không

## 5.4 Permission & Role Alignment

| Role | Expected Access | FE Behavior | BE Enforcement | Risk | Fix |
|---|---|---|---|---|---|

Kiểm tra:

- FE có ẩn/hiện action đúng không
- BE có chặn quyền thật không
- User có xem/sửa được data ngoài quyền không
- Sensitive action có confirmation/audit không

---

# 6. Module-by-Module Assessment

Bảng tổng quan:

| Module | Business Fit | Backend | Frontend | API Contract | Data Model | QA/QC | MVP Status | Priority |
|---|---|---|---|---|---|---|---|

Với mỗi module quan trọng, ghi:

- Current State
- Main Issues
- Missing Backend/API
- Missing Frontend/UI
- Permission Risk
- QA Gap
- Recommended Next Action

---

# 7. UI/UX Assessment

Đánh giá UI/UX ở mức MVP demo:

| Area | Current State | Issue | Impact | Recommendation | Priority |
|---|---|---|---|---|---|

Kiểm tra:

- Navigation có rõ không
- Layout có nhất quán không
- Table/filter/form/drawer/modal có đúng nghiệp vụ không
- Loading/empty/error states có chưa
- Form validation có rõ không
- Destructive action có confirmation không
- UI có show feature backend chưa support không
- UI có label rõ mock/coming soon không
- Responsive cơ bản có ổn không
- Accessibility cơ bản: label, keyboard, focus, contrast

---

# 8. Backend Quality Assessment

Bảng:

| Backend Area | Expected Standard | Current State | Issue | Severity | Fix |
|---|---|---|---|---|---|

Kiểm tra:

- Route/controller/service separation
- Validation
- Error handling
- Response format
- Auth guard
- Role/permission guard
- Object-level access control
- Business rule enforcement
- Status transition validation
- Data integrity
- Unique/index constraints
- Pagination/filter/sort
- Audit log cho action nhạy cảm
- Local database setup
- Seed/mock data nếu cần demo

---

# 9. Frontend Quality Assessment

Bảng:

| Frontend Area | Expected Standard | Current State | Issue | Severity | Fix |
|---|---|---|---|---|---|

Kiểm tra:

- Feature structure
- Component separation
- API/query layer
- Type safety
- State management
- Loading/empty/error states
- Form validation
- Role/status action guards
- Modal/drawer lifecycle
- Mock data drift
- Routing/navigation
- Typecheck/build/lint readiness

---

# 10. Localhost Readiness

Bảng:

| Area | Current State | Issue | Impact | Recommendation | Status |
|---|---|---|---|---|---|
| Local setup guide | UNKNOWN | Need verification | Người khác khó chạy dự án | Kiểm tra README/setup instructions | PASS / PARTIAL / FAIL / UNKNOWN |
| Frontend start | UNKNOWN | Need verification | Không demo được UI | Chạy dev command | PASS / PARTIAL / FAIL / UNKNOWN |
| Backend start | UNKNOWN | Need verification | FE không có API thật | Chạy server local | PASS / PARTIAL / FAIL / UNKNOWN |
| Database local | UNKNOWN | Need verification | Không test được data flow | Kiểm tra connection/migration/seed | PASS / PARTIAL / FAIL / UNKNOWN |
| API connection | UNKNOWN | Need verification | FE/BE không kết nối | Kiểm tra API base URL/CORS/proxy | PASS / PARTIAL / FAIL / UNKNOWN |
| Auth local | UNKNOWN | Need verification | Không test được role | Test login/logout/session | PASS / PARTIAL / FAIL / UNKNOWN |
| Core workflow demo | UNKNOWN | Need verification | Không chứng minh MVP | Manual test P0 flow end-to-end | PASS / PARTIAL / FAIL / UNKNOWN |
| Build/typecheck | UNKNOWN | Need verification | Có thể lỗi khi build | Chạy build/typecheck/lint | PASS / PARTIAL / FAIL / UNKNOWN |

Không bắt buộc ở giai đoạn này:

- CI/CD hoàn chỉnh
- Cloud deployment
- Production monitoring
- Production rollback
- Load testing lớn
- Kubernetes/infrastructure scaling
- Backup/restore production

---

# 11. QA/QC Assessment

## 11.1 QA Coverage Matrix

| Module | Unit Test | Integration Test | E2E Test | Manual QA | Regression Risk | Status | Required Action |
|---|---|---|---|---|---|---|---|

## 11.2 Critical Flow Checklist

| Flow | Expected Result | Actual Result | Status | Required Fix |
|---|---|---|---|---|

Flow P0 cần kiểm tra:

- Login/logout
- Role-based access
- Core create/update/review/approve workflow
- File upload/download nếu có
- Notification nếu là core
- Admin sensitive action nếu có
- Invalid input
- Unauthorized access
- API error handling

## 11.3 MVP Definition of Done

Một feature chỉ được coi là done khi:

- Backend endpoint/service có thật hoặc mock được ghi rõ
- Frontend gọi đúng API hoặc mock được ghi rõ
- DTO/types match
- Role guard có ở backend nếu là protected action
- UI action guard có ở frontend
- Validation có ở frontend/backend khi cần
- Loading/empty/error states có
- Manual QA pass cho flow chính
- Không còn write deprecated field
- Không có UI action gọi API chưa tồn tại mà không disabled

---

# 12. Security & Permission Review

Bảng:

| Security Area | Current State | Risk | Severity | Recommendation |
|---|---|---|---|---|

Kiểm tra:

- Authentication
- Authorization
- Backend role guard
- Object-level access control
- Session/token handling
- Password handling
- Sensitive data exposure
- API access control
- File access control
- Input validation
- XSS/CORS/CSRF basic risk
- Secrets trong source code
- Audit log cho action nhạy cảm

Không cần audit compliance chuyên sâu, nhưng không được bỏ qua backend role guard và access control.

---

# 13. Risk Register

| Risk | Area | Impact | Probability | Severity | Mitigation | Priority |
|---|---|---|---|---|---|---|

Severity:

- Critical: chặn MVP hoặc gây sai quyền/data nghiêm trọng
- High: ảnh hưởng core workflow
- Medium: ảnh hưởng demo/UX/integration
- Low: polish hoặc tối ưu sau

---

# 14. Gap Analysis

| Gap Area | Current State | Expected State | Gap | Recommended Action | Priority |
|---|---|---|---|---|---|

Bắt buộc có gap cho:

- Business workflow
- Backend enforcement
- Frontend action/rendering
- API contract
- Data model
- Role/permission
- QA/testing
- Localhost readiness
- UI/UX

---

# 15. Recommended Next Steps

Chia theo ưu tiên:

## P0 — Fix trước để đạt MVP demo

Gồm lỗi chặn core workflow, FE/BE mismatch, role guard, API thiếu, build/runtime lỗi.

Mỗi action cần ghi:

- Module/file cần sửa
- Việc cần làm
- Vì sao cần làm
- Command/check cần chạy
- Flow cần test lại

## P1 — Fix để ổn định MVP

Gồm validation, error states, test coverage, QA checklist, UI consistency.

## P2 — Sau MVP

Gồm polish, analytics, advanced DevOps, production hardening, monitoring, optimization.

---

# 16. Final Senior IT Verdict

Kết luận rõ:

- Dự án có đúng nghiệp vụ không?
- MVP scope có đúng không?
- Backend/frontend đã match chưa?
- API contract đã ổn chưa?
- Data model có phản ánh đúng nghiệp vụ không?
- Role/permission có enforce thật chưa?
- QA/QC đã đủ cho localhost MVP chưa?
- Dự án có demo local được chưa?
- Có rủi ro nghiêm trọng nào không?

Chọn một verdict cuối:

- NOT RUNNABLE LOCALLY
- LOCAL DEV READY WITH RISKS
- MVP DEMO READY
- MVP TECHNICAL CANDIDATE
- NOT READY

Không được chọn “MVP DEMO READY” nếu:

- FE/BE chưa kết nối được
- Auth/role chưa test được
- Core workflow chỉ là UI giả nhưng không ghi rõ mock
- API contract còn mismatch nghiêm trọng
- Backend không enforce role/status cho action quan trọng
- Build/typecheck lỗi nghiêm trọng
- Không có manual QA cho critical path

Tone bắt buộc:

- Chuyên nghiệp
- Nghiêm khắc
- Có evidence
- Không giả định khi thiếu dữ liệu
- Ưu tiên fix thực tế
