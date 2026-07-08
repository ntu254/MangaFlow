# Use Cases — User Profile & Account Profile

## Notation
- **UC-USER-{n}** — User-facing use case
- **P0** = MVP startup AI (implement first)
- **P1** = Post-MVP (implement after launch)
- **P2** = Nice-to-have (later iterations)

---

## Nhóm: Authentication

| UC | Name | Mô tả | Priority |
|---|---|---|---|
| 97 | Đăng ký tài khoản | Sign up bằng email; Social login (Google, Apple, TikTok) | P0 |
| 98 | Đăng nhập hệ thống | Login account; Remember session | P0 |
| 99 | Đăng xuất tài khoản | Logout khỏi hệ thống | P0 |
| 100 | Quên mật khẩu | Request password reset; Verify email | P1 |

---

## Nhóm: Hồ sơ cá nhân

| UC | Name | Mô tả | Priority |
|---|---|---|---|
| 101 | Xem hồ sơ cá nhân | Xem avatar, tên, email, username, plan hiện tại | P0 |
| 102 | Chỉnh sửa hồ sơ cá nhân | Update avatar, display name, bio, gender, birthday | P1 |
| 103 | Chỉnh sửa thông tin thời trang | Update size quần áo, height, weight, preferred fit (oversized/slim fit/relaxed fit) | P0 |
| 104 | Cập nhật style preferences | Chọn favorite styles, favorite colors, fashion interests | P0 |

---

## Nhóm: AI Personalization

| UC | Name | Mô tả | Priority |
|---|---|---|---|
| 105 | Cá nhân hóa AI stylist | AI học từ outfit history, wardrobe, saved outfits, trend interactions | P0 |
| 106 | Thiết lập mục tiêu phong cách | Chọn style goals (e.g. "Minimal hơn", "Công sở chuyên nghiệp", "K-Fashion") | P0 |
| 107 | Thiết lập ngân sách thời trang | Set outfit budget, shopping limit | P1 |
| 108 | Thiết lập occasion preferences | Chọn các dịp thường xuyên (đi làm, cafe, gym, party, travel) | P0 |

---

## Nhóm: Subscription & Credits

| UC | Name | Mô tả | Priority |
|---|---|---|---|
| 109 | Xem subscription plan | Xem gói hiện tại, xem quyền lợi | P0 |
| 110 | Nâng cấp gói premium | Upgrade subscription | P0 |
| 111 | Xem AI credits/quota | Xem số lượt generate còn lại | P0 |
| 112 | Xem lịch sử thanh toán | View payment history, download invoice | P1 |

---

## Nhóm: Saved Content

| UC | Name | Mô tả | Priority |
|---|---|---|---|
| 113 | Xem outfit đã lưu | Browse saved outfits | P0 |
| 114 | Xem inspiration đã lưu | Browse saved inspirations | P1 |
| 115 | Xem wardrobe statistics | Xem số lượng item, favorite styles, most worn items | P1 |

---

## Nhóm: Notifications

| UC | Name | Mô tả | Priority |
|---|---|---|---|
| 116 | Quản lý notification settings | Enable/disable notifications | P0 |
| 117 | Chọn loại notification muốn nhận | Trend alerts, outfit suggestions, promotions, plan reminders | P0 |

---

## Nhóm: Privacy & Security

| UC | Name | Mô tả | Priority |
|---|---|---|---|
| 118 | Đổi mật khẩu | Update password | P1 |
| 119 | Bật bảo mật 2 lớp | Enable 2FA | P2 |
| 120 | Quản lý thiết bị đăng nhập | Xem active sessions, logout devices | P2 |
| 121 | Quản lý quyền riêng tư | Public/private profile, data sharing settings | P1 |
| 122 | Xóa tài khoản | Request account deletion | P1 |

---

## Nhóm: AI & Data

| UC | Name | Mô tả | Priority |
|---|---|---|---|
| 123 | Xem dữ liệu AI đã học | View personalization data | P1 |
| 124 | Reset AI preference | Reset recommendation profile | P1 |
| 125 | Export dữ liệu cá nhân | Download account data | P2 |

---

## Startup AI thật — ưu tiên MVP (P0)

1. **AI personalization** (105) — cốt lõi của stylist AI
2. **Subscription** (109, 110) — monetization
3. **Credits/quota** (111) — usage tracking
4. **Style preferences** (104) — input cho AI
5. **Notification settings** (116, 117) — retention
6. **Saved outfits** (113) — personal wardrobe
7. **Occasion preferences** (108) — context-aware AI
8. **Style goals** (106) — direction cho AI
9. **Fashion info** (103) — sizing/fit cho gợi ý
10. **Auth** (97, 98, 99) — fundamental

## KHÔNG cần ở MVP

- Social follower system
- Public profile feed
- Fashion ranking
- User forum
- Messaging system
- Livestream profile
- 2FA (UC-119)
- Device management (UC-120)
- Data export (UC-125)
