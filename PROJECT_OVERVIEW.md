# Redo TuaTua AI

> Ứng dụng thời trang AI giúp bạn phối đồ thông minh, quản lý tủ đồ cá nhân và khám phá xu hướng — tất cả trong một nơi.

## Giới thiệu

**Redo TuaTua AI** là một nền tảng thời trang ứng dụng trí tuệ nhân tạo, được thiết kế để giúp người dùng tự tin hơn trong việc lựa chọn trang phục hàng ngày. Thay vì mất hàng giờ trước tủ đồ, người dùng có thể nhận gợi ý phối đồ phù hợp với phong cách, vóc dáng và dịp sử dụng chỉ trong vài giây.

## Tính năng chính

### Dành cho người dùng

- **Style Quiz** — Bài quiz cá nhân hóa giúp AI hiểu phong cách, sở thích và vóc dáng của bạn
- **Style Profile** — Hồ sơ phong cách cá nhân với phân tích chi tiết về gu thẩm mỹ
- **Outfit Builder** — Công cụ phối đồ trực quan, tự tay kết hợp các món đồ trong tủ
- **AI Recommender** — Gợi ý outfit thông minh dựa trên dịp, thời tiết, và style profile
- **Virtual Try-On** — Thử đồ ảo bằng công nghệ Kling AI
- **Wardrobe Management** — Số hóa và quản lý toàn bộ tủ đồ cá nhân
- **AI Collection** — Lưu trữ các outfit AI đã tạo để xem lại
- **Trends** — Khám phá xu hướng thời trang mới nhất
- **Affiliate Shopping** — Mua sắm trực tiếp qua Shopee, Lazada, Tiki

### Dành cho admin

- Dashboard tổng quan vận hành
- Quản lý người dùng, sản phẩm, và xu hướng
- Cấu hình AI Engine
- Quản lý gói cước & billing (PayOS)
- Analytics & Survey
- Notifications & Feedback

## Tech Stack

**Frontend**

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- [Framer Motion](https://www.framer.com/motion/) — animations
- [React Router v6](https://reactrouter.com/) — routing
- [TanStack Query](https://tanstack.com/query) — server state
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) — forms & validation
- [Recharts](https://recharts.org/) — data visualization

**Backend & Services**

- [Supabase](https://supabase.com/) — Auth, Database (PostgreSQL), Storage, Edge Functions
- [Google Gemini API](https://ai.google.dev/) — AI engine cho phối đồ và phân tích
- [Kling AI](https://klingai.com/) — Virtual try-on
- [PayOS](https://payos.vn/) — Thanh toán

**Testing & Quality**

- [Vitest](https://vitest.dev/) — Unit tests
- [Playwright](https://playwright.dev/) — E2E tests
- [Testing Library](https://testing-library.com/) — Component tests
- [ESLint](https://eslint.org/) — Linting

**Deployment**

- [Vercel](https://vercel.com/) — Hosting

## Yêu cầu hệ thống

- **Node.js** ≥ 18.x
- **npm**, **pnpm**, hoặc **bun** (dự án dùng `bun.lock`)
- Tài khoản [Supabase](https://supabase.com/) (free tier đủ dùng)
- API keys: Gemini, Kling AI (tùy chọn các dịch vụ khác)

## Cài đặt

### 1. Clone repository

```bash
git clone <YOUR_GIT_URL>
cd redo-tuatua-ai
```

### 2. Cài đặt dependencies

```bash
# Dùng npm
npm install

# Hoặc bun (khuyến nghị — nhanh hơn)
bun install
```

### 3. Cấu hình môi trường

Copy file mẫu và điền các giá trị thực tế:

```bash
cp .env.example .env
```

Các biến môi trường cần thiết:

| Biến | Mô tả | Bắt buộc |
|------|-------|----------|
| `VITE_SUPABASE_URL` | URL project Supabase | ✓ |
| `VITE_SUPABASE_ANON_KEY` | Anon key của Supabase | ✓ |
| `GEMINI_API_KEY` | API key Google Gemini | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (cho Edge Functions) | ✓ |
| `VITE_KLING_BASE_URL` | Endpoint Kling AI | Try-on |
| `VITE_KLING_ACCESS_KEY` | Kling access key | Try-on |
| `VITE_KLING_SECRET_KEY` | Kling secret key | Try-on |
| `PAYOS_CLIENT_ID` | PayOS client ID | Payment |
| `PAYOS_API_KEY` | PayOS API key | Payment |
| `PAYOS_CHECKSUM_KEY` | PayOS checksum key | Payment |

### 4. Setup database

Chạy migration script trong Supabase SQL Editor:

```bash
# File full_deploy.sql chứa toàn bộ schema và seed data
```

## Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy dev server (Vite) |
| `npm run build` | Build production |
| `npm run build:dev` | Build với mode development |
| `npm run preview` | Preview bản build |
| `npm run lint` | Kiểm tra lint |
| `npm run test` | Chạy unit tests (Vitest) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Chạy E2E tests (Playwright) |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run deploy` | Build + deploy production lên Vercel |
| `npm run deploy:preview` | Build + deploy preview |

## Cấu trúc thư mục

```
redo-tuatua-ai/
├── docs/                    # Tài liệu chi tiết dự án
├── e2e/                     # Playwright E2E tests
├── public/                  # Static assets
├── scripts/                 # Build & utility scripts
├── src/
│   ├── app/                 # App-level setup (providers, routes)
│   ├── assets/              # Hình ảnh, fonts, media
│   ├── components/          # UI components dùng chung (shadcn/ui)
│   ├── features/            # Modules theo tính năng
│   │   ├── admin/           # Admin dashboard
│   │   ├── auth/            # Đăng nhập, đăng ký, OAuth
│   │   ├── landing/         # Trang chủ
│   │   ├── notifications/   # Hệ thống thông báo
│   │   ├── outfit-builder/  # Công cụ phối đồ
│   │   ├── profile/         # Hồ sơ người dùng
│   │   ├── quiz/            # Style quiz
│   │   ├── recommender/     # AI gợi ý outfit
│   │   ├── style-profile/   # Phân tích phong cách
│   │   ├── subscription/    # Gói cước & thanh toán
│   │   ├── trends/          # Xu hướng thời trang
│   │   └── wardrobe/        # Quản lý tủ đồ
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities & helpers
│   ├── pages/               # Top-level pages (NotFound, ...)
│   ├── services/            # API clients & services
│   ├── shared/              # Shared types, constants
│   └── main.tsx             # Entry point
├── supabase/                # Supabase config & migrations
├── .env.example             # Mẫu biến môi trường
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## Routing

### Public

- `/` — Landing page
- `/login`, `/signup` — Authentication
- `/forgot-password`, `/reset-password` — Password recovery
- `/quiz` — Style quiz
- `/recommender` — AI outfit recommender
- `/outfit-builder` — Manual outfit builder
- `/trends` — Fashion trends
- `/pricing` — Subscription plans

### Protected (cần đăng nhập)

- `/profile` — User profile
- `/style-profile` — Phân tích phong cách
- `/wardrobe` — Quản lý tủ đồ
- `/wardrobe/ai-collection` — Outfit AI đã lưu
- `/payment/result` — Kết quả thanh toán

### Admin

- `/admin/login` — Admin login
- `/admin` — Dashboard
- `/admin/users`, `/admin/products`, `/admin/trends`, `/admin/ai-engine`
- `/admin/plans`, `/admin/analytics`, `/admin/notifications`
- `/admin/feedback`, `/admin/survey`, `/admin/settings`

## Triển khai

Dự án được cấu hình sẵn cho [Vercel](https://vercel.com/):

```bash
# Deploy production
npm run deploy

# Deploy preview
npm run deploy:preview
```

Các Edge Functions của Supabase được deploy riêng qua Supabase CLI. Đảm bảo set các secrets (PayOS, Gemini) trong Supabase Dashboard.

## Testing

```bash
# Unit tests
npm run test

# E2E tests (cần dev server đang chạy)
npm run test:e2e

# Hoặc UI mode
npm run test:e2e:ui
```

## Tài liệu chi tiết

Xem thêm trong thư mục [`docs/`](./docs):

- [Project Documentation](./docs/PROJECT_DOCS.md)
- [Architecture Guidelines](./docs/ARCHITECTURE_GUIDELINES.md)
- [Refactor Map](./docs/REFACTOR_MAP.md)
- [Backend, AI & Deployment Roadmap](./docs/ROADMAP_BACKEND_AI_DEPLOYMENT.md)
- [MVP Documentation](./docs/MVP.md)

## Đóng góp

Dự án được phát triển trong khuôn khổ môn EXE202. Mọi đóng góp, bug report hoặc feature request đều được hoan nghênh qua issues hoặc pull requests.

## License

Xem file LICENSE để biết chi tiết.
