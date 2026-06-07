# MangaFlow Project Understanding

## Overview
MangaFlow is a Manga Creation Workflow and Publishing Management System for managing the complete manga production pipeline from series proposal to publication, ranking, and assistant payroll tracking.

## Tech Stack
- Frontend: React + Vite + TypeScript + ShadCN/ui + Tailwind CSS
- Backend: Node.js + Express + TypeScript + Mongoose
- Database: MongoDB Atlas
- Storage: Cloudflare R2, MinIO for local dev
- AI Service: Python FastAPI with YOLO/OpenCV bubble processing
- Deployment: Vercel for frontend, Railway for backend and AI service

## Core Workflow
```
Admin creates users
→ Mangaka creates Series
→ Mangaka uploads initial Manuscript
→ Tantou Editor reviews
→ Editorial Board votes
→ Series approved
→ Mangaka creates Chapter
→ Mangaka uploads Pages
→ Mangaka/Editor creates Regions
→ Mangaka/Editor assigns Tasks
→ Assistant works and submits
→ Mangaka reviews
→ Editor final approves
→ Chapter readiness check
→ Publication
→ Ranking import
→ At-risk decision
→ Payroll tracking
```

## Key Invariants
1. **Board approval gate**: Series status must be APPROVED/ONGOING/AT_RISK before Chapter can be created
2. **Assistant access**: Assistant access is task-based (SeriesMember ASSISTANT = eligible for task assignment, Task.assignedTo = actual workspace access)
3. **Review flow**: Assistant Submit → Mangaka Review → Editor Final Approval
4. **Publication requirements**: Chapter cannot be published unless all pages uploaded, all tasks approved, all submissions approved, all comments resolved, Editor final approval exists, and publication date exists
5. **File handling**: Store original file unchanged, use private storage, access by signed URL, do not store base64 AI output in DB

## Architecture
- Modular Monolith Backend with Domain Driven Modules
- Feature-Based Frontend
- Separate Python AI Service
- Controller-Service-Repository pattern
- Zod validation
- Mongoose models
- Backend-enforced permissions
- Private signed URLs for files
- Audit critical actions

## Database Collections
User, RefreshToken, Series, SeriesMember, Manuscript, Chapter, Page, FileAsset, Region, Annotation, TaskType, Task, Submission, Comment, BoardMember, BoardVote, BoardDecision, Publication, Ranking, AssistantEarning, AIResult, BubbleTranslation, Notification, AuditLog

## API Groups
/auth, /admin/users, /task-types, /series, /series/:seriesId/members, /manuscripts, /chapters, /pages, /files, /regions, /tasks, /submissions, /comments, /board, /publications, /rankings, /payroll, /ai, /notifications, /dashboard