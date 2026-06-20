# Git Workflow Rules

## 1. Nguyên tắc chính

Không code trực tiếp trên `main` hoặc `dev`.

Mỗi task phải tạo một nhánh riêng từ `dev`.

Luồng chuẩn:

```text
pull dev mới nhất
→ tạo nhánh task
→ code
→ test/build pass
→ commit
→ push
→ tạo PR/MR vào dev
→ review và merge
→ pull dev mới nhất
→ tạo nhánh mới cho task tiếp theo
```

---

## 2. Quy tắc đặt tên nhánh

Dùng chữ thường, ngắn gọn, rõ chức năng.

```bash
feat/create-series        # chức năng mới
fix/login-error           # sửa lỗi
ui/mangaka-dashboard      # chỉnh giao diện
refactor/series-service   # tối ưu code
chore/setup-env           # cấu hình, setup, dependency
```

Không đặt tên mơ hồ như:

```bash
test
abc
update
fixbug
final
```

---

## 3. Bắt đầu task mới

Luôn cập nhật `dev` trước khi tạo nhánh mới.

```bash
git checkout dev
git pull origin dev
git checkout -b feat/task-name
```

Ví dụ:

```bash
git checkout -b feat/create-series
git checkout -b fix/login-error
git checkout -b ui/series-detail
```

---

## 4. Sau khi code xong

Kiểm tra thay đổi:

```bash
git status
```

Add và commit:

```bash
git add .
git commit -m "feat: add create series page"
```

Ví dụ commit message:

```bash
feat: add chapter management
fix: resolve login error
ui: update mangaka dashboard
refactor: clean series service
chore: update env config
```

---

## 5. Kiểm tra trước khi push

Chạy các lệnh kiểm tra nếu project có hỗ trợ:

```bash
npm run lint
npm run build
npm test
```

Nếu chưa có test hoặc lint thì ít nhất nên chạy:

```bash
npm run build
```

Chỉ push và tạo PR/MR khi code không lỗi build nghiêm trọng.

---

## 6. Push và tạo PR/MR

Push nhánh lên remote:

```bash
git push origin feat/task-name
```

Tạo Pull Request / Merge Request:

```text
feat/task-name → dev
```

Không merge trực tiếp vào `main`.

PR/MR nên ghi rõ:

```text
Title: feat: add create series page

Description:
- Add create series UI
- Add form validation
- Connect API
- Build passed
```

---

## 7. Sau khi PR/MR được merge

Quay lại `dev` và cập nhật code mới nhất:

```bash
git checkout dev
git pull origin dev
```

Xoá nhánh cũ nếu không dùng nữa:

```bash
git branch -d feat/task-name
```

Sau đó tạo nhánh mới cho task tiếp theo:

```bash
git checkout -b feat/next-task
```

---

## 8. Khi `dev` có code mới trong lúc đang làm task

Cập nhật `dev` trước:

```bash
git checkout dev
git pull origin dev
```

Quay lại nhánh đang làm và merge `dev` vào:

```bash
git checkout feat/task-name
git merge dev
```

Nếu có conflict thì sửa conflict, sau đó:

```bash
git add .
git commit -m "chore: resolve merge conflict"
```

---

## 9. Những điều không được làm

* Không code trực tiếp trên `main`.
* Không code trực tiếp trên `dev`.
* Không commit file `.env`.
* Không commit API key, token, password hoặc secret key.
* Không gộp nhiều task không liên quan vào một nhánh.
* Không push code lỗi build mà không báo team.

---

## 10. Checklist trước khi tạo PR/MR

```text
[ ] Nhánh được tạo từ dev mới nhất
[ ] Code đúng task được giao
[ ] Không còn console.log/debug thừa
[ ] Không commit .env hoặc secret key
[ ] Đã chạy build/lint/test nếu có
[ ] Commit message rõ ràng
[ ] PR/MR target là dev
```

---

## 11. Tóm tắt nhanh

```bash
git checkout dev
git pull origin dev
git checkout -b feat/task-name

# code...

git add .
git commit -m "feat: describe task"
npm run build
git push origin feat/task-name
```

Tạo PR/MR:

```text
feat/task-name → dev
```

Sau khi merge:

```bash
git checkout dev
git pull origin dev
git branch -d feat/task-name
git checkout -b feat/next-task
```
