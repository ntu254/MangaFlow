# 05 — Checklist khi thêm trang mới

Trước khi coi một trang là "xong", chạy hết checklist này.

## Layout & spacing

- [ ] Section dùng `mx-auto max-w-[1280px] px-6`.
- [ ] Wrap trang bằng `<div className="page-gradient min-h-screen">` (trừ trang split-screen).
- [ ] Reuse `<Logo />` và `<ThemeToggle />` từ `@/components/site/*`, KHÔNG tạo logo/toggle riêng.

## Theme

- [ ] Đã bọc `<ThemeProvider>` ở component của route.
- [ ] Test cả **light** và **dark** — không có element nào "biến mất" hay không đọc được.
- [ ] Không có `text-white`, `bg-black`, `bg-[#…]`, `text-gray-*` trong file.

## Typography

- [ ] Heading dùng đúng scale (xem `02-typography.md`).
- [ ] Mọi text tiếng Nhật bọc `.font-jp`.
- [ ] Body dày đặc dùng `text-[13px]`, label dùng `text-xs` hoặc `text-[11px]`.

## Component class

- [ ] Button: `h-9` / `h-10`, `rounded-md`, `text-sm font-medium`.
- [ ] Input: `h-10`, border `border-foreground/15`, focus ring `ring-primary/30`.
- [ ] Badge: theo spec ở `03-components.md`.
- [ ] Tabs pill: `rounded-[5px]`, active = `bg-primary text-primary-foreground`.

## Data & state

- [ ] Mock data tách ra `src/data/<feature>.ts` với type rõ ràng (KHÔNG inline trong JSX).
- [ ] Không gọi API trực tiếp trong component — đi qua loader / server-fn nếu có Cloud.

## SEO & route

- [ ] `head()` set `title`, `description`, `og:title`, `og:description` riêng cho route (không copy của trang chủ).
- [ ] Route nằm trong `src/routes/`, đặt tên theo convention TanStack (dot-separated).
- [ ] Trang public dùng `<Link>` của `@tanstack/react-router`, không dùng `<a href>` cho internal nav.

## Ảnh

- [ ] `loading="lazy"` cho mọi ảnh không phải LCP.
- [ ] Import ES6 từ `src/assets`, không URL inline.
- [ ] Cover manga giữ tỉ lệ `aspect-[3/4]`.

## Code

- [ ] Component file < 400 dòng; nếu lớn hơn, tách helper sang `src/components/<feature>/*`.
- [ ] Không thêm dependency mới khi đã có lucide-react / shadcn.
- [ ] `lint` pass.
