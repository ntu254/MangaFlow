# MangaFlow Architecture

## Selected Stack

| Surface | Stack | Target |
| --- | --- | --- |
| Browser client | React, Vite, TypeScript, React Router, TanStack Query, ShadCN/ui, Tailwind CSS, Clerk React SDK | Vercel |
| Mobile client | React Native, Expo, TypeScript | Expo/EAS or companion mobile distribution |
| Backend API | Node.js, Express, TypeScript, MongoDB, Mongoose, Clerk Express SDK | Railway |
| AI service | Python, FastAPI, YOLO11, OpenCV | Separate Railway service |
| Database | MongoDB Atlas M0 | Production database |
| Object storage | Cloudflare R2 in production, MinIO in local development | S3-compatible private storage |

## Repository Shape

```text
client/
  React + Vite browser app

mobile/
  Expo React Native companion app for Editor and Board mobile workflows

server/
  Express + TypeScript modular monolith

ai-service/
  FastAPI service for AI image processing

docs/product/
  Living product contract

docs/stories/
  Story packets and validation evidence
```

## Runtime Boundaries

- The browser client never talks directly to MongoDB, Cloudflare R2, MinIO, or
  the AI service.
- Clerk authenticates users. The client sends a Clerk session token to the
  backend.
- The backend verifies Clerk tokens, maps Clerk identities to internal users,
  enforces role and series permissions, and owns all business mutations.
- The backend owns signed file URL generation and storage metadata.
- The backend calls the AI service for page/bubble processing and maps AI
  results into product records.
- The AI service does not own product authorization, database records, or file
  permissions.

## Backend Module Direction

The backend uses a modular monolith. Each product domain should eventually have
its own model, route, controller, service, repository, validation, and local
types. Business rules live in services and domain/application code; database
queries live in repositories; controllers only parse requests and present
responses.

Initial scaffolding may create only the modules required by the active story.
Do not create empty domain modules unless a story needs them.

## Frontend Module Direction

The frontend uses feature-based routing and component ownership:

- Shared primitives and app-wide components live under shared component
  directories.
- Feature-specific components live with their feature.
- Role dashboards and workspaces are route guarded after auth is implemented.
- Page annotation uses canvas or SVG overlays with normalized coordinates.

## Mobile Module Direction

The mobile client is a companion app, not a full desktop replacement. It should
prioritize fast review and decision confidence for Tantou Editor and Editorial
Board users. Phone workflows cover dashboards, assigned review queues, comment
resolution, publication readiness, board approval, voting, ranking, at-risk
decisions, and notifications. Full page annotation, batch upload, layer
management, and AI batch processing remain desktop-first for MVP.

The mobile client sends Clerk-backed bearer tokens to the same backend API. It
must not send trusted role or permission decisions; backend authorization stays
the source of truth.

## Local Development Defaults

| Surface | Default URL |
| --- | --- |
| Client | `http://localhost:5173` |
| Mobile | Expo Metro dev server |
| Backend API | `http://localhost:5000/api` |
| AI service | `http://localhost:8000` |

## Deployment Defaults

- Frontend deploys to Vercel.
- Backend API deploys to Railway.
- AI service deploys separately to Railway.
- MongoDB Atlas M0 is the MVP database target.
- Cloudflare R2 is the production object store.
- MinIO is the local object-store replacement.
