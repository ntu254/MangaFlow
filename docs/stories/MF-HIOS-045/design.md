# Design

## Domain Model

No new collection or schema is introduced. The summary reads counts from existing collections:

- User
- Series
- Task
- BoardMember
- TaskType

## Application Flow

1. Admin page calls `GET /api/dashboard/admin/sidebar-summary`.
2. Express route applies `requireAuth` then `requireRole("ADMIN")`.
3. Dashboard service aggregates read-only counts.
4. Controller returns standard API envelope.
5. UI renders counts, health badges, storage label, and audit preview.

## Interface Contract

Route:

```txt
GET /api/dashboard/admin/sidebar-summary
```

Response data:

```ts
{
  stats: {
    activeUsers: number
    totalSeries: number
    activeTasks: number
    boardMembers: number
    activeTaskTypes: number
  }
  systemHealth: Array<{ key: string; label: string; status: string }>
  storage: { usedLabel: string; usagePercent: number }
  auditPreview: string[]
}
```

Errors reuse shared middleware behavior:

- `401 Authentication required`.
- `403 Insufficient permissions`.

## Data Model

No migration. Queries use existing indexes/status fields where present.

## UI / Platform Impact

Admin dashboard uses existing admin components plus API loading/error states. It stays read-only and states that Admin cannot override Board decisions.

## Observability

Harness trace records implementation and validation. Persistent audit log storage remains future scope.

## Alternatives Considered

1. Use existing untracked `server/src/modules/admin` WIP service. Rejected to avoid coupling this read-only slice to unrelated user/role mutation code.
2. Keep hard-coded UI counts. Rejected because contract requires backend dashboard counts.
