# Redo TuaTua AI — Project Documentation

## 1) Tổng quan dự án

**Redo TuaTua AI** là một ứng dụng thời trang dạng frontend-first, tập trung vào trải nghiệm phối đồ, quản lý tủ đồ, khám phá xu hướng và mô phỏng luồng AI styling.

Sản phẩm hiện tại gồm các khu vực chính:

- **Landing page**: giới thiệu sản phẩm và CTA chuyển đổi.
- **Outfit recommender**: hiển thị outfit gợi ý theo ngữ cảnh/style.
- **Wardrobe**: quản lý tủ đồ cá nhân, lọc, tìm kiếm, chọn item.
- **Trends**: hiển thị xu hướng màu sắc, sản phẩm, phong cách.
- **Style profile**: hồ sơ phong cách, analytics, lịch sử và gợi ý.
- **Profile & settings**: cài đặt tài khoản, bảo mật, kết nối nền tảng.
- **Admin area**: dashboard và các trang quản trị dữ liệu.

Hiện tại dự án dùng **mock data** và UI mô phỏng rất nhiều luồng sản phẩm. Điều này tốt cho demo, nhưng để trở thành một nền tảng production cần bổ sung backend, AI service, storage, auth và CI/CD.

Chi tiết use cases user-facing xem tại [`USE_CASES_USER_PROFILE.md`](./USE_CASES_USER_PROFILE.md) (UC-USER-97→125).

---

## 2) Mục tiêu sản phẩm

### Mục tiêu ngắn hạn

- Hoàn thiện trải nghiệm người dùng ở các màn hình chính.
- Chuẩn hóa cấu trúc component và dữ liệu.
- Tạo nền tảng để gắn backend thật vào các luồng chính.

### Mục tiêu trung hạn

- Có hệ thống backend quản lý người dùng, tủ đồ, outfit, xu hướng và analytics.
- Có AI service tạo outfit, phân loại item và cá nhân hóa gợi ý.
- Có pipeline triển khai ổn định cho staging và production.

### Mục tiêu dài hạn

- Trở thành một nền tảng stylist AI có thể mở rộng.
- Hỗ trợ tích hợp marketplace, social commerce và recommendation engine.

---

## 3) Tech stack hiện tại

### Core stack

- **Vite**: build tool chính.
- **React 18** + **TypeScript**: UI và type safety.
- **React Router v6**: routing.
- **TanStack React Query**: nền tảng cho fetch/cache dữ liệu tương lai.
- **Tailwind CSS**: styling hệ thống utility-first.
- **shadcn/ui + Radix UI**: component primitives.
- **Framer Motion**: animation.
- **Sonner / Toast**: thông báo.

### Testing

- **Vitest** + **Testing Library** cho unit/integration.
- **Playwright** cho E2E.

### Tooling

- ESLint
- PostCSS
- lovable-tagger trong dev mode

---

## 4) Cấu trúc thư mục

### Root files

- `package.json`: scripts và dependencies.
- `vite.config.ts`: cấu hình Vite, alias `@`.
- `tailwind.config.ts`: theme tokens, màu sắc, animation.
- `vitest.config.ts`: cấu hình test.
- `playwright.config.ts`: cấu hình E2E.
- `index.html`: entry HTML.

### `src/`

- `main.tsx`: mount React app.
- `App.tsx`: router + providers.
- `index.css`: design tokens, typography, base styles.
- `lib/utils.ts`: helper `cn()`.
- `hooks/`: custom hooks như mobile detection, toast, parallax.
- `components/`:
  - `landing/`: hero, navbar, sections marketing.
  - `recommender/`: chat, outfit cards, header.
  - `wardrobe/`: filter sidebar, item card, upload modal, AI generator.
  - `trends/`: trend modules.
  - `profile/`: style analytics và profile blocks.
  - `admin/`: layout, sidebar, stat cards, badges.
  - `ui/`: bộ component nền từ shadcn/ui.
- `pages/`: route-level screens.

---

## 5) Điều hướng và routing

### Public routes

- `/` — landing page
- `/quiz` — khảo sát style
- `/recommender` — gợi ý outfit
- `/wardrobe` — tủ đồ
- `/trends` — xu hướng
- `/style-profile` — hồ sơ phong cách
- `/login` — đăng nhập
- `/signup` — đăng ký
- `/profile` — cài đặt hồ sơ

### Admin routes

- `/admin` — dashboard
- `/admin/users`
- `/admin/wardrobe`
- `/admin/outfits`
- `/admin/trends`
- `/admin/products`
- `/admin/analytics`
- `/admin/feedback`
- `/admin/settings`

### Routing pattern

- Trang public dùng layout riêng, thường có `Navbar` và `Footer`.
- Admin dùng `AdminLayout` với `SidebarProvider` + top bar.
- Fallback route `*` trỏ đến `NotFound`.

---

## 6) Các module chức năng chính

### 6.1 Landing page

**Mục tiêu**: mô tả giá trị sản phẩm, tăng chuyển đổi.

**Các section**:

- Hero
- How it works
- Style explorer
- Outfit generator
- AI input
- Social proof
- Style profile preview
- CTA banner
- Footer

### 6.2 Outfit recommender

**Mục tiêu**: đề xuất outfit theo style / ngữ cảnh.

**Đặc điểm hiện tại**:

- dùng sample outfits hardcoded
- có filter theo style
- mô phỏng AI comment và giá sản phẩm

### 6.3 Wardrobe manager

**Mục tiêu**: quản lý tủ đồ cá nhân.

**Chức năng hiện tại**:

- xem danh sách item
- lọc theo category/style/search
- chọn nhiều item
- mở modal upload
- AI outfit generator

**Logic chính**:

- `useMemo` để tính danh sách lọc
- `useState` cho filter/search/selected/upload modal

### 6.4 Trends

**Mục tiêu**: hiển thị xu hướng thời trang hiện tại.

**Nội dung**:

- trending searches
- trending colors
- trending items
- trending styles
- AI trend insights
- inspiration grid

### 6.5 Style profile & profile settings

**Mục tiêu**: cá nhân hóa trải nghiệm.

**Bao gồm**:

- thông tin cá nhân
- bảo mật
- kết nối nền tảng thương mại điện tử
- thông báo
- subscription
- hành động nguy hiểm

### 6.6 Admin dashboard

**Mục tiêu**: quản trị hệ thống.

**Hiện tại**:

- KPI cards
- charts dạng CSS
- recent activity
- các màn quản trị chi tiết theo module

---

## 7) Design system và styling

### Typography

- Heading: `Playfair Display`
- Body: `Be Vietnam Pro`

### Theme tokens

`src/index.css` định nghĩa:

- light/dark variables
- màu brand
- màu sàn TMĐT
- radius và shadow style
- background gradients

### Animation

- fade-in-up
- slide-up
- shimmer
- blur reveal
- float

### Quy ước UI

- Nút hành động chính thường dùng accent color.
- Layout có khoảng trắng lớn, cảm giác premium/editorial.
- Component ưu tiên tái sử dụng thay vì viết lặp.

---

## 8) Data flow hiện tại

### Hiện trạng

- Phần lớn dữ liệu là mock data trong component.
- Không thấy backend API thật được kết nối.
- Không có auth state tập trung.

### Hướng chuẩn hóa tương lai

- Tách dữ liệu demo ra file seed riêng.
- Dùng API layer chung (`src/services/` hoặc `src/api/`).
- Dùng React Query cho tất cả fetch/mutate.
- Dùng schema validation cho request/response.

---

## 9) Testing strategy

### Unit / component tests

- Kiểm tra render component.
- Kiểm tra filter logic.
- Kiểm tra input/state transitions.

### Integration tests

- form submit
- route navigation
- modal open/close
- selected item flow

### E2E

- truy cập landing
- điều hướng sang wardrobe/recommender/trends
- thử flow upload hoặc lọc item

---

## 10) Điểm cần chuẩn bị trước khi lên production

### Kỹ thuật

- Backend thật cho user/profile/wardrobe/outfits.
- Storage cho ảnh sản phẩm, ảnh người dùng, file upload.
- Auth + session/token strategy.
- AI service tách biệt khỏi frontend.
- Error handling + loading states nhất quán.
- Logging/monitoring.

### Sản phẩm

- Quy chuẩn dữ liệu cho item/outfit/style.
- Quy trình phê duyệt nội dung và dữ liệu AI.
- Cơ chế versioning cho prompt/model.

---

## 11) Đề xuất kiến trúc backend tương lai

### Service modules

- **Auth service**: đăng ký, đăng nhập, refresh token, role.
- **User service**: hồ sơ, preferences, settings.
- **Wardrobe service**: item, tag, image, upload, batch import.
- **Outfit service**: gợi ý outfit, lưu outfit, lịch sử.
- **Trend service**: xu hướng, ranking, ingestion.
- **AI service**: classify, recommend, summarize, generate.
- **Admin service**: analytics, moderation, configuration.

### Dữ liệu nền tảng

- users
- sessions / tokens
- wardrobe_items
- wardrobe_images
- outfits
- outfit_items
- style_profiles
- trend_sources
- trend_snapshots
- ai_jobs
- audit_logs

---

## 12) Deployment outlook

### Frontend

- build bằng Vite
- deploy static lên Vercel / Netlify / Cloudflare Pages

### Backend

- API deploy trên container platform hoặc PaaS
- database managed service
- object storage cho ảnh

### AI

- AI inference service tách riêng
- queue cho job nặng
- cache kết quả gợi ý

---

## 13) Tóm tắt nhanh

Repo hiện tại là một frontend fashion AI rất giàu UI, có cấu trúc tốt để mở rộng. Phần tiếp theo quan trọng nhất là biến các màn hình demo thành một hệ thống có backend thật, AI thật và pipeline triển khai ổn định.
