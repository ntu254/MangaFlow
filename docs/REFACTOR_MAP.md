# Refactor Map — Current repo to feature-based structure

## Mục tiêu

Tài liệu này map các file hiện tại của repo sang cấu trúc maintainable hơn theo mô hình:

- `app/` cho providers/router/bootstrap
- `shared/` cho code dùng chung
- `features/` cho từng domain

Mục tiêu trước mắt là giữ hành vi hiện tại, nhưng dần dần chuyển logic và dữ liệu khỏi `pages/` và `components/` rời rạc.

---

## 1) Map tổng thể

### App layer

- `src/App.tsx` → `src/app/App.tsx`
- `src/main.tsx` → vẫn giữ ở entry point, nhưng import từ `src/app/App.tsx`
- `src/components/ui/*` → `src/shared/ui/*`
- `src/hooks/*` → `src/shared/hooks/*`
- `src/lib/utils.ts` → `src/shared/lib/utils.ts`

### Feature layers

- `src/pages/Wardrobe.tsx` + `src/components/wardrobe/*` → `src/features/wardrobe/*`
- `src/pages/Recommender.tsx` + `src/components/recommender/*` → `src/features/recommender/*`
- `src/pages/Trends.tsx` + `src/components/trends/*` → `src/features/trends/*`
- `src/pages/Profile.tsx` + `src/components/profile/*` → `src/features/profile/*`
- `src/pages/admin/*` + `src/components/admin/*` → `src/features/admin/*`
- `src/pages/Index.tsx` + `src/components/landing/*` → `src/features/landing/*`
- `src/pages/Login.tsx`, `src/pages/SignUp.tsx`, `src/pages/Quiz.tsx` → `src/features/auth/pages/*`

---

## 2) Map chi tiết theo file hiện tại

### Wardrobe

| Current file | Target |
|---|---|
| `src/pages/Wardrobe.tsx` | `src/features/wardrobe/pages/WardrobePage.tsx` |
| `src/components/wardrobe/WardrobeHeader.tsx` | `src/features/wardrobe/components/WardrobeHeader.tsx` |
| `src/components/wardrobe/WardrobeFilterSidebar.tsx` | `src/features/wardrobe/components/WardrobeFilterSidebar.tsx` |
| `src/components/wardrobe/WardrobeItemCard.tsx` | `src/features/wardrobe/components/WardrobeItemCard.tsx` |
| `src/components/wardrobe/AIOutfitGenerator.tsx` | `src/features/wardrobe/components/AIOutfitGenerator.tsx` |
| `src/components/wardrobe/WardrobeEmptyState.tsx` | `src/features/wardrobe/components/WardrobeEmptyState.tsx` |
| `src/components/wardrobe/WardrobeUploadModal.tsx` | `src/features/wardrobe/components/WardrobeUploadModal.tsx` |
| `src/components/wardrobe/WardrobeUploadArea.tsx` | `src/features/wardrobe/components/WardrobeUploadArea.tsx` |
| `src/components/wardrobe/WardrobeFilters.tsx` | `src/features/wardrobe/components/WardrobeFilters.tsx` |
| inline mock data in `Wardrobe.tsx` | `src/features/wardrobe/data.ts` |
| inline filter types in components | `src/features/wardrobe/types.ts` |
| filter memo logic in page | `src/features/wardrobe/hooks/useWardrobeFilters.ts` |

### Recommender

| Current file | Target |
|---|---|
| `src/pages/Recommender.tsx` | `src/features/recommender/pages/RecommenderPage.tsx` |
| `src/components/recommender/ChatSidebar.tsx` | `src/features/recommender/components/ChatSidebar.tsx` |
| `src/components/recommender/OutfitHeader.tsx` | `src/features/recommender/components/OutfitHeader.tsx` |
| `src/components/recommender/OutfitCard.tsx` | `src/features/recommender/components/OutfitCard.tsx` |
| `src/components/recommender/EmptyState.tsx` | `src/features/recommender/components/EmptyState.tsx` |
| sample outfit data | `src/features/recommender/data.ts` |

### Trends

| Current file | Target |
|---|---|
| `src/pages/Trends.tsx` | `src/features/trends/pages/TrendsPage.tsx` |
| `src/components/trends/*` | `src/features/trends/components/*` |
| static trend data | `src/features/trends/data.ts` |

### Profile

| Current file | Target |
|---|---|
| `src/pages/Profile.tsx` | `src/features/profile/pages/ProfilePage.tsx` |
| `src/pages/StyleProfile.tsx` | `src/features/profile/pages/StyleProfilePage.tsx` |
| `src/components/profile/*` | `src/features/profile/components/*` |

### Admin

| Current file | Target |
|---|---|
| `src/components/admin/AdminLayout.tsx` | `src/features/admin/components/AdminLayout.tsx` |
| `src/components/admin/AdminSidebar.tsx` | `src/features/admin/components/AdminSidebar.tsx` |
| `src/components/admin/StatCard.tsx` | `src/features/admin/components/StatCard.tsx` |
| `src/components/admin/StatusBadge.tsx` | `src/features/admin/components/StatusBadge.tsx` |
| `src/pages/admin/*` | `src/features/admin/pages/*` |

### Landing and auth

| Current file | Target |
|---|---|
| `src/pages/Index.tsx` | `src/features/landing/pages/HomePage.tsx` |
| `src/components/landing/*` | `src/features/landing/components/*` |
| `src/pages/Login.tsx` | `src/features/auth/pages/LoginPage.tsx` |
| `src/pages/SignUp.tsx` | `src/features/auth/pages/SignUpPage.tsx` |
| `src/pages/Quiz.tsx` | `src/features/auth/pages/QuizPage.tsx` |

---

## 3) Phased refactor order

### Phase 1 — Normalize Wardrobe

1. Move Wardrobe data and types to `src/features/wardrobe/`
2. Extract filter logic into a hook
3. Keep current UI components in place, but switch them to feature-layer types

### Phase 2 — Normalize Recommender

1. Move sample data to `features/recommender/data.ts`
2. Add feature types
3. Prepare page for future service integration

### Phase 3 — Normalize Trends and Profile

1. Extract static content/data into feature files
2. Move page-level business logic into hooks or services

### Phase 4 — Move Admin

1. Move admin layout/components/pages into feature folder
2. Centralize admin constants/types

### Phase 5 — Introduce app/shared boundaries

1. Move `ui/`, hooks, utils into `shared/`
2. Add `app/` bootstrap and router composition

---

## 4) First refactor already started

The first concrete refactor started in Wardrobe:

- extracted wardrobe item and filter types
- extracted wardrobe mock data
- extracted filter logic into a reusable hook
- updated Wardrobe page and components to consume feature-layer files

This keeps behavior intact while making the domain easier to maintain and migrate.
