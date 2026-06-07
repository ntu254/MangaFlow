# Deployment Guide

## Frontend on Vercel

- Set project root to `client`
- Build command: `npm run build`
- Output: `dist`
- Add `VITE_API_BASE_URL`

## Backend on Railway

- Project root: `server`
- Build command: `npm run build`
- Start command: `npm run start`
- Add env variables
- Configure MongoDB Atlas network access
- Configure Cloudflare R2

## AI Service on Railway

- Project root: `ai-service`
- Use Dockerfile
- Expose port 8000
- Set `AI_SERVICE_URL` in backend
