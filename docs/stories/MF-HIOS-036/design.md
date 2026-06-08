# Design

## Domain Model

- `Manuscript`: immutable upload version linked to Series and uploader.
- `FileAsset`: private object metadata; no base64/file bytes stored.

## Application Flow

1. Authenticated Mangaka calls `POST /api/series/:seriesId/manuscripts/uploads`.
2. Service loads Series.
3. Service checks `Series.ownerId == actor.userId`.
4. Service requests R2 signed PUT URL.
5. Repository creates `FileAsset` and `Manuscript` records.
6. Controller returns URL + ids.

## Interface Contract

`POST /api/series/:seriesId/manuscripts/uploads`

Body:

```json
{
  "originalName": "draft.pdf",
  "contentType": "application/pdf",
  "size": 1024
}
```

Response:

```json
{
  "success": true,
  "message": "Manuscript upload URL created",
  "data": {
    "uploadUrl": "https://...",
    "fileAssetId": "...",
    "manuscriptId": "...",
    "expiresIn": 3600
  }
}
```

## Data Model

Uses existing `Manuscript` and `FileAsset` models. No schema migration.

## UI / Platform Impact

Series page upload panel now requests a signed URL for the selected Series. Direct file PUT is stated as out of UI scope.

## Observability

No audit log added; future audit story should record file access events.

## Alternatives Considered

1. Store base64 payload in DB: rejected by security contract.
2. Allow Editor/Admin upload initial manuscript: rejected; story keeps owner Mangaka scope.
3. Implement direct R2 PUT in UI: deferred to avoid external-storage coupling in this story.
