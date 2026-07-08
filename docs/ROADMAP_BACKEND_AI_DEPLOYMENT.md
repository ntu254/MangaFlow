# Roadmap triển khai backend, AI, deployment và tích hợp core functions

## Mục tiêu của roadmap

Roadmap này dùng để chuyển dự án từ **frontend demo** sang **nền tảng product-ready** có:

- backend API thật
- AI service riêng
- deployment tự động
- tích hợp đầy đủ các chức năng chính

> Quy ước cấu trúc code để dễ maintain, fix bug và update feature được mô tả riêng trong [Architecture Guidelines](./ARCHITECTURE_GUIDELINES.md).

---

## 1) Nguyên tắc triển khai

1. **Tách từng lớp rõ ràng**: frontend, backend, AI, storage, infra.
2. **Đi theo module ưu tiên business**: auth → wardrobe → outfit → trends → profile → admin.
3. **Dùng contract trước, code sau**: chốt request/response schema trước khi triển khai.
4. **Có observability ngay từ đầu**: logging, metrics, error tracking.
5. **Ưu tiên an toàn dữ liệu**: auth, rate limit, validation, upload security.

---

## 2) Kiến trúc mục tiêu

### Frontend

- React + Vite + TypeScript
- React Query cho data fetching
- component hóa theo feature

### Backend API

- REST API là lựa chọn dễ triển khai trước
- có thể bổ sung GraphQL sau nếu thật sự cần
- module hóa theo domain

### AI service

- service riêng để:
  - phân loại item
  - gợi ý outfit
  - tóm tắt style profile
  - tạo trend insights
  - sinh prompt/metadata

### Data layer

- PostgreSQL cho dữ liệu quan hệ
- Redis cho cache và queue
- Object storage cho hình ảnh và file upload

### Async processing

- job queue cho AI, ingest trend, xử lý ảnh

---

## 3) Pha 0 — Chuẩn bị nền tảng

### Deliverables

- chốt kiến trúc tổng thể
- chuẩn hóa naming conventions
- định nghĩa môi trường dev/staging/prod
- tạo schema dữ liệu sơ bộ
- chuẩn hóa error handling và logging

### Công việc cụ thể

- lập danh sách entity chính:
  - User
  - WardrobeItem
  - Outfit
  - StyleProfile
  - TrendSnapshot
  - AIJob
- xác định quyền truy cập:
  - guest
  - user
  - admin
- chốt tiêu chuẩn API response

### Kết quả mong muốn

- có tài liệu contract đủ để bắt đầu dev song song frontend/backend.

---

## 4) Pha 1 — Backend foundation

### Mục tiêu

Xây lõi backend trước để các module sau không bị đứt gãy.

### Tính năng cần có

- auth cơ bản
- user profile
- role/permission
- health check
- validation layer
- error format thống nhất

### API tối thiểu

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET /me`
- `PATCH /me`
- `GET /health`

### Kết quả mong muốn

- frontend có thể đăng nhập, lấy profile và lưu session an toàn.

---

## 5) Pha 2 — Wardrobe core

### Mục tiêu

Biến trang Wardrobe thành chức năng thật.

### Tính năng

- CRUD wardrobe items
- upload ảnh item
- tag/category/color/season metadata
- search/filter server-side hoặc hybrid
- bulk select / bulk actions

### API gợi ý

- `GET /wardrobe-items`
- `POST /wardrobe-items`
- `GET /wardrobe-items/:id`
- `PATCH /wardrobe-items/:id`
- `DELETE /wardrobe-items/:id`
- `POST /wardrobe-items/:id/image`
- `POST /wardrobe-items/bulk-import`

### Data contract gợi ý

- `id`
- `userId`
- `name`
- `category`
- `tags[]`
- `color`
- `season[]`
- `imageUrl`
- `source`
- `createdAt`

### Kết quả mong muốn

- Wardrobe page không còn dùng mock data cố định.

---

## 6) Pha 3 — Outfit recommendation core

### Mục tiêu

Xây luồng đề xuất outfit có thể lưu, chỉnh và tái sử dụng.

### Chức năng

- generate outfit từ wardrobe
- generate outfit từ trend/style prompt
- lưu outfit
- đánh giá outfit
- giải thích vì sao AI chọn item đó

### API gợi ý

- `POST /outfits/generate`
- `GET /outfits`
- `GET /outfits/:id`
- `POST /outfits/:id/save`
- `POST /outfits/:id/rate`
- `POST /outfits/:id/feedback`

### AI logic

- matching theo category
- color harmony
- style similarity
- season/context awareness
- price/availability constraints

### Kết quả mong muốn

- trang recommender trở thành công cụ chính thay vì chỉ là demo card.

---

## 7) Pha 4 — AI service

### Mục tiêu

Tách AI thành service riêng, có versioning và kiểm soát chất lượng.

### Use cases chính

1. **Item classification**
   - nhận diện category/style/color từ ảnh hoặc metadata
2. **Outfit generation**
   - tạo bộ phối dựa trên wardrobe và prompt
3. **Style profiling**
   - tổng hợp phong cách cá nhân từ hành vi và item
4. **Trend summarization**
   - gom tín hiệu trend thành insight dễ đọc
5. **Prompt assist**
   - chuẩn hóa câu hỏi người dùng thành input AI tốt hơn

### Kỹ thuật đề xuất

- model routing theo task
- prompt templates versioned
- cache kết quả AI
- lưu trace để debug
- guardrails chống output không hợp lệ

### API gợi ý

- `POST /ai/classify-item`
- `POST /ai/generate-outfit`
- `POST /ai/style-summary`
- `POST /ai/trend-insights`
- `POST /ai/normalize-prompt`

### Kết quả mong muốn

- AI service độc lập, dễ scale và dễ thay model.

---

## 8) Pha 5 — Trends & content ingestion

### Mục tiêu

Xây pipeline dữ liệu cho trending content.

### Nguồn dữ liệu

- dữ liệu nội bộ về click/save/view
- dữ liệu catalog sản phẩm
- dữ liệu social/trend nguồn ngoài nếu có quyền sử dụng
- manual curation từ admin

### Chức năng

- snapshot xu hướng theo ngày/tuần
- ranking theo style/color/item/query
- đồng bộ nội dung nổi bật
- AI summary cho trend page

### API gợi ý

- `GET /trends/searches`
- `GET /trends/colors`
- `GET /trends/items`
- `GET /trends/styles`
- `GET /trends/insights`

### Kết quả mong muốn

- trang Trends chuyển từ static showcase sang dashboard xu hướng thật.

---

## 9) Pha 6 — Profile, settings và notifications

### Mục tiêu

Chuẩn hóa cá nhân hóa và tài khoản người dùng.

### Chức năng

- update profile
- đổi mật khẩu
- liên kết nền tảng
- notification preferences
- subscription management

### API gợi ý

- `GET /profile`
- `PATCH /profile`
- `GET /settings/notifications`
- `PATCH /settings/notifications`
- `GET /integrations`
- `POST /integrations/connect`
- `POST /integrations/disconnect`

### Kết quả mong muốn

- profile/settings trở thành một phần thật của hệ thống, không chỉ là UI.

---

## 10) Pha 7 — Admin system

### Mục tiêu

Quản trị data, kiểm soát nội dung và theo dõi vận hành.

### Module admin

- user management
- wardrobe moderation
- outfit moderation
- trends curation
- product catalog
- analytics dashboard
- feedback inbox
- system settings

### API gợi ý

- `GET /admin/metrics`
- `GET /admin/users`
- `GET /admin/wardrobe-items`
- `GET /admin/outfits`
- `GET /admin/analytics`
- `GET /admin/feedback`
- `PATCH /admin/settings`

### Kết quả mong muốn

- admin dashboard có số liệu thật, không chỉ mock chart.

---

## 11) Pha 8 — Deployment & CI/CD

### Frontend deploy

- build tĩnh
- deploy lên Vercel / Netlify / Cloudflare Pages
- CDN cho assets

### Backend deploy

- container hóa service
- staging và production tách riêng
- health checks + rollback strategy

### AI deploy

- deploy riêng theo service
- queue workers riêng
- autoscaling theo load

### CI/CD pipeline

1. lint
2. typecheck
3. unit tests
4. build
5. E2E smoke
6. deploy staging
7. approval
8. deploy production

### Observability

- error tracking
- request logging
- job monitoring
- basic dashboards

---

## 12) Kế hoạch tích hợp frontend với backend

### Bước 1

- tạo API client chung
- chuẩn hóa base URL / auth headers / error mapping

### Bước 2

- thay mock data bằng query thật từng màn hình

### Bước 3

- giữ fallback/mock mode cho local dev nếu cần

### Bước 4

- đưa upload, generate outfit, save outfit vào flow thật

### Bước 5

- thêm optimistic update, caching, pagination, retry

---

## 13) Ưu tiên triển khai theo thứ tự

### Mức ưu tiên cao nhất

1. Auth + user profile
2. Wardrobe CRUD + upload
3. Outfit generation
4. AI service nền tảng
5. Trends ingestion
6. Admin metrics
7. Deployment automation

### Mức ưu tiên sau

- integrations marketplace
- subscriptions / billing
- collaborative styling
- social sharing

---

## 14) Rủi ro cần kiểm soát

- AI output không nhất quán
- ảnh upload nặng hoặc lỗi định dạng
- dữ liệu trend không sạch
- phân quyền admin chưa chặt
- latency cao nếu AI gọi đồng bộ
- chi phí inference tăng nhanh

### Giảm rủi ro

- validation ở nhiều lớp
- cache và queue
- audit log
- rate limit
- feature flags

---

## 15) Definition of done cho bản production đầu tiên

- user đăng ký/đăng nhập được
- wardrobe CRUD hoạt động thật
- outfit generator chạy bằng backend/AI
- trends load từ dữ liệu thật
- profile/settings lưu được
- admin xem được metrics thật
- deployment tự động hoạt động ổn định
