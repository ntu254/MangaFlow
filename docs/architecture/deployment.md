# Deployment Architecture

Deployment targets the accepted production-only MVP.

## Frontend

- Vercel

## Backend

- Railway
- Build: `npm run build`
- Start: `npm run start`

## AI Service

- Railway separate service
- FastAPI
- Dockerfile

## Database

- MongoDB Atlas

## Storage

- Cloudflare R2

## Required production env

See `docs/operations/env.md`.
