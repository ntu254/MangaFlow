# Storage Architecture

## Provider

- Production: Cloudflare R2
- Local: MinIO

## File variants

- ORIGINAL: unchanged
- AI_COPY: max 2048px width
- PREVIEW: max 1600px width
- THUMBNAIL: 300px width
- WHITENED: AI whitened output
- RENDERED: final translated output

## Rules

- Store original file.
- Private storage only.
- Never expose drafts publicly.
- Use signed URLs.
- Signed URL retrieval must pass backend file access policy.
- Do not store base64 image output in MongoDB.
- Backend persists file/object references, not raw base64 payloads.
