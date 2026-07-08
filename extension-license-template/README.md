# Extension License Protection Template

Đây là bộ mã nguồn mẫu giúp bảo mật Chrome Extension của bạn sử dụng License Key và Supabase.

## Các bước triển khai:

1. **Thiết lập Database Supabase:**
   - Mở file `supabase_setup.sql` và copy toàn bộ nội dung.
   - Dán vào SQL Editor trên giao diện Dashboard của Supabase và ấn Run.
   - Sau đó, vào bảng `licenses` để tạo một vài key (vd: `VIP-KEY-001`) để test.

2. **Cấu hình Extension:**
   - Mở file `background.js`
   - Sửa 2 biến `SUPABASE_URL` và `SUPABASE_ANON_KEY` thành thông tin của project Supabase của bạn (Lấy trong phần Settings -> API).

3. **Bảo mật file mã nguồn (Quan trọng!)**
   Trước khi đóng gói file gửi cho khách hàng, bạn PHẢI mã hóa (obfuscate) file code để khách không tự sửa được:
   - Cài đặt obfuscator: `npm install javascript-obfuscator -g`
   - Mã hóa: 
     ```bash
     javascript-obfuscator popup.js --output popup.js
     javascript-obfuscator background.js --output background.js
     ```

4. **Đóng gói:**
   Nén tất cả các file (`manifest.json`, `popup.html`, `popup.js`, `background.js`) thành 1 file ZIP và gửi cho khách!
