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

## Quick start

```bash
git clone <repo-url>
cd MangaFlow
cp server/.env.example server/.env
cp client/.env.example client/.env
npm install
npm run dev
```

See:

- `docs/operations/setup.md`
- `docs/operations/env.md`
- `docs/architecture/overview.md`
- `AGENTS.md`

## Core rule

Editorial Board must approve a Series before Mangaka can create official Chapters.
