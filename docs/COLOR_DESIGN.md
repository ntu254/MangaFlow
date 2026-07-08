# Redo TuaTua AI — Color Design System

## Palette tổng quan

| Token | HSL | Hex | Vai trò |
|---|---|---|---|
| **background** | `36 100% 98%` | `#fefcf8` | Nền chính, off-white ấm |
| **foreground** | `218 32% 21%` | `#2d3548` | Text chính, charcoal xanh nhẹ |
| **card** | `0 0% 100%` | `#ffffff` | Nền card/panel |
| **card-foreground** | `218 32% 21%` | `#2d3548` | Text trên card |
| **primary** | `214 68% 42%` | `#2c6fb5` | Action chính (buttons, links) |
| **primary-foreground** | `36 100% 98%` | `#fefcf8` | Text trên primary |
| **secondary** | `34 68% 93%` | `#f4e8db` | Nền phụ, beige ấm |
| **secondary-foreground** | `216 24% 28%` | `#343d47` | Text trên secondary |
| **muted** | `34 42% 95%` | `#f2ece5` | Nền phụ nhẹ hơn, placeholder |
| **muted-foreground** | `217 14% 43%` | `#666d7a` | Text phụ, placeholder, captions |
| **accent** | `24 92% 64%` | `#f27830` | Nhấn mạnh — giá tiền, CTA, hot actions |
| **accent-foreground** | `0 0% 100%` | `#ffffff` | Text trên accent |
| **destructive** | `0 68% 58%` | `#d94444` | Lỗi, xóa, nguy hiểm |
| **destructive-foreground** | `0 0% 100%` | `#ffffff` | Text trên destructive |
| **border** | `32 30% 85%` | `#d9d0c3` | Border chính |
| **input** | `32 30% 85%` | `#d9d0c3` | Border input |
| **ring** | `24 92% 64%` | `#f27830` | Focus ring (= accent) |

## Semantic colors

| Token | HSL | Hex | Dùng cho |
|---|---|---|---|
| **teal** | `188 60% 44%` | `#30a0b8` | Status tích cực, AI, thành công |
| **teal-light** | `190 72% 92%` | `#d8f1f5` | Nền teal nhẹ |
| **coral** | `24 92% 64%` | `#f27830` | = accent |
| **coral-light** | `28 100% 93%` | `#ffeee0` | Nền coral nhẹ |
| **mint** | `188 60% 44%` | `#30a0b8` | = teal |
| **mint-light** | `190 72% 92%` | `#d8f1f5` | = teal-light |
| **charcoal** | `218 32% 21%` | `#2d3548` | = foreground |
| **off-white** | `36 100% 99%` | `#fdfbf7` | = background |
| **silver** | `34 22% 89%` | `#c9c0b5` | Border phụ |

## Platform brand colors

| Platform | Hex | Tailwind class |
|---|---|---|
| Shopee | `#EE4D2D` | `text-shopee`, `bg-shopee/8` |
| TikTok Shop | `#FF0050` | `text-tiktok`, `bg-tiktok/8` |

## Dark mode overrides

| Token | Light | Dark | Hex (dark) |
|---|---|---|---|
| background | `36 100% 98%` | `217 42% 11%` | `#151b27` |
| foreground | `218 32% 21%` | `204 100% 96%` | `#f0f7ff` |
| card | `0 0% 100%` | `217 38% 13%` | `#1a2130` |
| primary | `214 68% 42%` | `204 100% 96%` | `#f0f7ff` |
| secondary | `34 68% 93%` | `216 24% 18%` | `#262e38` |
| muted | `34 42% 95%` | `216 24% 18%` | `#262e38` |
| border | `32 30% 85%` | `216 22% 22%` | `#303742` |

## Nghiệp vụ sử dụng

### accent — chỉ dùng cho:
- Giá tiền (`text-foreground` trên card, `text-accent` trên giá highlight)
- Active state trên filter/chip (`bg-foreground/10 text-foreground`)
- CTA chính khi cần nổi bật (`bg-foreground text-background` là default)

### foreground — dùng cho:
- Text chính mọi nơi
- Buttons (`bg-foreground text-background`)
- Icons chính

### muted-foreground — dùng cho:
- Placeholder text
- Captions, labels phụ
- Timestamps, metadata

### secondary — dùng cho:
- Nền panel/card nhẹ (`bg-secondary/40`)
- Tag pills (`bg-secondary/50`)
- Nền input khi không có border

### destructive — dùng cho:
- Nút xóa, logout
- Error banners
- Warning states

## Border radius system

| Token | Giá trị | Dùng cho |
|---|---|---|
| `rounded-md` | `calc(24px - 2px) = 22px` | Input, select, button nhỏ |
| `rounded-xl` | `24px` | Cards, modal content |
| `rounded-2xl` | `24px + 8px` | Dialogs, modals lớn |

> **Không dùng:** `rounded-full`, `rounded-[22px]`, `rounded-[32px]`, `rounded-[36px]`, `rounded-[40px]`

## Typography + Color pairings

| Element | Font | Weight | Color | Size |
|---|---|---|---|---|
| H1 | Playfair Display | `font-semibold` | `text-foreground` | `text-4xl` → `text-5xl` → `text-6xl` → `text-7xl` |
| H2 | Playfair Display | `font-semibold` | `text-foreground` | `text-2xl` → `text-3xl` → `text-4xl` |
| H3 | Playfair Display | `font-semibold` | `text-foreground` | `text-xl` → `text-2xl` |
| Body | Be Vietnam Pro | `font-normal` | `text-foreground` | `text-sm` → `text-base` |
| Body small | Be Vietnam Pro | `font-normal` | `text-muted-foreground` | `text-xs` → `text-sm` |
| Label | Be Vietnam Pro | `font-medium` | `text-foreground` | `text-sm` |
| Caption | Be Vietnam Pro | `font-medium` | `text-muted-foreground` | `text-xs` → `text-[11px]` |
| Price | Be Vietnam Pro | `font-semibold` | `text-foreground` | `text-sm` → `text-base` |
| Badge/Tag | Be Vietnam Pro | `font-medium` | `text-foreground` | `text-[10px]` → `text-[11px]` |

## Spacing rhythm

```
Container padding:  px-6 (24px)
Section gap:        space-y-12 md:space-y-16 (48px → 64px)
Card padding:       p-6 (24px) → p-8 (32px) cho hero
Card gap:           gap-4 (16px) → gap-6 (24px) cho sections
Element gap:        gap-2 (8px) → gap-3 (12px) cho inline items
```

## Shadows

| Token | Dùng cho |
|---|---|
| `shadow-sm` | Card hover (`hover:shadow-sm`) |
| `shadow-xl` | Modal backdrop |

> **Không dùng:** `shadow-[0_*px_...]` custom shadows

## Examples

### Button primary
```tsx
className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium"
// hoặc khi cần CTA nổi bật:
className="bg-foreground text-background rounded-md px-6 h-11 text-sm font-semibold"
```

### Card
```tsx
className="bg-card rounded-xl p-6"
```

### Tag pill
```tsx
className="bg-secondary/50 text-muted-foreground rounded-md px-2.5 py-1 text-[10px] font-medium"
```

### Active chip
```tsx
className="bg-foreground/10 text-foreground rounded-md px-3 py-2 text-xs font-medium"
```

### Inactive chip
```tsx
className="bg-secondary/50 text-foreground/55 hover:text-foreground hover:bg-secondary rounded-md px-3 py-2 text-xs font-medium"
```

### Input
```tsx
className="bg-card rounded-md px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10"
```
