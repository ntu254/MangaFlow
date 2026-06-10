# MangaFlow

MangaFlow is a **Manga Creation Workflow and Publishing Management System** for managing the complete manga production pipeline from series proposal to publication, ranking, and assistant payroll tracking.

## What it solves

Manga production requires coordination between Mangaka, Assistants, Tantou Editors, and the Editorial Board. Without a single workflow system, teams lose track of manuscripts, pages, regions, task ownership, revision rounds, comments, approvals, and publication readiness.

MangaFlow centralizes:

- Series proposal and initial manuscript submission
- Tantou Editor review
- Editorial Board approval
- Chapter and page production
- Page workspace with region-based task assignment
- Assistant Task Workspace
- Mangaka review and Editor final approval
- Comment resolution workflow
- Publication readiness
- Ranking and at-risk decisions
- Payroll tracking by task

## MVP boundary

MangaFlow's MVP is an internal production workflow system. Public manga
catalogs, personal libraries, chapter reading, and reading-progress tracking
are outside the MVP.

## Tech stack

- Frontend: React + Vite + TypeScript + ShadCN/ui + Tailwind CSS
- Backend: Node.js + Express + TypeScript + Mongoose
- Database: MongoDB Atlas
- Storage: Cloudflare R2, MinIO for local dev
- AI Service: Python FastAPI with YOLO/OpenCV bubble processing
- Deployment: Vercel for frontend, Railway for backend and AI service

## Cài đặt & Chạy dự án (Quick Start)

Dự án bao gồm 3 phân hệ chính: **Frontend (React)**, **Backend (Node.js)**, và **AI Service (Python)**. 

### 1. Backend (Node.js)

Backend xử lý toàn bộ logic nghiệp vụ, phân quyền, và tương tác với MongoDB, Cloudflare R2.

```bash
cd server
# Cài đặt thư viện
npm install

# Sao chép file biến môi trường và điền thông tin (MongoDB URI, Cloudflare R2 credentials)
cp .env.example .env

# Chạy server ở môi trường dev (auto-reload)
npm run dev
```
> Server sẽ chạy tại: **http://localhost:3001**
> Giao diện Swagger API: **http://localhost:3001/api-docs**

### 2. Frontend (React / Vite)

Giao diện người dùng dành cho Mangaka, Assistant, Editor và Board.

```bash
cd client
# Cài đặt thư viện
npm install

# Mặc định VITE_API_URL sẽ trỏ tới http://localhost:3001
cp .env.example .env

# Chạy web app
npm run dev
```
> Giao diện web chạy tại: **http://localhost:5173**

### 3. AI Service (Python FastAPI)

Service xử lý ảnh manga, nhận diện và xoá chữ trong bong bóng thoại (Bubble Detection/Whitening).
Vui lòng tham khảo chi tiết tại `ai-service/README.md`.

```bash
cd ai-service
# Cài đặt môi trường và thư viện
python -m venv .venv
# Activate venv (Windows: .venv\Scripts\activate | Mac/Linux: source .venv/bin/activate)
pip install -r requirements.txt

# Chạy service
uvicorn app.main:app --reload --host localhost --port 8000
```
> AI Service chạy tại: **http://localhost:8000**
> Swagger của AI: **http://localhost:8000/docs**

See:

- `docs/operations/setup.md`
- `docs/operations/env.md`
- `docs/architecture/overview.md`
- `AGENTS.md`

## Core rule

Editorial Board must approve a Series before Mangaka can create official Chapters.
