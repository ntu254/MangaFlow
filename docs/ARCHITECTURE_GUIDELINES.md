# Architecture Guidelines — Redo TuaTua AI

## Mục tiêu

Tài liệu này định nghĩa cách tổ chức code để dự án:

- dễ bảo trì
- dễ fix bug
- dễ update feature
- ít phụ thuộc chéo giữa các phần
- nhất quán trong naming, structure và data flow

Mục tiêu lớn nhất là: **mỗi tính năng nằm gọn trong một khu vực rõ ràng, hạn chế logic phân tán khắp nơi**.

---

## 1) Nguyên tắc kiến trúc

### 1.1 Single Responsibility

Mỗi file/component/hook/service chỉ nên làm một việc chính.

Ví dụ:

- component chỉ render UI
- hook chỉ chứa logic tái sử dụng
- service chỉ gọi API hoặc xử lý business logic
- type/schema chỉ định nghĩa dữ liệu

### 1.2 Feature independence

Mỗi domain nên có cấu trúc riêng để khi sửa Wardrobe không làm hỏng Trends hay Admin.

### 1.3 Shared only when needed

Chỉ đưa code vào khu vực shared khi nó thật sự dùng chung và ổn định.

Nếu một thứ chỉ dùng cho 1 feature thì giữ nó trong feature đó.

### 1.4 Data flow rõ ràng

UI → hook → service → API → backend → response → state/UI

Không để component gọi API trực tiếp nếu có thể tránh được.

### 1.5 Consistency over convenience

Ưu tiên cấu trúc nhất quán hơn là làm nhanh theo từng màn hình riêng lẻ.

---

## 2) Cấu trúc thư mục đề xuất

### 2.1 Root `src/`

```text
src/
  app/
    providers/
    router/
    config/
  shared/
    api/
    components/
    hooks/
    lib/
    constants/
    types/
    utils/
  features/
    wardrobe/
    recommender/
    trends/
    profile/
    auth/
    admin/
    landing/
  pages/
  assets/
  styles/
```

### 2.2 Ý nghĩa từng lớp

#### `app/`

Chứa phần khởi tạo ứng dụng:

- providers
- router
- query client
- theme
- auth bootstrap
- app-level config

#### `shared/`

Chứa thứ dùng chung toàn app:

- UI atoms
- helper functions
- hooks tái sử dụng
- constants
- shared types
- base API client

#### `features/`

Mỗi feature là một domain riêng:

- wardrobe
- recommender
- trends
- profile
- auth
- admin
- landing

Mỗi feature có thể có:

```text
features/wardrobe/
  components/
  hooks/
  services/
  api/
  types/
  schemas/
  utils/
  constants.ts
  index.ts
```

#### `pages/`

Chỉ giữ route-level composition.

Page không nên chứa business logic nặng.

---

## 3) Quy tắc phân tách code

### 3.1 Page

Page chỉ nên:

- compose layout
- gọi feature components
- đọc route params/query

Page không nên chứa logic phức tạp như filter lớn, transform dữ liệu, gọi API trực tiếp.

### 3.2 Component

Component có 3 loại:

1. **UI component**: chỉ render.
2. **Feature component**: gắn logic nhỏ của domain.
3. **Container component**: nối data với UI.

### 3.3 Hook

Hook dùng cho logic tái sử dụng:

- filter/search state
- debounce
- responsive state
- modal state
- API query wrapper

### 3.4 Service

Service chịu trách nhiệm:

- gọi API
- mapping response
- xử lý business rule cấp thấp

### 3.5 Schema/Type

Mọi dữ liệu chính nên có:

- TypeScript type/interface
- validation schema nếu có form/request

---

## 4) Chuẩn hóa theo domain

### 4.1 Wardrobe

Nên tách riêng:

- item list
- filter logic
- upload flow
- item detail
- AI suggestion

### 4.2 Recommender

Nên tách riêng:

- chat/assistant panel
- outfit result list
- outfit detail card
- action save/rate/share

### 4.3 Trends

Nên tách riêng:

- search trends
- colors trends
- items trends
- styles trends
- AI insights

### 4.4 Profile

Nên tách riêng:

- personal info
- security
- integrations
- notification settings
- subscription

### 4.5 Admin

Nên tách riêng:

- dashboard metrics
- moderation
- users
- products
- feedback
- settings

---

## 5) Naming conventions

### File naming

- Component: `PascalCase.tsx`
- Hook: `useSomething.ts`
- Utility: `something.ts`
- Types: `types.ts` hoặc theo domain `wardrobe.types.ts`
- Schema: `*.schema.ts`
- Service: `*.service.ts`
- API client: `*.api.ts`

### Export conventions

- ưu tiên named export cho shared utilities
- default export chỉ dùng khi một file đại diện duy nhất cho một feature/page

### Folder conventions

- component tên rõ nghĩa
- tránh folder quá sâu nếu chưa cần
- một domain không nên copy structure của domain khác một cách mù quáng

---

## 6) State management strategy

### 6.1 Local state

Dùng cho:

- toggle modal
- input search
- selected tabs
- UI state ngắn hạn

### 6.2 Server state

Dùng React Query cho:

- user profile
- wardrobe items
- outfit results
- trends data
- admin metrics

### 6.3 Shared app state

Chỉ dùng store riêng khi có nhu cầu thật:

- auth session
- theme
- cart-like selection across pages
- global filters

Nếu chưa cần, đừng đưa thêm global store vì sẽ làm hệ thống khó debug hơn.

---

## 7) API layer chuẩn

### 7.1 Không gọi fetch trực tiếp trong component

Nên có lớp trung gian:

```text
component -> hook -> service -> api client -> backend
```

### 7.2 API client

Chứa:

- baseURL
- auth token injection
- error normalization
- retry policy
- timeout

### 7.3 Service layer

Chứa:

- logic nghiệp vụ nhỏ
- mapping DTO → UI model
- combine nhiều request nếu cần

---

## 8) Error handling

### 8.1 Chuẩn lỗi thống nhất

Mọi API response lỗi nên đi theo một format thống nhất.

Ví dụ:

```json
{
  "message": "Invalid request",
  "code": "VALIDATION_ERROR",
  "details": []
}
```

### 8.2 UI error states

Mọi feature quan trọng nên có:

- loading
- empty state
- error state
- retry action

### 8.3 Không nuốt lỗi

Không `catch` rồi bỏ qua.

Nếu lỗi không xử lý ngay, ít nhất phải log hoặc hiển thị trạng thái phù hợp.

---

## 9) Quy tắc refactor để dễ fix bug

Khi sửa một bug, nên đi theo thứ tự:

1. xác định domain
2. xác định file chịu trách nhiệm duy nhất
3. tách logic khỏi UI nếu đang bị dính
4. viết/điều chỉnh test
5. chỉ sửa đúng vùng ảnh hưởng

### Không nên

- sửa nhiều feature cùng lúc nếu bug chỉ nằm ở một feature
- copy logic từ file này sang file khác
- đặt logic API trong JSX

---

## 10) Cách đảm bảo nhất quán giữa các feature

### 10.1 Mẫu cấu trúc dùng chung

Mọi feature lớn nên có pattern tương tự:

```text
feature/
  components/
  hooks/
  services/
  types/
  schemas/
  index.ts
```

### 10.2 Mẫu UI thống nhất

- cùng hệ spacing
- cùng radius/shadow
- cùng typography
- cùng trạng thái button/input

### 10.3 Mẫu data thống nhất

Nếu các domain dùng cùng khái niệm như:

- item
- style
- category
- tag
- source

thì phải dùng cùng naming và cùng meaning.

---

## 11) Quy tắc mở rộng trong tương lai

Khi thêm feature mới, trả lời 5 câu:

1. Feature này thuộc domain nào?
2. Có thể dùng lại cái gì từ `shared/`?
3. Có cần API/service riêng không?
4. Có schema/type riêng không?
5. Có test tối thiểu nào cần thêm không?

Nếu không trả lời rõ được, feature đó đang chưa đủ cấu trúc để implement.

---

## 12) Lộ trình chuẩn hóa repo hiện tại

### Giai đoạn 1

- tách mock data ra ngoài component
- tạo API layer chung
- gom type/schema theo domain

### Giai đoạn 2

- chia lại Wardrobe/Recommender/Trends/Profile/Admin theo feature modules
- đưa các logic lặp vào hooks/services

### Giai đoạn 3

- thêm test theo domain
- chuẩn hóa error/loading/empty states
- hoàn thiện logging và monitoring

### Giai đoạn 4

- kết nối backend thật
- thay dần mock data
- tối ưu caching và performance

---

## 13) Kết luận

Nếu tuân thủ cấu trúc này, dự án sẽ:

- dễ đọc hơn
- dễ sửa bug hơn
- ít phá vỡ feature khác khi update
- dễ onboarding người mới
- dễ tách backend/AI/deploy thành các phần độc lập
