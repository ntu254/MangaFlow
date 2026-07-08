# UI/UX Consistency Audit - Redo TuaTua AI
**Date**: 2026-06-05  
**Scope**: Toàn bộ UI components, pages, features

---

## 📋 TÓM TẮT FINDINGS

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| **Color Usage** | 0 | 3 | 2 | 1 |
| **Typography** | 0 | 2 | 4 | 2 |
| **Spacing** | 0 | 1 | 3 | 0 |
| **Component Patterns** | 1 | 4 | 3 | 1 |
| **Vietnamese Text** | 0 | 1 | 2 | 0 |
| **Mobile/Responsive** | 0 | 2 | 1 | 0 |
| **TOTAL** | **1** | **13** | **15** | **4** |

---

## 🔴 CRITICAL ISSUES (1)

### 1. Inconsistent inline styles vs Tailwind theme
**Severity**: Critical  
**Impact**: Breaks dark mode, reduces maintainability

**Problem**: 20 files sử dụng `style={{ backgroundColor: c.hex }}` thay vì Tailwind utilities.

**Files affected**:
```
src/features/landing/components/StylePicker.tsx (line 178)
src/features/wardrobe/components/WardrobeUploadModal.tsx (lines 365, 373)
src/features/wardrobe/components/WardrobeItemCard.tsx (line 113)
src/features/wardrobe/components/WardrobeEditModal.tsx (line 127)
src/features/wardrobe/components/WardrobeFilterSidebar.tsx (line 33)
src/features/wardrobe/components/WardrobeAnalysis.tsx (line 139)
src/features/outfit-builder/components/AIStylistReport.tsx (line 179)
src/features/style-profile/pages/StyleProfilePage.tsx (lines 222, 265)
src/features/quiz/pages/QuizPage.tsx (lines 293, 616)
src/features/admin/pages/AdminSettings.tsx (line 154)
src/components/trends/TrendingColors.tsx (line 67)
src/components/profile/ProfileStyleAnalytics.tsx (lines 82, 107)
... và 7 files khác
```

**Recommendation**:
```tsx
// ❌ BAD - không support dark mode
<div style={{ backgroundColor: color }} />

// ✅ GOOD - tạo CSS variable trong Tailwind config
<div className="bg-[var(--dynamic-color)]" style={{ '--dynamic-color': color } as any} />

// ✅ BETTER - Dùng data attribute + CSS
<div data-color={colorName} className="color-swatch" />
```

**Action**: Tạo utility class `color-swatch` trong `index.css` để handle dynamic colors consistently.

---

## 🟠 HIGH PRIORITY ISSUES (13)

### 1. Hardcoded `bg-black` thay vì `bg-foreground`
**Files**: 3 instances
```
src/features/outfit-builder/components/ControlPanel.tsx (lines 132, 175)
src/features/recommender/components/DetailedOutfitSetCard.tsx (line 104)
```

**Problem**: `bg-black/50` không responsive với dark mode.

**Fix**:
```tsx
// ❌ BAD
className="bg-black/50"

// ✅ GOOD
className="bg-foreground/50"
```

---

### 2. Inconsistent button rounded corners
**Severity**: High  
**Impact**: Visual inconsistency across app

**Findings**:
- `components/ui/button.tsx`: `rounded-full` (default)
- `features/outfit-builder/`: `rounded-xl`, `rounded-lg` (custom)
- `features/wardrobe/`: `rounded-md`, `rounded-full` (mixed)

**Files with custom rounding**:
```
src/features/outfit-builder/components/TryOnCanvas.tsx:
  - line 78: rounded-xl
  - line 86: rounded-xl
  - line 122: rounded-xl
  - line 223: rounded-xl
  - line 254: rounded-xl

src/features/outfit-builder/components/ControlPanel.tsx:
  - line 200: rounded-lg

src/features/wardrobe/components/WardrobeUploadModal.tsx:
  - line 407: rounded-md
  - line 416: rounded-md
```

**Recommendation**:
- **Primary CTA buttons**: `rounded-full` (theo design system)
- **Secondary/Outline buttons**: `rounded-full` 
- **Small icon buttons**: `rounded-lg`
- **Form inputs**: `rounded-lg`

**Action**: Standardize về `rounded-full` cho tất cả buttons hoặc tạo variant mới trong `button.tsx`.

---

### 3. Inconsistent text size scales
**Problem**: Quá nhiều custom text sizes không theo type scale.

**Found**:
- `text-[9px]`: 1 instance
- `text-[10px]`: 11 instances  
- `text-[11px]`: 6 instances
- `text-xs` (12px): 50+ instances ✅
- `text-sm` (14px): standard ✅

**Files with non-standard sizes**:
```
src/features/outfit-builder/components/TryOnCanvas.tsx: text-[9px], text-[10px]
src/features/admin/components/UserDetailModal.tsx: text-xs (OK)
src/features/quiz/pages/QuizPage.tsx: text-[10px], text-[11px]
```

**Recommendation**:
```
Micro text (labels, captions): text-[10px] → text-xs (12px)
Small text (buttons, tags): text-xs (12px) ✅
Body text: text-sm (14px) ✅
Headings: text-base, text-lg, text-xl ✅
```

**Action**: Replace all `text-[10px]`, `text-[11px]` với `text-xs` hoặc extend Tailwind config.

---

### 4. Inconsistent spacing patterns
**Problem**: Padding/gap không consistent giữa các components.

**Findings**:
- Card padding: `p-4`, `p-5`, `p-6` (mixed)
- Button padding: `px-4`, `px-5`, `px-6`, `px-8` (mixed)
- Grid gaps: `gap-1`, `gap-2`, `gap-3`, `gap-4` (no standard)

**Examples**:
```tsx
// WardrobeUploadModal: p-6
<DialogContent className="p-6">

// ProfilePage: p-5
<div className="p-5">

// AdminLayout: p-4
<div className="p-4">
```

**Recommendation**:
```
Container padding: p-6 (24px) default
Card padding: p-5 (20px) hoặc p-6
Compact card: p-4 (16px)
Grid gap: gap-4 (16px) default, gap-3 (12px) tight
```

**Action**: Document spacing scale trong design system.

---

### 5. Missing loading states
**Problem**: Nhiều components không có skeleton/loading state.

**Files missing skeletons**:
```
src/features/wardrobe/pages/WardrobePage.tsx
src/features/style-profile/pages/StyleProfilePage.tsx
src/features/trends/pages/TrendsPage.tsx
src/features/admin/pages/AdminDashboard.tsx
```

**Current state**: Hiển thị blank hoặc chỉ có spinner.

**Recommendation**: Thêm `<Skeleton />` component cho:
- Card grids
- List items
- Profile sections
- Charts

**Action**: Import và sử dụng `components/ui/skeleton.tsx` trong loading states.

---

### 6. Empty state không consistent
**Problem**: Mỗi feature có empty state khác nhau.

**Current patterns**:
```tsx
// Recommender: EmptyState component ✅
<EmptyState title="..." description="..." suggestions={[...]} />

// Wardrobe: WardrobeEmptyState component ✅
<WardrobeEmptyState />

// Profile: Custom empty div ❌
<div>Chưa có dữ liệu</div>

// Admin: No empty state ❌
{data.length === 0 && null}
```

**Recommendation**: Tạo shared `<EmptyState />` component với props:
```tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}
```

**Action**: Consolidate vào `src/shared/ui/empty-state.tsx`.

---

### 7. Form validation feedback không nhất quán
**Problem**: Error messages hiển thị khác nhau giữa các forms.

**Patterns found**:
```tsx
// Pattern 1: Toast notification
toast.error("Lỗi xảy ra");

// Pattern 2: Inline error text
<p className="text-destructive text-sm">{error}</p>

// Pattern 3: Alert component
<Alert variant="destructive">{error}</Alert>

// Pattern 4: No error display
catch (err) { console.error(err); }
```

**Recommendation**:
- **Inline validation** (field-level): Red border + error text below input
- **Form submission errors**: Toast notification
- **Critical errors**: Alert banner at top

**Action**: Standardize error handling patterns trong form components.

---

### 8. Vietnamese text quality issues
**Problem**: Mix Việt-Anh, tone không consistent, typos.

**Issues found**:
```tsx
// Mix language trong cùng 1 component
"Upload ảnh của bạn" // ❌
"Tải ảnh lên" // ✅

"Generate outfit" // ❌ English button
"Tạo outfit" // ✅

// Tone không consistent
"Bạn chưa có item nào" // Informal
"Hiện tại chưa có sản phẩm trong tủ đồ" // Formal
```

**Files cần review**:
```
src/features/wardrobe/components/*.tsx (mix Việt-Anh)
src/features/outfit-builder/components/*.tsx (inconsistent tone)
src/features/recommender/components/*.tsx (some English labels)
```

**Recommendation**:
- **Tone**: Informal, friendly ("Bạn chưa có...", "Hãy thử...")
- **Terminology**:
  - "outfit" → "bộ trang phục" hoặc giữ "outfit"
  - "upload" → "tải lên"
  - "generate" → "tạo"
  - "wardrobe" → "tủ đồ"

**Action**: Tạo glossary trong `docs/VIETNAMESE_STYLE_GUIDE.md`.

---

### 9. Button variant overuse
**Problem**: Quá nhiều custom button styles không dùng design system.

**Current button variants** (trong `button.tsx`):
```tsx
default, destructive, outline, secondary, ghost, link,
hero, hero-outline, accent, accent-outline, teal
```

**Custom buttons ngoài design system**:
```tsx
// TryOnCanvas.tsx line 78
className="py-1.5 px-4 rounded-xl text-xs font-body..." // ❌ Custom

// ControlPanel.tsx line 200
className="w-full py-1.5 rounded-lg border..." // ❌ Custom

// ChatSidebar.tsx
className="px-4 py-2.5 rounded-full border..." // ❌ Custom
```

**Recommendation**:
```tsx
// ✅ Use existing variants
<Button variant="outline" size="sm">Label</Button>

// ❌ Avoid custom className overrides
<Button className="py-1.5 px-4 rounded-xl text-xs">Label</Button>
```

**Action**: Refactor custom buttons để dùng variants có sẵn hoặc thêm variant mới.

---

### 10. Modal/Dialog size inconsistency
**Problem**: Dialog `max-w-*` khác nhau không có pattern.

**Found**:
```tsx
max-w-lg (512px) - default dialog
max-w-xl (576px) - some modals
max-w-2xl (672px) - larger modals
max-w-4xl (896px) - outfit builder
max-w-7xl (1280px) - admin modals
```

**Recommendation**:
```
Small dialog (confirm): max-w-sm (384px)
Default dialog: max-w-lg (512px)
Form dialog: max-w-xl (576px)
Content dialog: max-w-2xl (672px)
Full-width: max-w-4xl+ (rare)
```

**Action**: Document modal size guidelines.

---

### 11. Icon size inconsistency
**Problem**: Icons trong cùng context có size khác nhau.

**Examples**:
```tsx
// Button icons
<Upload className="w-4 h-4" /> // Some buttons
<Plus className="w-5 h-5" /> // Other buttons
<Check className="w-3 h-3" /> // Small buttons

// Section icons
<Sparkles className="w-5 h-5" />
<TrendingUp className="w-4 h-4" />
```

**Recommendation**:
```
Button icons: w-4 h-4 (16px)
Section header icons: w-5 h-5 (20px)
Large feature icons: w-6 h-6 (24px)
Tiny indicators: w-3 h-3 (12px)
```

**Action**: Standardize icon sizes.

---

### 12. Hover states không consistent
**Problem**: Một số components có hover animation, một số không.

**Patterns found**:
```tsx
// Pattern 1: Subtle lift
hover:-translate-y-0.5

// Pattern 2: Scale
hover:scale-105

// Pattern 3: Background only
hover:bg-secondary

// Pattern 4: No hover effect
```

**Recommendation**:
```tsx
// Buttons: Lift + background
hover:bg-primary/90 hover:-translate-y-0.5

// Cards: Subtle lift
hover:-translate-y-1 transition-transform

// Links: Underline
hover:underline

// Icon buttons: Background
hover:bg-secondary
```

**Action**: Add consistent hover states to interactive elements.

---

### 13. Focus states missing
**Problem**: Keyboard navigation không rõ ràng.

**Issues**:
- Nhiều custom buttons không có `focus-visible:outline-none focus-visible:ring-2`
- Cards clickable không có focus indicator
- Form inputs có focus ring nhưng color không consistent

**Recommendation**:
```tsx
// Buttons
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2

// Inputs
focus:ring-2 focus:ring-accent focus:border-accent

// Cards/Links
focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
```

**Action**: Audit all interactive elements for keyboard accessibility.

---

## 🟡 MEDIUM PRIORITY ISSUES (15)

### 1. Border radius không consistent
**Files**: Mixed `rounded-lg`, `rounded-md`, `rounded-xl`, `rounded-full`.

**Recommendation**: Standardize theo design system:
```
Cards: rounded-lg (var(--radius) = 24px)
Buttons: rounded-full
Inputs: rounded-lg
Badges/Tags: rounded-full
Images: rounded-md
```

---

### 2. Shadow usage inconsistent
**Problem**: `shadow-sm`, `shadow-md`, `shadow-lg`, custom shadows mixed.

**Current**:
```tsx
shadow-[0_16px_34px_-18px_hsl(var(--primary)/0.28)] // Button
shadow-lg // Dialog
shadow-sm // Card hover
```

**Recommendation**: Define semantic shadows:
```css
--shadow-subtle: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-default: 0 4px 6px -1px rgb(0 0 0 / 0.1)
--shadow-elevated: 0 10px 15px -3px rgb(0 0 0 / 0.1)
--shadow-prominent: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

---

### 3. Z-index không có scale
**Found**: `z-10`, `z-20`, `z-50` random.

**Recommendation**: Define z-index scale:
```css
--z-base: 0
--z-dropdown: 1000
--z-sticky: 1020
--z-fixed: 1030
--z-modal-backdrop: 1040
--z-modal: 1050
--z-popover: 1060
--z-tooltip: 1070
```

---

### 4. Transition timing không consistent
**Found**: `duration-200`, `duration-300`, `transition-all`.

**Recommendation**:
```
Fast interactions: duration-150
Default: duration-200
Smooth animations: duration-300
Slow reveals: duration-500
```

---

### 5. Grid responsive breakpoints inconsistent
**Examples**:
```tsx
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
grid-cols-2 sm:grid-cols-3 md:grid-cols-4
grid-cols-1 sm:grid-cols-2 md:grid-cols-5
```

**Recommendation**: Standardize breakpoint patterns per context.

---

### 6. Vietnamese diacritics rendering
**Problem**: Font fallback có thể render dấu không đẹp.

**Current font stack**:
```css
font-body: 'Be Vietnam Pro', sans-serif ✅ Good
font-heading: 'Playfair Display', Georgia, serif ❌ Georgia không support Việt tốt
```

**Recommendation**: Update fallback:
```css
font-heading: 'Playfair Display', 'Crimson Text', 'Noto Serif', serif
```

---

### 7. Image lazy loading không consistent
**Problem**: Một số `<img>` có `loading="lazy"`, một số không.

**Recommendation**: Add `loading="lazy"` cho tất cả images below fold.

---

### 8. Empty `alt` attributes
**Found**: Nhiều images có `alt=""` hoặc generic alt.

**Recommendation**: 
```tsx
// ❌ BAD
<img alt="image" />
<img alt="" />

// ✅ GOOD
<img alt="Áo khoác denim xanh nhạt" />
<img alt="Phong cách minimal thanh lịch" />
```

---

### 9. Color contrast issues
**Found**: `text-foreground/40` có thể không pass WCAG AA.

**Recommendation**: Minimum contrast ratio 4.5:1 for body text.

---

### 10. Mobile padding inconsistent
**Problem**: Desktop `p-6` nhưng mobile vẫn `p-6` → quá rộng.

**Recommendation**:
```tsx
className="px-4 py-6 md:px-6"
```

---

### 11. Loading spinner không consistent
**Found**: Spinner, "Loading...", skeleton mixed.

**Recommendation**: Use skeleton UI cho content, spinner cho actions.

---

### 12. Error boundary UI missing
**Problem**: Không có fallback UI khi component crash.

**Recommendation**: Add `<ErrorBoundary>` wrapper với friendly error message.

---

### 13. Vietnamese number formatting
**Problem**: `123456` không có separator.

**Recommendation**:
```tsx
// ✅ GOOD
{price.toLocaleString('vi-VN')}đ // 123.456đ
```

---

### 14. Date formatting inconsistent
**Found**: Mix ISO string, relative time, Vietnamese format.

**Recommendation**: Use consistent format:
```
Relative: "2 giờ trước", "3 ngày trước"
Absolute: "05 Th6 2026", "05/06/2026"
```

---

### 15. Truncation không consistent
**Found**: `line-clamp-1`, `line-clamp-2`, `truncate` mixed.

**Recommendation**: Define semantic classes:
```
Product name: line-clamp-2
Description: line-clamp-3
Tag: truncate
```

---

## 🟢 LOW PRIORITY (4)

### 1. Animation performance
**Recommendation**: Use `transform` và `opacity` cho animations (GPU-accelerated).

### 2. Custom scrollbar styling
**Recommendation**: Style scrollbar để match theme colors.

### 3. Print stylesheet
**Recommendation**: Add `@media print` styles cho profile pages.

### 4. Reduced motion support
**Recommendation**: Respect `prefers-reduced-motion` media query.

---

## 🎯 ACTION PLAN

### Phase 1: Critical Fixes (1-2 days)
- [ ] Fix inline `style` colors → CSS variables
- [ ] Replace `bg-black` → `bg-foreground`
- [ ] Standardize button `rounded-*`

### Phase 2: High Priority (3-5 days)
- [ ] Standardize text sizes
- [ ] Add loading skeletons
- [ ] Unify empty states
- [ ] Fix Vietnamese text consistency
- [ ] Refactor custom buttons to use design system
- [ ] Add consistent focus states

### Phase 3: Medium Priority (1 week)
- [ ] Document spacing scale
- [ ] Define z-index scale
- [ ] Standardize shadows
- [ ] Add missing `alt` texts
- [ ] Improve mobile padding

### Phase 4: Polish (Ongoing)
- [ ] Animation polish
- [ ] Accessibility audit
- [ ] Performance optimization

---

## 📚 RECOMMENDATIONS

### 1. Tạo Design System Documentation
File: `docs/DESIGN_SYSTEM.md`

```md
# Design System

## Colors
- Primary actions: bg-foreground text-background
- Secondary actions: bg-secondary
- Destructive: bg-destructive
...

## Typography
- Heading: font-heading (Playfair Display)
- Body: font-body (Be Vietnam Pro)
...

## Spacing Scale
- xs: 0.5rem (8px)
- sm: 0.75rem (12px)
- base: 1rem (16px)
...
```

### 2. Create Component Library Storybook
**Tools**: Storybook hoặc Ladle

**Benefits**:
- Visual regression testing
- Component documentation
- Consistent component usage

### 3. Linter Rules
Add `eslint-plugin-tailwindcss`:

```json
{
  "rules": {
    "tailwindcss/no-custom-classname": "warn",
    "tailwindcss/classnames-order": "warn"
  }
}
```

### 4. CSS-in-JS Audit
**Recommendation**: Migrate tất cả inline styles sang Tailwind hoặc CSS modules.

---

## 📊 METRICS

### Before Audit
- Inline styles: **20+ files**
- Custom button styles: **15+ instances**
- Hardcoded colors: **3 instances**
- Inconsistent text sizes: **18+ instances**
- Missing skeletons: **4 major pages**

### Target After Fixes
- Inline styles: **0 files** (dynamic colors via CSS vars)
- Custom button styles: **0 instances** (all use design system)
- Hardcoded colors: **0 instances**
- Inconsistent text sizes: **0 instances**
- Missing skeletons: **0 pages**

---

## 🔗 RELATED DOCS

- `docs/COLOR_DESIGN.md` - Color usage guidelines
- `docs/ARCHITECTURE_GUIDELINES.md` - Component structure
- `tailwind.config.ts` - Tailwind theme config
- `src/index.css` - Global styles và CSS variables

---

**Reviewed by**: AI Code Audit System  
**Next review**: After Phase 2 completion
