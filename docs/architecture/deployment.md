# Deployment Architecture

Deployment targets the accepted production-only MVP.

## Frontend

- Vercel

## Backend

- Railway
- Build: `npm run build`
- Start: `npm run start`
- Startup must fail before listening if required env is missing or MongoDB is unavailable.

## AI Service

- Railway separate service
- FastAPI
- Dockerfile
- Production access should be restricted to backend/internal callers; permissive browser CORS is not an accepted production boundary.

## Database

- MongoDB Atlas

## Storage

- Cloudflare R2

## Required production env

See `docs/operations/env.md`.
