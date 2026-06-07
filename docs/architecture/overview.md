# Architecture Overview

MangaFlow uses:

```txt
Modular Monolith Backend
+ Domain Driven Modules
+ Feature-Based Frontend
+ Separate Python AI Service
```

## System diagram

```txt
React/Vite Frontend
        ↓
Express API
        ↓
MongoDB Atlas + Cloudflare R2 + FastAPI AI Service
```

## Backend principles

- Controller-Service-Repository pattern
- Zod validation
- Mongoose models
- Backend-enforced permissions
- Private signed URLs for files
- Audit critical actions
