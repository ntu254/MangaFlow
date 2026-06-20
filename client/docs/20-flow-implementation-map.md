# Flow 00–04 implementation map

| Flow | Spec doc | Entities | Routes |
| --- | --- | --- | --- |
| 00 — Auth & RBAC | `Flow-00.md` | `staff`, `user`, `audit` | `/login`, `/app/admin/users`, `/app/admin/roles`, `/app/notifications` |
| 01 — Series Proposal | `Flow-01-...md` | `proposal`, `manuscript`, `editor-review`, `board-vote` | `/app/series/new`, `/app/series/$id/revisions`, `/app/editor/series-review`, `/app/editor/series/$id/review`, `/app/board/series-review`, `/app/board/series/$id/vote` |
| 02 — Chapter & Page upload | `Flow-02-...md` | `chapter`, `page`, `file-asset` | `/app/series/$id`, `/app/chapters/$id`, `/app/chapters/$id/pages/upload` |
| 03 — Production Team | `Flow-03-...md` | `series-member` | `/app/series/$id/team` |
| 04 — Page Studio & AI | `Flow-04-...md` | `page`, `region`, `ai-result` | `/app/pages/$id/studio`, `/app/ai/bubble` |

## Cross-cutting

- `src/shared/lib/permissions.ts` — frontend-only permission matrix from §11 of each flow.
- `src/shared/lib/audit.ts` — `logAudit({type, actorId, entity, entityId, payload})`, persists in `localStorage`, surfaced via `<AuditTimeline />`.
- `src/shared/lib/notifications.ts` — `notify(userId, …)`, `markRead`, surfaced via `<NotificationBell />` and `/app/notifications`.

## Status enums (canonical, used in code)

- **User.status**: `pending-invite | active | inactive | suspended`
- **Series.status**: `draft | editor-review | revision-requested | board-review | approved | ongoing | at-risk | completed | cancelled`
- **Chapter.status**: `draft | in-production | ready-for-publication | published | archived` (+ legacy review buckets retained for back-compat with existing screens)
- **Page.status**: `uploading | uploaded | processing-failed | task-assigned | in-progress | under-review | approved`
- **SeriesMember.status**: `invited | active | removed | paused`
- **Region.status**: `created | ai-suggested | accepted | rejected | linked-to-task`
- **AIResult.status**: `pending | completed | failed | partially-accepted`

## Edge cases enforced in UI

- Series missing `publicationType` → `Create Chapter` / `Upload Pages` disabled with tooltip reason (Flow 02 §17).
- Board approve flow requires `WEEKLY` or `MONTHLY` selection before "Finalize as Chair" enabled (Flow 01 §17).
- Assistant not in active `SeriesMember` → `Restricted` reason returned by `canAssignTaskTo` (Flow 03 §8).
- Page Studio blocked when `Page.status` is `uploading` or `processing-failed` (Flow 04 §17).
- AI failed state shows Retry button that creates a new `AIResult` (Flow 04 §10).
