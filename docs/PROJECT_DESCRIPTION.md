# 🧥 Redo TuaTua AI — Mô tả dự án

> **Stylist AI cá nhân** — Phối đồ thông minh từ tủ đồ hiện có, gợi ý mua sắm đúng nhu cầu qua affiliate các sàn TMĐT.

---

## 📌 Tổng quan

**Redo TuaTua AI** là web/app thời trang AI giải quyết hai bài toán thường gặp:

1. **"Tôi có đầy tủ quần áo nhưng không biết mặc gì."**
2. **"Tôi muốn mua thêm đồ nhưng không biết nên chọn gì."**

Ứng dụng đóng vai trò **stylist cá nhân AI** — phân tích tủ đồ, gợi ý phối đồ theo dịp mặc, và đề xuất mua sắm thông minh thông qua tích hợp affiliate với các sàn thương mại điện tử.

---

## 🎯 Vấn đề cần giải quyết

| Bài toán | Mô tả |
|---|---|
| Tủ đồ đầy nhưng không biết phối | Người dùng có nhiều quần áo nhưng thiếu ý tưởng kết hợp phù hợp |
| Mua sắm không có chiến lược | Mua đồ theo cảm hứng, dẫn đến dư thừa hoặc thiếu item quan trọng |
| Phong cách chưa nhất quán | Không hiểu rõ style cá nhân nên khó đưa ra quyết định thời trang |
| Không theo kịp xu hướng | Thiếu cập nhật về trend mà vẫn muốn mặc đẹp theo thời điểm |

---

## ✨ Tính năng cốt lõi

### 1. 🗄️ Quản lý tủ đồ (Wardrobe Manager)

- Upload ảnh từng món đồ; AI tự động phân loại danh mục, màu sắc, mùa
- Gắn tag, tìm kiếm và lọc theo nhiều tiêu chí
- Quản lý toàn bộ wardrobe từ giao diện trực quan

### 2. 👗 Phối đồ bằng AI (AI Outfit Recommender)

- Tạo outfit phù hợp theo **dịp mặc** (đi làm, dạo phố, hẹn hò, tiệc…) từ tủ đồ hiện có
- Phối màu hài hòa dựa trên color harmony + style matching
- Giải thích lý do chọn từng item (explainable AI)
- Hỗ trợ nhập prompt tự nhiên: *"Gợi ý đồ đi cà phê cuối tuần phong cách tối giản"*

### 3. 🛍️ Gợi ý mua sắm qua Affiliate TMĐT (Smart Shopping Advisor)

AI phân tích tủ đồ, xác định **khoảng trống** và đề xuất sản phẩm cụ thể từ các sàn TMĐT đối tác thông qua **affiliate link**:

- **Gap Analysis**: tìm ra item còn thiếu để tủ đồ phối được nhiều hơn
- **Affiliate Integration**: liên kết trực tiếp đến sản phẩm trên **Shopee, TikTok Shop** — người dùng mua, ứng dụng nhận hoa hồng affiliate
- **Smart Filter**: lọc gợi ý theo ngân sách, brand, phong cách và mùa hiện tại
- **Trend-aware**: ưu tiên item đang trend, phù hợp với style profile cá nhân
- **Anti-duplicate**: tránh gợi ý những thứ người dùng đã có trong tủ đồ

> 💡 **Mô hình doanh thu**: Mỗi lần người dùng click và mua hàng qua link affiliate, ứng dụng nhận commission từ sàn TMĐT đối tác — tạo vòng lặp win-win: người dùng được tư vấn chuẩn, ứng dụng có doanh thu bền vững.

### 4. 🔍 Xu hướng thời trang (Trend Explorer)

- Cập nhật xu hướng màu sắc, kiểu dáng theo thời gian thực
- AI tóm tắt trend thành insight dễ hiểu, cá nhân hóa theo từng user
- Tích hợp affiliate: mỗi item trending có link mua trực tiếp từ TMĐT

### 5. 🧬 Hồ sơ phong cách (Style Profile)

- Xây dựng "DNA phong cách" từ hành vi, sở thích và tủ đồ thực tế
- Analytics: màu ưa thích, danh mục hay dùng, phong cách nổi bật
- Nền tảng để AI gợi ý ngày càng chính xác hơn

---

## 🤖 AI Pipeline

```
Upload ảnh đồ
     ↓
AI phân loại (category, color, style, season)
     ↓
AI xây dựng style profile từ wardrobe + quiz + hành vi
     ↓
AI tạo outfit gợi ý theo ngữ cảnh
     ↓
AI phân tích gap → match sản phẩm từ sàn TMĐT affiliate
     ↓
User mua qua affiliate link → revenue cho platform
```

### Năng lực AI:

| Capability | Mô tả |
|---|---|
| **Item Classification** | Nhận diện loại đồ, màu sắc, pattern từ ảnh |
| **Outfit Generation** | Phối đồ từ wardrobe + context prompt |
| **Style Profiling** | Tổng hợp phong cách cá nhân từ dữ liệu thực tế |
| **Gap Analysis** | Xác định item còn thiếu trong tủ đồ |
| **Affiliate Matching** | Map item gợi ý với sản phẩm thực trên Shopee/TikTok Shop… |
| **Trend Summarization** | Lọc trend phù hợp theo từng user |
| **Prompt Normalization** | Biến yêu cầu tự nhiên thành input AI chuẩn |

---

## 👤 Đối tượng người dùng

| Nhóm | Nhu cầu chính |
|---|---|
| **Fashion-conscious individuals** | Muốn mặc đẹp mỗi ngày mà không mất nhiều thời gian suy nghĩ |
| **Người mới xây dựng phong cách** | Cần hướng dẫn để phát triển style nhất quán |
| **Minimalist shopper** | Muốn mua ít nhưng phối được nhiều, không lãng phí |
| **Người bận rộn** | Cần gợi ý outfit nhanh phù hợp từng dịp |
| **Fashion enthusiast** | Muốn theo kịp trend và thể hiện cá tính qua thời trang |

---

## 🏗️ Kiến trúc Microservices

### Tổng quan

Dự án được thiết kế theo mô hình **Microservices** — mỗi domain nghiệp vụ là một service độc lập, có database riêng, deploy riêng và giao tiếp qua API Gateway + Message Broker.

### Sơ đồ kiến trúc tổng thể

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                                 │
│   Web App (React/Vite)          Mobile App (tương lai)           │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼──────────────────────────────────────┐
│                      API GATEWAY                                 │
│   Routing │ Rate Limiting │ Auth Verify │ Load Balancing │ CORS  │
└─────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────────┘
      │      │      │      │      │      │      │      │
   ┌──▼─┐ ┌──▼──┐ ┌▼────┐ ┌▼─────┐ ┌───▼─┐ ┌──▼──┐ ┌─▼──────┐
   │AUTH│ │USER │ │WARD │ │OUTFIT│ │ AI  │ │TREND│ │AFFILIATE│
   │SVC │ │SVC  │ │ROBE │ │ SVC  │ │ SVC │ │ SVC │ │  SVC   │
   └──┬─┘ └──┬──┘ └┬────┘ └┬─────┘ └───┬─┘ └──┬──┘ └─┬──────┘
      │      │     │       │            │      │      │
┌─────▼──────▼─────▼───────▼────────────▼──────▼──────▼──────────┐
│                    MESSAGE BROKER (RabbitMQ / Kafka)             │
│   Events: item.uploaded │ outfit.generated │ product.clicked…   │
└──────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                          │
│  PostgreSQL (per svc) │ Redis Cache │ S3-compatible Object Store │
│  Elasticsearch (search) │ Prometheus + Grafana (monitoring)      │
└──────────────────────────────────────────────────────────────────┘
```

---

### Chi tiết từng Microservice

#### 1. 🔐 Auth Service
| | |
|---|---|
| **Trách nhiệm** | Đăng ký, đăng nhập, JWT, refresh token, OAuth2, RBAC |
| **Database** | PostgreSQL riêng (`auth_db`) |
| **Tech** | Node.js / Go |
| **Endpoints** | `POST /auth/register` `POST /auth/login` `POST /auth/refresh` `POST /auth/logout` |
| **Events phát ra** | `user.registered` `user.logged_in` |

#### 2. 👤 User & Profile Service
| | |
|---|---|
| **Trách nhiệm** | Hồ sơ cá nhân, style profile, preferences, settings, subscription |
| **Database** | PostgreSQL riêng (`user_db`) |
| **Tech** | Node.js / FastAPI |
| **Endpoints** | `GET/PATCH /me` `GET/PATCH /profile` `GET /settings` |
| **Events lắng nghe** | `user.registered` → tạo profile mặc định |

#### 3. 🗄️ Wardrobe Service
| | |
|---|---|
| **Trách nhiệm** | CRUD item tủ đồ, upload ảnh, phân loại metadata, bulk import |
| **Database** | PostgreSQL (`wardrobe_db`) + Object Storage (ảnh) |
| **Tech** | Node.js / FastAPI |
| **Endpoints** | `GET/POST /wardrobe-items` `PATCH/DELETE /wardrobe-items/:id` `POST /wardrobe-items/:id/image` |
| **Events phát ra** | `item.uploaded` → trigger AI classify |

#### 4. 👗 Outfit Service
| | |
|---|---|
| **Trách nhiệm** | Tạo, lưu, đánh giá, lịch sử outfit |
| **Database** | PostgreSQL riêng (`outfit_db`) |
| **Tech** | Node.js / FastAPI |
| **Endpoints** | `POST /outfits/generate` `GET /outfits` `POST /outfits/:id/save` `POST /outfits/:id/rate` |
| **Events phát ra** | `outfit.generated` `outfit.rated` |
| **Gọi đến** | AI Service (sync gRPC hoặc async queue) |

#### 5. 🤖 AI Service
| | |
|---|---|
| **Trách nhiệm** | Phân loại item, sinh outfit, style profiling, gap analysis, trend summarize |
| **Database** | PostgreSQL (`ai_db`) — lưu job, trace, prompt version |
| **Tech** | Python (FastAPI) + LLM/Vision model |
| **Endpoints** | `POST /ai/classify-item` `POST /ai/generate-outfit` `POST /ai/style-summary` `POST /ai/gap-analysis` |
| **Events lắng nghe** | `item.uploaded` → auto classify |
| **Events phát ra** | `ai.classified` `ai.outfit_ready` `ai.gap_analyzed` |
| **Đặc điểm** | Worker queue riêng, cache kết quả, versioned prompts, guardrails |

#### 6. 📈 Trend Service
| | |
|---|---|
| **Trách nhiệm** | Thu thập, ranking, snapshot xu hướng; AI trend insights |
| **Database** | PostgreSQL (`trend_db`) + Redis (hot trends cache) |
| **Tech** | Node.js / Python |
| **Endpoints** | `GET /trends/searches` `GET /trends/colors` `GET /trends/items` `GET /trends/insights` |
| **Events phát ra** | `trend.updated` → Affiliate Service cập nhật link |

#### 7. 🛍️ Affiliate Service
| | |
|---|---|
| **Trách nhiệm** | Tích hợp API sàn TMĐT, tạo affiliate link, tracking click/conversion, hoa hồng |
| **Database** | PostgreSQL (`affiliate_db`) |
| **Tech** | Node.js |
| **Endpoints** | `POST /affiliate/match-products` `POST /affiliate/create-link` `GET /affiliate/conversions` |
| **Tích hợp** | Shopee Affiliate API, TikTok Shop Affiliate |
| **Events lắng nghe** | `ai.gap_analyzed` → match & gợi ý sản phẩm |
| **Events phát ra** | `affiliate.link_clicked` `affiliate.conversion` |

#### 8. 🛡️ Admin Service
| | |
|---|---|
| **Trách nhiệm** | Quản trị users, moderation, analytics tổng hợp, cấu hình hệ thống |
| **Database** | Read từ các DB khác (read replica) |
| **Tech** | Node.js |
| **Endpoints** | `GET /admin/metrics` `GET /admin/users` `GET /admin/outfits` `PATCH /admin/settings` |

#### 9. 🔔 Notification Service *(tương lai)*
| | |
|---|---|
| **Trách nhiệm** | Push notification, email, in-app alerts |
| **Events lắng nghe** | `outfit.generated` `affiliate.conversion` `trend.updated` |

---

### Giao tiếp giữa các service

| Kiểu | Dùng khi | Công nghệ |
|---|---|---|
| **Sync REST** | API Gateway → Service (request/response thời gian thực) | HTTP/REST |
| **Sync gRPC** | Service → Service (low-latency internal call) | gRPC |
| **Async Event** | Trigger side-effects không cần chờ kết quả | RabbitMQ / Kafka |
| **Cache Read** | Trend hot data, AI result cache | Redis |

---

### Frontend Stack

| Layer | Công nghệ |
|---|---|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Routing** | React Router v6 |
| **State/Data** | TanStack React Query |
| **UI Components** | shadcn/ui + Radix UI |
| **Styling** | Tailwind CSS |
| **Animation** | Framer Motion |
| **Testing** | Vitest + Playwright |

---

## 🗺️ Roadmap triển khai

### Pha hiện tại — Frontend Demo ✅
- UI đầy đủ các màn hình chính
- Mock data mô phỏng luồng sản phẩm
- Design system hoàn chỉnh

### Pha 1 — Backend Foundation 🔄
- Auth API (register/login/session)
- User profile management
- Role/permission system

### Pha 2 — Wardrobe Real 📋
- CRUD wardrobe items với backend thật
- Upload ảnh lên object storage
- Search/filter server-side

### Pha 3 — AI Outfit Generation 📋
- Kết nối AI service thật vào outfit recommender
- Generate outfit từ wardrobe thật
- Save/rate/feedback loop

### Pha 4 — Affiliate Shopping 📋
- Gap analysis engine
- Tích hợp affiliate API: Shopee, TikTok Shop
- Affiliate link tracking & conversion analytics
- Personalized product matching từ catalog TMĐT

### Pha 5 — Production Ready 📋
- CI/CD pipeline
- Monitoring & observability
- Performance optimization

---

## 📁 Cấu trúc thư mục — Microservices Monorepo

Toàn bộ dự án được tổ chức theo **monorepo**, mỗi service là một package độc lập, dùng chung tooling và CI/CD.

```
redo-tuatua/                          ← Monorepo root
│
├── apps/
│   ├── web/                          ← Frontend (React + Vite)
│   │   ├── src/
│   │   │   ├── app/                  # Router, providers
│   │   │   ├── components/
│   │   │   │   ├── landing/          # Marketing sections
│   │   │   │   ├── wardrobe/         # Item cards, upload modal
│   │   │   │   ├── recommender/      # Outfit cards, AI chat
│   │   │   │   ├── trends/           # Trend modules
│   │   │   │   ├── profile/          # Style analytics
│   │   │   │   ├── admin/            # Admin dashboard
│   │   │   │   └── ui/               # shadcn/ui primitives
│   │   │   ├── features/             # Feature-scoped logic
│   │   │   ├── hooks/                # Custom hooks
│   │   │   ├── pages/                # Route screens
│   │   │   ├── services/             # API client, axios instances
│   │   │   └── lib/                  # Utilities
│   │   └── package.json
│   │
│   └── admin-dashboard/              ← Admin web (optional separate app)
│
├── services/
│   ├── api-gateway/                  ← API Gateway (routing, auth verify)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── middlewares/          # Rate limit, CORS, JWT verify
│   │   │   └── proxy/
│   │   └── Dockerfile
│   │
│   ├── auth-service/                 ← Auth & JWT
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/               # User auth entity
│   │   │   └── events/               # Phát user.registered…
│   │   ├── prisma/schema.prisma
│   │   └── Dockerfile
│   │
│   ├── user-service/                 ← Profile & preferences
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/               # StyleProfile, Settings
│   │   │   └── events/
│   │   ├── prisma/schema.prisma
│   │   └── Dockerfile
│   │
│   ├── wardrobe-service/             ← Tủ đồ
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/               # WardrobeItem, Tag
│   │   │   ├── storage/              # Upload handler, S3 client
│   │   │   └── events/               # Phát item.uploaded
│   │   ├── prisma/schema.prisma
│   │   └── Dockerfile
│   │
│   ├── outfit-service/               ← Outfit gen & history
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/               # Outfit, OutfitItem
│   │   │   └── events/
│   │   ├── prisma/schema.prisma
│   │   └── Dockerfile
│   │
│   ├── ai-service/                   ← AI core (Python)
│   │   ├── app/
│   │   │   ├── routers/
│   │   │   ├── services/
│   │   │   │   ├── classifier.py     # Item classification
│   │   │   │   ├── outfit_gen.py     # Outfit generation
│   │   │   │   ├── style_profile.py  # Style profiling
│   │   │   │   └── gap_analysis.py   # Gap analysis
│   │   │   ├── prompts/              # Versioned prompt templates
│   │   │   ├── workers/              # Async job workers
│   │   │   └── models/               # AIJob, Trace
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── trend-service/                ← Xu hướng
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── ingestion/            # Thu thập tín hiệu trend
│   │   │   └── models/               # TrendSnapshot, Ranking
│   │   ├── prisma/schema.prisma
│   │   └── Dockerfile
│   │
│   ├── affiliate-service/            ← Affiliate TMĐT
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── integrations/
│   │   │   │   ├── shopee.ts         # Shopee Affiliate API
│   │   │   │   └── tiktok-shop.ts    # TikTok Shop Affiliate
│   │   │   ├── models/               # AffiliateLink, Conversion
│   │   │   └── events/               # Lắng nghe ai.gap_analyzed
│   │   ├── prisma/schema.prisma
│   │   └── Dockerfile
│   │
│   └── notification-service/         ← Push, Email, In-app
│       ├── src/
│       │   ├── handlers/
│       │   └── providers/            # Email, FCM, WebSocket
│       └── Dockerfile
│
├── packages/                         ← Shared packages
│   ├── types/                        # Shared TypeScript types/interfaces
│   ├── utils/                        # Common utilities
│   ├── errors/                       # Standardized error classes
│   └── logger/                       # Shared logging config
│
├── infra/
│   ├── docker-compose.yml            # Local dev tất cả services
│   ├── docker-compose.override.yml   # Dev overrides
│   ├── k8s/                          # Kubernetes manifests
│   │   ├── deployments/
│   │   ├── services/
│   │   └── ingress/
│   └── terraform/                    # IaC cho cloud infra
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, test, build per service
│       └── cd.yml                    # Deploy staging → prod
│
├── docs/
│   ├── PROJECT_DESCRIPTION.md
│   ├── ARCHITECTURE_GUIDELINES.md
│   └── ROADMAP_BACKEND_AI_DEPLOYMENT.md
│
└── package.json                      ← Monorepo root (turborepo/nx)
```

---

## 🎨 Design Philosophy

Redo TuaTua AI được thiết kế với định hướng **editorial & premium**:

- **Typography**: Playfair Display (heading) + Be Vietnam Pro (body) — cảm giác sang trọng, đọc dễ
- **Theme**: Hỗ trợ cả light/dark mode với design token nhất quán
- **Animation**: Micro-animation (fade-in-up, blur reveal, float) tạo cảm giác sống động
- **Layout**: Khoảng trắng rộng rãi, hierarchy rõ ràng, từng màn hình có mục đích riêng
- **Color**: Brand colors hài hòa, accent rõ ràng, màu TMĐT được định nghĩa riêng

---

## 🔒 Bảo mật & Quyền riêng tư

- Ảnh tủ đồ của người dùng được lưu trên object storage riêng, không public mặc định
- Auth dùng token-based với refresh strategy an toàn
- Rate limiting cho AI endpoints để kiểm soát chi phí và tránh abuse
- Validation nhiều lớp cho upload và AI input
- Audit logging cho các hành động quan trọng

---

## 📊 Chỉ số thành công (KPIs)

| Metric | Mục tiêu |
|---|---|
| Outfit suggestions quality | >80% user rating positive |
| Wardrobe upload completion | >70% user hoàn thành upload ít nhất 10 items |
| Shopping recommendation relevance | >60% suggestions được lưu/click |
| Daily active usage | User quay lại ít nhất 3 lần/tuần |
| Style profile accuracy | User xác nhận profile phản ánh đúng phong cách |

---

## 🚀 Bắt đầu phát triển

```bash
# Clone repo
git clone <YOUR_GIT_URL>
cd redo_ai

# Cài dependencies
npm install

# Chạy development server
npm run dev

# Chạy tests
npm run test

# Build production
npm run build
```

**Môi trường yêu cầu**: Node.js ≥ 18, npm hoặc bun

---

> _Redo TuaTua AI — Mặc gì hôm nay không còn là câu hỏi khó._ 👗✨
