# Story Backlog

This backlog is the human-readable queue for the current MangaFlow MVP flow. Durable proof still lives in Harness (`scripts/bin/harness-cli.exe query matrix`) and story packets under `docs/stories/`.

## Current decision

Near-term target: **ship MVP UI**.

Rationale:

- MF-HIOS-050 through MF-HIOS-059 API wiring stories are implemented in local story/matrix evidence.
- MF-HIOS-069 through MF-HIOS-082 modularization stories are implemented in local story evidence.
- The next visible gap is UI completion and page-level maintainability.

Alternate path if production stability becomes the priority:

1. MF-HIOS-061 hardening implementation.
2. Re-check MF-HIOS-050 through MF-HIOS-059 API wiring evidence.
3. Continue admin pages MF-HIOS-089+ only after API/security boundaries are clear.

## Execution flow

```text
new
-> feature/<story-slug>
-> implement
-> validate
-> story/harness PASS
-> commit
-> merge --no-ff into new
-> next task
```

## Active story

| Story | Branch | Status | Notes |
| --- | --- | --- | --- |
| MF-HIOS-088 SeriesListPanel Admin Reuse | `feature/mf-hios-088-series-list-panel-admin-reuse` | implemented | Read-only/admin reuse props added; merged to `new`. |

## MVP UI queue

| Order | Story | Status | Expected branch |
| --- | --- | --- | --- |
| 1 | MF-HIOS-083 Series Page Componentization | implemented | `feature/mf-hios-083-series-page-componentization` |
| 2 | MF-HIOS-086 Role Dashboard Hook Extraction | implemented | `feature/mf-hios-086-role-dashboard-hook-extraction` |
| 3 | MF-HIOS-087 Admin Dashboard Hook Extraction | implemented | `feature/mf-hios-087-admin-dashboard-hook-extraction` |
| 4 | MF-HIOS-084 Chapter Detail Tab Extraction | implemented | `feature/mf-hios-084-chapter-detail-tab-extraction` |
| 5 | MF-HIOS-085 Tasks Page Preview Dialog Extraction | implemented | `feature/mf-hios-085-tasks-page-preview-dialog-extraction` |
| 6 | MF-HIOS-088 SeriesListPanel Admin Reuse | implemented | `feature/mf-hios-088-series-list-panel-admin-reuse` |

## Later candidates

| Story | Status | Notes |
| --- | --- | --- |
| MF-HIOS-089 Admin Users Management | blocked-by-api-gap | Only `POST /api/auth/admin/users` is exposed; no confirmed `GET/PATCH /api/admin/users` HTTP routes yet. |
| MF-HIOS-090 Admin Board Members | candidate | Confirm board/admin boundary before implementation. |
| MF-HIOS-091 Admin Series Monitor | candidate | Reuse MF-HIOS-088 panel. |
| MF-HIOS-092 Admin Task Types Config | candidate | Must not hard-delete used TaskType records. |
| MF-HIOS-093 Admin Task Rates Config | candidate | Payroll rules are high-risk if changed. |
| MF-HIOS-094 Admin Payroll Tracking | candidate | Payroll/audit changes need explicit proof. |
| MF-HIOS-095 Admin Storage Monitor | candidate | File access/signed URL boundaries are high-risk. |
| MF-HIOS-096 Admin AI Service Monitor | candidate | AI service/browser access boundary must remain backend-mediated. |
| MF-HIOS-097 Admin Audit Logs | candidate | Audit/security proof required. |
| MF-HIOS-098 Admin System Health | candidate | Confirm health API contract. |
| MF-HIOS-099 Notifications Inbox | candidate | Confirm notifications API contract. |
| MF-HIOS-100 Placeholder Skeleton States | candidate | UI polish. |
| MF-HIOS-101 Mobile/QA Pass | candidate | Final responsive/accessibility pass. |

## Recently synced implementation status

| Range | Synced status |
| --- | --- |
| MF-HIOS-050 through MF-HIOS-059 | implemented |
| MF-HIOS-060 through MF-HIOS-068 | implemented |
| MF-HIOS-069 through MF-HIOS-082 | implemented |
| MF-HIOS-083 through MF-HIOS-088 | implemented |
