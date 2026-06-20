# 01 — Design Tokens

Tất cả tokens sống ở `src/styles.css`. Block `:root` giữ giá trị **light**, block `.dark` ghi đè cho **dark**. Block `@theme inline` map sang utility Tailwind (`bg-*`, `text-*`, `border-*`).

## Bảng màu semantic

| Token                      | Light           | Dark           | Khi nào dùng                  | Class Tailwind                       |
| -------------------------- | --------------- | -------------- | ----------------------------- | ------------------------------------ |
| `--background`             | cream `#F5EFE6` | navy `#0B1F3A` | Nền trang gốc                 | `bg-background`                      |
| `--foreground`             | navy đậm        | trắng ấm       | Text mặc định                 | `text-foreground`                    |
| `--card`                   | trắng           | navy nhạt      | Surface nổi (bảng, stat card) | `bg-card`                            |
| `--primary`                | navy            | trắng          | CTA, panel sidebar, footer    | `bg-primary text-primary-foreground` |
| `--primary-foreground`     | trắng           | navy           | Text trên primary             | –                                    |
| `--secondary` / `--accent` | cream nhạt      | navy nhạt hơn  | Hover, surface phụ            | `bg-accent`                          |
| `--muted`                  | giống accent    | giống accent   | Vùng "lặng"                   | `bg-muted`                           |
| `--muted-foreground`       | navy 45%        | navy 72% sáng  | Subtitle, label phụ           | `text-muted-foreground`              |
| `--border` / `--input`     | cream tối       | trắng 12%      | Đường viền                    | `border-border`                      |
| `--destructive`            | đỏ              | đỏ sáng        | Ban, xoá, lỗi                 | `bg-destructive`                     |
| `--ring`                   | navy            | trắng nhạt     | Focus ring                    | `focus:ring-primary/30`              |

## Brand tokens phụ

| Token                        | Mô tả                                                  |
| ---------------------------- | ------------------------------------------------------ |
| `--navy` / `--navy-soft`     | giá trị nguyên của brand navy, dùng cho gradient riêng |
| `--cream`                    | giá trị nguyên của cream paper                         |
| `--panel` / `--panel-border` | Cho panel translucent đè lên ảnh (Hero, news card)     |

## Radius & font

- `--radius: 0.5rem` → `rounded-md` là default. Card lớn `rounded-md`, pill `rounded-[5px]`, ảnh nhỏ `rounded-sm`.
- `--font-sans: Inter`, `--font-jp: Noto Sans JP`. Body luôn `font-sans` (mặc định). Kanji bọc `.font-jp`.

## Quy tắc dùng token

✅ ĐÚNG

```tsx
<button className="bg-primary text-primary-foreground border border-foreground/15">
```

❌ SAI

```tsx
<button className="bg-[#0B1F3A] text-white border-gray-300">
<div style={{ color: "rgb(11,31,58)" }}>
```

Khi cần độ trong suốt, dùng `/<n>` của Tailwind trên token (`bg-foreground/5`, `border-primary/20`) — KHÔNG tạo biến mới chỉ để tăng/giảm alpha.

## Thêm token mới

1. Thêm vào `:root` (light) + `.dark` (dark) bằng `oklch(...)`.
2. Map trong `@theme inline` block: `--color-<name>: var(--<name>);`.
3. Dùng qua class `bg-<name>` / `text-<name>` / `border-<name>`.
