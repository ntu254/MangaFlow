# MangaFlow

## Pham vi MVP

MVP chi phuc vu quy trinh san xuat noi bo. Danh muc manga cong khai, thu vien
ca nhan, doc chapter va theo doi tien do doc khong thuoc MVP.

MangaFlow là hệ thống quản lý quy trình sáng tác, sản xuất và xuất bản manga.

Hệ thống hỗ trợ các vai trò:

- Admin
- Mangaka
- Assistant
- Tantou Editor
- Editorial Board

## Mục tiêu

MangaFlow giúp quản lý toàn bộ luồng:

```txt
Mangaka tạo Series
→ Upload bản thảo sơ bộ
→ Editor review
→ Board vote approve
→ Mangaka tạo Chapter
→ Upload Pages
→ Tạo Region
→ Giao Task cho Assistant
→ Assistant Submit
→ Mangaka duyệt
→ Editor duyệt cuối
→ Check Publication Readiness
→ Publish
→ Ranking
→ Payroll tracking
```

## Stack

- React + Vite + ShadCN/ui
- Express + TypeScript + Mongoose
- MongoDB Atlas
- Cloudflare R2
- Python FastAPI AI Service
- Deploy frontend lên Vercel, backend/API lên Railway

## Luật nghiệp vụ quan trọng

- Không dùng Clerk.
- Admin tạo user và phân quyền.
- Board approve Series trước thì mới tạo Chapter.
- Assistant phải được thêm vào Production Team trước khi được assign task.
- Assistant chỉ thấy Task Workspace của task được giao.
- Task có thể có context pages dạng read-only.
- Editor final approval là bước duyệt cuối trước publication readiness.
