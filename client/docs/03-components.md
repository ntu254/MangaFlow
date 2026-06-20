# 03 — Components

Mọi component dưới đây là **spec class**. Khi tạo component mới, copy nguyên class string này.

## Button

Kích thước chuẩn: `h-9 px-3` (sm) hoặc `h-10 px-4` (md). Luôn `rounded-md text-sm font-medium`.

```tsx
// Primary (CTA chính)
<button className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90">
  Sign in <ArrowRight className="h-4 w-4" />
</button>

// Secondary / outline
<button className="inline-flex h-9 items-center gap-2 rounded-md border border-foreground/15 bg-foreground/5 px-3 text-sm font-medium text-foreground hover:bg-foreground/10">

// Ghost (icon only)
<button className="flex h-8 w-8 items-center justify-center rounded-md border border-foreground/15 text-foreground/70 hover:text-foreground">
```

## Input

```tsx
<input
  className="h-10 w-full rounded-md border border-foreground/15 bg-background px-3 text-sm text-foreground
             placeholder:text-foreground/35
             focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
/>
```

- Có icon trái → thêm `pl-9`, đặt icon `absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40`.
- Có button phải (eye toggle) → thêm `pr-10`, button `absolute right-2 top-1/2 -translate-y-1/2`.
- Label trên: `<span className="mb-1.5 block text-xs font-medium text-foreground/80">`.

## Checkbox

```tsx
<input
  type="checkbox"
  className="h-3.5 w-3.5 rounded border-foreground/20 accent-[var(--primary)]"
/>
```

## Badge / Chip

Hai biến thể:

```tsx
// Filter chip (Seinen, Drama…)
<span className="rounded-md border border-foreground/20 bg-foreground/5 px-2.5 py-1 text-[11px] text-foreground/80">

// Status / role pill
<span className="inline-flex rounded border border-foreground/20 bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium">
```

## Tabs (pill)

```tsx
<div className="inline-flex rounded-md border border-foreground/15 bg-foreground/5 p-0.5 text-xs">
  <button className="rounded-[5px] bg-primary px-3 py-1 text-primary-foreground">Active</button>
  <button className="rounded-[5px] px-3 py-1 text-foreground/70">Inactive</button>
</div>
```

## Card / Panel

3 cấp:

```tsx
// Surface card (stat, bảng container)
<div className="rounded-md border border-foreground/10 bg-card p-4">

// Primary panel (overlay trên ảnh, sidebar, footer)
<div className="bg-primary text-primary-foreground">

// Glass panel (đè ảnh, dùng cho news bar)
<div className="bg-primary/95 text-primary-foreground">
```

## Table row

```tsx
<div className="grid grid-cols-[…] items-center gap-3 border-b border-foreground/5 px-4 py-3 text-[13px] transition hover:bg-accent/40">
```

Header row: `bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-foreground/55`.

Selected row: `bg-primary/5`.

## Status dot

```tsx
<span className="inline-flex items-center gap-1.5 text-[12px]">
  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
  Active
</span>
```

Màu: `bg-emerald-500` (active), `bg-amber-500` (pending), `bg-destructive` (banned/error).

## Avatar (initials)

```tsx
<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
  TK
</div>
```

## Search box (header)

```tsx
<div className="flex h-8 w-full max-w-[520px] items-center gap-2 rounded-md border border-foreground/15 bg-foreground/5 px-3 text-xs text-foreground/60">
  <Search className="h-3.5 w-3.5" />
  <span>Search…</span>
</div>
```

## Icons

Chỉ dùng `lucide-react`. Size:

- Inline với text: `h-3 w-3` (xs), `h-3.5 w-3.5` (sm), `h-4 w-4` (default).
- StrokeWidth mặc định OK; logo dùng `strokeWidth={2.25}`.
