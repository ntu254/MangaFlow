# ADR 0002 — Auth Strategy

## Status

Accepted

## Decision

Do not use Clerk. Use custom auth with email/password, JWT access token, refresh token, and optional Google OAuth.

## Reason

MangaFlow requires Admin-created users, strict role assignment, Board/Editor permissions, and custom workflow membership rules. Custom auth keeps permission logic fully controlled by backend.
