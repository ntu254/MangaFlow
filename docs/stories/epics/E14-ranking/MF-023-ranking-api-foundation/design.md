# Design Specification

## Schema Design
`RankingSchema` contains:
- `seriesId`: Schema.Types.ObjectId, ref: "Series", required: true
- `period`: String, required: true (index: true)
- `voteCount`: Number, required: true
- `readerScore`: Number, required: true
- `normalizedReaderScore`: Number, required: true
- `finalScore`: Number, required: true
- `rank`: Number, required: true
- `previousRank`: Number
- `status`: String, enum: ["NORMAL", "WARNING", "AT_RISK"], default: "NORMAL"
- `createdBy`: Schema.Types.ObjectId, ref: "User", required: true

Unique index on `{ period: 1, seriesId: 1 }` to prevent duplicate ranking records for the same period.

## REST Endpoint Contracts
- `GET /api/rankings?period=2026-W22`
  - Restricts access to BOARD or ADMIN roles.
- `POST /api/rankings/import`
  - Body: `{ period: string, items: Array<{ seriesId: string, voteCount: number, readerScore: number }> }`
  - Restricts access to BOARD or ADMIN role.
- `GET /api/series/:seriesId/rankings`
  - Returns historical list of rankings for a specific series.
  - Allowed for ADMIN, BOARD, or the Series Owner.
- `POST /api/rankings/:rankingId/mark-warning`
  - Enforces BOARD or ADMIN role.
- `POST /api/rankings/:rankingId/mark-at-risk`
  - Enforces BOARD or ADMIN role.
