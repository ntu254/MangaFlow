# ADR 0001 — Tech Stack

## Status

Accepted

## Decision

Use MERN stack:

- MongoDB
- Express
- React
- Node.js

With:

- TypeScript
- Mongoose
- ShadCN/ui
- Cloudflare R2
- FastAPI AI service

## Reason

MangaFlow has document-oriented workflow data, role-based collaboration, file-heavy entities, and flexible task/comment/version models. MongoDB + Mongoose fits this model better than relational-first designs for MVP speed.
