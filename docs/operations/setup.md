# Setup Guide

## Requirements

- Node.js LTS
- npm
- MongoDB Atlas account or local MongoDB
- Cloudflare R2 account or MinIO local
- Python 3.10+ for AI service

## Install

```bash
git clone <repo-url>
cd MangaFlow

cd server
npm install
cp .env.example .env

cd ../client
npm install
cp .env.example .env
```

## Run

```bash
# terminal 1
cd server
npm run dev

# terminal 2
cd client
npm run dev

# terminal 3
cd ai-service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
