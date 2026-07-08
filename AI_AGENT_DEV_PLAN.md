# Kế hoạch Phát triển AI Agent (Tích hợp FastAPI & Supabase)

Dự án: **TuaTua AI - Fashion Support Agents**
Mục tiêu: Chuyển đổi mã nguồn AI từ dạng script CLI (chạy local) thành một API Microservice độc lập, giao tiếp mượt mà với Web App (React) và Database (Supabase).

## Giai đoạn 1: Chuyển đổi Kiến trúc từ CLI sang API (FastAPI)
Hiện tại, Agent đang chạy tương tác trực tiếp qua Terminal. Chúng ta cần bọc lại thành một API Server.

- [ ] **Cài đặt FastAPI:** Thêm `fastapi`, `uvicorn`, và `pydantic` vào file `requirements.txt`.
- [ ] **Khởi tạo Router (`main.py`):** Tạo file `main.py` làm entry point để khởi chạy server FastAPI.
- [ ] **Xây dựng API Endpoint `/chat`:**
  - **Input:** Nhận payload gồm `user_id`, `session_id`, `message`, `image_url` (nếu có).
  - **Logic:** Chuyển tiếp dữ liệu vào `root_agent` của Google ADK.
  - **Output:** Trả về JSON chứa câu trả lời của AI.
- [ ] **Xây dựng API Endpoint `/analyze-wardrobe`:**
  - **Input:** Nhận file ảnh quần áo (upload) hoặc URL.
  - **Logic:** Gọi luồng xử lý hình ảnh (Background Removal) và đưa vào `wardrobe_analyzer_agent`.
  - **Output:** Trả về JSON định dạng chuẩn hóa (màu sắc, kiểu dáng, chất liệu, danh mục).

## Giai đoạn 2: Dịch chuyển Vector Database (Từ Chroma sang Supabase `pgvector`)
Loại bỏ cơ sở dữ liệu cục bộ ChromaDB (`./vector_db`) để tránh mất dữ liệu khi deploy, đồng bộ hóa kho dữ liệu RAG lên Cloud.

- [ ] **Thiết lập Supabase DB:** Kích hoạt extension `vector` (pgvector) trên cơ sở dữ liệu Supabase.
- [ ] **Tạo bảng lưu trữ Embeddings:**
  - Tạo bảng `rag_products` với các cột: `id`, `metadata` (JSONB), và `embedding` (vector 768 chiều).
- [ ] **Cập nhật Data Pipeline (`data_pipeline.py`):**
  - Chuyển logic từ việc ghi vào ChromaDB sang dùng Supabase Python Client (`supabase-py`) để insert dữ liệu và vector.
- [ ] **Cập nhật RAG Tool (`tools.py`):**
  - Viết lại hàm `search_products_via_rag`: Thay vì query vào biến cục bộ Chroma, tool này sẽ gọi một hàm RPC (Remote Procedure Call) trên Supabase để thực thi tìm kiếm Semantic Search và lấy Top 5 kết quả.

## Giai đoạn 3: Quản lý Ngữ cảnh Động (Dynamic Context & Memory)
Giúp AI "nhớ" được người dùng đang tương tác là ai, họ có phong cách gì và đang có sẵn những gì trong tủ đồ.

- [ ] **Tích hợp Database Context:** Trước khi FastAPI đẩy tin nhắn cho `root_agent`, hệ thống phải query vào bảng `wardrobes` trên Supabase (dựa trên `user_id`) để lấy danh sách quần áo hiện có.
- [ ] **Cập nhật System Prompt (`prompt.py`):**
  - Cấu hình Prompt linh hoạt. Chèn thêm biến động vào hướng dẫn: *"Tủ đồ của user hiện có: [Data từ DB]. Hãy phối đồ dựa trên danh sách này."*
- [ ] **Quản lý Session Hội thoại:**
  - Sử dụng cơ chế lưu lịch sử (Chat History) gắn với `session_id` để AI duy trì bối cảnh (Ví dụ: Hỏi tiếp về bộ outfit vừa được tư vấn).

## Giai đoạn 4: Đóng gói (Dockerize) & Triển khai (Deploy)
Đưa API lên môi trường production để các Edge Functions của Supabase hoặc Frontend React có thể gọi qua Internet.

- [ ] **Tạo Dockerfile:**
  - Sử dụng Base Image: Python 3.10-slim.
  - Khai báo cài đặt các thư viện hệ thống cần thiết (đặc biệt là cho OpenCV và `rembg`).
  - Copy mã nguồn và chạy lệnh khởi động Uvicorn.
- [ ] **Thiết lập Biến môi trường (.env):**
  - Đảm bảo tách biệt và bảo mật: `GOOGLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] **Triển khai lên Cloud:**
  - Deploy Docker container này lên các nền tảng tối ưu cho AI Service như **Google Cloud Run**, **Render**, hoặc **Railway**.
  - Lấy URL API cuối cùng để tích hợp vào Web App.
