# 02 — Typography

## Fonts

- **Inter** — `font-sans`, mặc định cho mọi UI Latin. Self-hosted qua `@fontsource/inter` (weights 400/500/600/700/800).
- **Noto Sans JP** — class `.font-jp`, dùng cho kanji/hiragana/katakana và mọi tagline tiếng Nhật.

Không thêm font thứ 3. Nếu cần "display" cảm hứng serif, dùng Inter weight 800 + `tracking-tight`.

## Scale

| Use case                 | Class                                                        | Ghi chú                            |
| ------------------------ | ------------------------------------------------------------ | ---------------------------------- |
| Hero display (landing)   | `text-[112px] font-extrabold leading-[0.95] tracking-tight`  | Chỉ Hero trang chủ                 |
| Page title (Login/Admin) | `text-3xl font-bold tracking-tight`                          | h1                                 |
| Section heading nhỏ      | `text-sm font-semibold`                                      | "Latest Updates", "Recently Added" |
| Stat number              | `text-2xl font-bold`                                         | Stat cards                         |
| Body (dense UI)          | `text-[13px]`                                                | Default cho bảng, list             |
| Label / caption          | `text-xs` hoặc `text-[11px]`                                 | Form labels, meta                  |
| Uppercase eyebrow        | `text-[11px] uppercase tracking-wider text-muted-foreground` | Table head, stat label             |
| Micro                    | `text-[10px]`                                                | Footer copyright, hint             |

## Tiếng Nhật

Luôn bọc trong `.font-jp`. Khi đặt cạnh tiếng Anh trên cùng dòng (vd. tên user `Takezo · 宮本武蔵`), chỉ bọc phần JP:

```tsx
<span className="font-medium">
  Takezo Shinmen <span className="font-jp text-foreground/50">· 宮本 武蔵</span>
</span>
```

Heading hero song ngữ: tiêu đề EN trên (Inter 800), kanji dưới (`.font-jp text-3xl`).

## Tracking & leading

- Heading ≥ 24px → `tracking-tight`.
- Display ≥ 64px → `tracking-tight` + `leading-[0.95]`.
- Body / label → leave default.

## Màu chữ

- Text chính: `text-foreground`.
- Subtitle / mô tả: `text-muted-foreground` (đã có trong token).
- "Lả lướt" trên surface tối: `text-foreground/70`, `text-foreground/55`. Không tự ý dùng hex.
