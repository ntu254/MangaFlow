# Environment Variables

## Server

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

MONGODB_URI=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=

ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_FULL_NAME=

AI_SERVICE_URL=http://localhost:8000
```

Rules:

- Production requires `MONGODB_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`.
- Production requires R2 variables when production storage uses R2.
- Development may use safe local defaults only when the code emits explicit warnings.
- Production must not start with weak fallback secrets.
- Optional admin seeding must be env-driven; no hardcoded credential in source.

## Client

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## AI Service

```env
MODEL_PATH=./models/best.pt
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
BACKEND_ORIGIN=http://localhost:5000
```

Rules:

- Frontend should not call the AI service directly in production.
- Production AI CORS, if enabled, should allow backend/internal origin only.
