# 0017 Manuscript Upload Signed URL Boundary

Date: 2026-06-08

## Status

Accepted

## Context

MangaFlow needs initial manuscript upload before Series submit can pass. Security rules require private storage and signed URLs, and forbid base64 AI/file payload storage in MongoDB.

## Decision

Initial manuscript upload starts through an owner-only backend action:

- `POST /api/series/:seriesId/manuscripts/uploads`.
- Only the owning Mangaka can request the upload URL.
- Backend returns a private signed upload URL.
- Backend stores only `FileAsset` metadata and `Manuscript` record.
- Every request creates a new manuscript/file version; it does not overwrite previous manuscripts.

## Alternatives Considered

1. Browser-only upload state. Rejected because submit requires backend Manuscript records.
2. Store file bytes/base64 in MongoDB. Rejected by security contract.
3. Allow Editor/Admin upload. Rejected for this story; initial proposal upload stays with owner Mangaka.

## Consequences

Positive:

- Series submit blocker can be satisfied by backend records.
- File storage remains private.
- Owner check is backend-enforced.

Tradeoffs:

- Direct browser PUT to R2 remains manual/out of UI scope.
- Audit logging for file events remains future work.

## Follow-Up

- Add direct PUT UX with progress and retry.
- Add signed download access policy.
- Add audit events for file upload/download.
