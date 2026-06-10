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
| MVP UI Cleanup | current worktree | completed | All MVP UIs up to MF-HIOS-101 are fully verified and dead code removed. |

## MVP UI queue

| Order | Story | Status | Expected branch |
| --- | --- | --- | --- |
| 1 | MF-HIOS-083 Series Page Componentization | implemented | `feature/mf-hios-083-series-page-componentization` |
| 2 | MF-HIOS-086 Role Dashboard Hook Extraction | implemented | `feature/mf-hios-086-role-dashboard-hook-extraction` |
| 3 | MF-HIOS-087 Admin Dashboard Hook Extraction | implemented | `feature/mf-hios-087-admin-dashboard-hook-extraction` |
| 4 | MF-HIOS-084 Chapter Detail Tab Extraction | implemented | `feature/mf-hios-084-chapter-detail-tab-extraction` |
| 5 | MF-HIOS-085 Tasks Page Preview Dialog Extraction | implemented | `feature/mf-hios-085-tasks-page-preview-dialog-extraction` |
| 6 | MF-HIOS-088 SeriesListPanel Admin Reuse | implemented | `feature/mf-hios-088-series-list-panel-admin-reuse` |

## Completed MVP UI

| Story | Status | Notes |
| --- | --- | --- |
| MF-HIOS-089 Admin Users Management | implemented | Exposed HTTP routes are verified. |
| MF-HIOS-090 Admin Board Members | implemented | Admin Board member routes/page implemented and governance-verified. |
| MF-HIOS-091 Admin Series Monitor | implemented | Reuses MF-HIOS-088 panel in read-only monitor mode. |
| MF-HIOS-092 Admin Task Types Config | implemented | Admin routes/page added; must not hard-delete used TaskType records. |
| MF-HIOS-093 Admin Task Rates Config | implemented | Admin default-rate UI added; payroll formula and existing Task.baseRate snapshots remain unchanged. |
| MF-HIOS-094 Admin Payroll Tracking | implemented | Admin tracking UI added; confirm/mark-paid use existing backend action endpoints. |
| MF-HIOS-095 Admin Storage Monitor | implemented | Fully wired to dashboard summaries. |
| MF-HIOS-096 Admin AI Service Monitor | implemented | Fully wired to dashboard summaries. |
| MF-HIOS-097 Admin Audit Logs | implemented | Audit summary implemented. |
| MF-HIOS-098 Admin System Health | implemented | Health overview implemented. |
| MF-HIOS-099 Notifications Inbox | implemented | Inbox page implemented. |
| MF-HIOS-100 Placeholder Skeleton States | implemented | Skeleton states used successfully. |
| MF-HIOS-101 Mobile/QA Pass | implemented | Builds successfully with all UIs. |

## Recently synced implementation status

| Range | Synced status |
| --- | --- |
| MF-HIOS-050 through MF-HIOS-059 | implemented |
| MF-HIOS-060 through MF-HIOS-068 | implemented |
| MF-HIOS-069 through MF-HIOS-082 | implemented |
| MF-HIOS-083 through MF-HIOS-088 | implemented |
| MF-HIOS-089 through MF-HIOS-101 | implemented |
