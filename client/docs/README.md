# beachRead — Style System

Tài liệu chuẩn hoá UI để các trang mới (Login, Admin, Reader, Detail, …) giữ nhất quán với trang chủ.

## Triết lý

**Manga editorial.** Cảm hứng từ trang in tạp chí manga: nền giấy kem ấm hoặc mực navy đậm, hình ink-wash dày đặc nhưng vẫn airy, typography đơn sắc, không màu mè.

## Nguyên tắc 1-2-3

- **1 primary color** — navy `#0B1F3A` (light) / trắng (dark). Mọi action chính, panel chính, footer đều dùng nó.
- **2 fonts** — `Inter` cho mọi text Latin; `Noto Sans JP` (class `.font-jp`) cho kanji/kana.
- **3 surface levels** — `background` (nền trang) · `card` (nổi) · `primary` (panel/CTA, luôn đảo màu).

## Triggers (khi nào ÁP DỤNG hay PHÁ luật)

- Theme **luôn** có toggle. Mọi màu phải qua token để dark/light cùng đẹp.
- Không bao giờ hard-code `text-white`, `bg-black`, `bg-[#…]` hay `text-gray-500` trong component.
- Không thêm font/icon set thứ 3 — chỉ Inter + Noto Sans JP + lucide-react.

## Mục lục

1. [Tokens](./01-tokens.md) — biến CSS, mapping Tailwind.
2. [Typography](./02-typography.md) — font, scale, JP usage.
3. [Components](./03-components.md) — Button, Input, Badge, Table, Tabs, Card.
4. [Patterns](./04-patterns.md) — layout sections, hero, sidebar, theme provider.
5. [Checklist](./05-checklist.md) — trước khi merge một trang mới.
