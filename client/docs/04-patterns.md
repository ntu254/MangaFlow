# 04 — Patterns

## Section container

Mọi section trang public dùng:

```tsx
<section className="mx-auto max-w-[1280px] px-6 pt-10">
```

`pt-*` thay đổi tuỳ section (Hero 24, Latest Updates 12, etc.). KHÔNG đổi `max-w` hay padding ngang.

## Page gradient

Class `page-gradient` đã define sẵn trong `styles.css`, tự đổi theo light/dark. Wrap toàn trang:

```tsx
<div className="page-gradient min-h-screen">
```

## Hero pattern (landing/login)

- Ảnh full-bleed nền, opacity 0.9 light / 0.7 dark, `mix-blend-multiply` light / `mix-blend-screen` dark để hoà nền giấy/mực.
- Overlay 2 gradient: `from-background via-background/60 to-transparent` (ngang) + `from-transparent to-background` (dọc dưới) → text bên trái luôn đọc rõ và hero fade mượt vào section sau.
- Heading dùng scale display (xem Typography).

## Split-screen pattern (login/auth)

```
[ left: image + brand   ][ right: page-gradient + form 380px ]
```

- Trái: `hidden md:block`, `bg-primary` + ảnh + gradient `from-primary via-primary/70 to-transparent`.
- Phải: `page-gradient`, form căn giữa `max-w-[380px]`, ThemeToggle góc trên-phải absolute.

## Featured card (landing)

Cover trái 160px + panel `bg-primary text-primary-foreground` phải:

```tsx
<div className="flex overflow-hidden rounded-md">
  <img className="h-[230px] w-[160px] object-cover" />
  <div className="flex-1 bg-primary p-4 text-primary-foreground">…</div>
</div>
```

## News card

Ảnh full + thanh `bg-primary/95` đè dưới chứa tiêu đề + chevron.

## Admin layout

```
[ sidebar 240px primary ][ topbar 56px + main page-gradient/background ]
```

- Sidebar `sticky top-0 h-screen bg-primary text-primary-foreground`.
- Nav item active: `bg-primary-foreground/10` + thanh `bg-primary-foreground` `w-0.5 h-5` góc trái (absolute).
- Topbar: breadcrumb trái, search + theme toggle + primary CTA phải.

Khi dùng shadcn `Sidebar` (sau này có route phức tạp hơn), wrap bằng `SidebarProvider` ở `__root.tsx`. Hiện tại layout admin là static để giữ kiểm soát class trực tiếp.

## Theme provider

Mọi route gốc render UI có toggle phải bọc:

```tsx
component: () => (
  <ThemeProvider>
    <Page />
  </ThemeProvider>
),
```

`ThemeProvider` (`src/lib/theme.tsx`):

- Lưu vào `localStorage` key `br-theme`.
- Apply class `dark` lên `<html>`.
- Default: `dark`.

Để toggle dùng component dùng chung:

```tsx
import { ThemeToggle } from "@/components/site/ThemeToggle";
```

## Logo

```tsx
import { Logo } from "@/components/site/Logo";
<Logo />;
```

Auto đảo màu theo `currentColor` của parent → đặt trong `bg-primary text-primary-foreground` cũng đẹp.

## Image

- `loading="lazy"` cho mọi ảnh trừ LCP (Hero của route).
- Cover manga: tỉ lệ `aspect-[3/4]`. Hero: `object-cover object-center`.
- Ảnh đặt trong `src/assets`, import ES6, KHÔNG để URL chuỗi inline.

## Animation

Tối giản. Hover dùng `transition` mặc định Tailwind. Không thêm framer-motion trừ khi có yêu cầu rõ.
