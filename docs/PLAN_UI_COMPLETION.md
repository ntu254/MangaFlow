# MangaFlow UI Completion Plan

> Scope: remaining MVP UI work and the execution flow for one story at a time.
> Last sync: 2026-06-09 local workspace audit.
> Current base branch: `new`.
> Current feature branch: `feature/mf-hios-083-series-page-componentization`.

## Source-of-truth sync

### Authoritative status after sync

| Range | Status | Evidence |
| --- | --- | --- |
| MF-HIOS-050 through MF-HIOS-059 | implemented | Story packets in `docs/stories/` show `implemented`; harness matrix has implemented rows through MF-HIOS-059. |
| MF-HIOS-060 through MF-HIOS-068 | implemented | Story packets show implemented componentization/modularization evidence. |
| MF-HIOS-069 through MF-HIOS-082 | implemented | Story packets show `implemented`; `.harness/context/` packs were synced from stale planned status to implemented. |
| MF-HIOS-083 | planned/current | Story packet, context pack, and verify script created for current feature branch. |
| MF-HIOS-084 through MF-HIOS-101 | candidate planned | Listed below; create story packet/context/verify script only when selected. |

### Known source boundaries

- `docs/stories/*.md` and `scripts/bin/harness-cli.exe query matrix` are the strongest local implementation status evidence.
- `.harness/context/*` is handoff context and must be kept in sync with story status before starting a story.
- `docs/stories/backlog.md` is the human-readable queue, not proof of implementation.
- Remote branch names are advisory until fetched/reviewed in the local worktree.

## Near-term target decision

Chosen near-term target: **ship MVP UI**.

Reason:

- The backend/API wiring stories MF-HIOS-050 through MF-HIOS-059 are already implemented in current local story/matrix evidence.
- Server modularization stories MF-HIOS-069 through MF-HIOS-082 are already implemented in story packets.
- The remaining gap called out by the plan is UI completion: thin page shells, hooks, reusable panels, admin placeholders, and QA polish.

Security/backend hardening is still important:

- MF-HIOS-061 remains a high-risk hardening packet and should be scheduled before production release or before new risky file/auth/AI behavior.
- Do not start admin write-heavy pages MF-HIOS-089+ if required backend endpoints/contracts are missing or unclear.

## Required execution flow

For each selected story:

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

Operational checklist:

1. Checkout/update `new`.
2. Create or switch to `feature/<story-slug>`.
3. Ensure story packet, context pack, and verify script exist.
4. Implement only the selected story scope.
5. Run story validation command(s).
6. Update story evidence and harness records.
7. Run architecture/check/trace/story verification when available.
8. Commit the feature branch.
9. Merge with `git merge --no-ff feature/<story-slug>` into `new`.
10. Start the next story from updated `new`.

## Priority queue

### MVP UI path

1. **MF-HIOS-083: Series Page Componentization** - current story.
2. **MF-HIOS-086: Role Dashboard Hook Extraction**.
3. **MF-HIOS-087: Admin Dashboard Hook Extraction**.
4. **MF-HIOS-084: Chapter Detail Tab Extraction**.
5. **MF-HIOS-085: Tasks Page Preview Dialog Extraction**.

### Stability/hardening path

Use this path if production readiness, security, or backend certainty becomes the priority:

1. **MF-HIOS-061: Hardening packet implementation**.
2. Re-check **MF-HIOS-050 through MF-HIOS-059** API wiring evidence.
3. Only then continue **MF-HIOS-089+** admin pages.

## Current story: MF-HIOS-083

Route: `/app/series`

Branch: `feature/mf-hios-083-series-page-componentization`

Deliverables:

- `client/src/features/series/hooks/useSeriesPage.ts` for page state, fetch, and mutations.
- `client/src/features/series/components/SeriesListPanel.tsx` for list, loading, empty, and error presentation.
- `client/src/features/series/utils/series-page.mappers.ts` for pure row/upload transforms.
- `client/src/features/series/pages/SeriesPage.tsx` reduced to a thin composition shell.

Acceptance:

- Existing list, create, select, and manuscript upload behavior remains unchanged.
- Existing API helpers remain the boundary; no backend/API/schema/permission changes.
- Empty/loading/error states remain visible.
- Client lint and build pass.
- Harness story verification passes after trace/proof records are updated.

Validation:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-083.ps1
scripts/bin/harness-cli.exe story verify MF-HIOS-083
```

## Upcoming story briefs

### MF-HIOS-086: Role Dashboard Hook Extraction

- Extract role-dashboard loading/config logic into `client/src/features/dashboard/hooks/useRoleDashboard.ts`.
- Extract dashboard action/stat presentation if needed.
- Preserve route behavior and navigation.

### MF-HIOS-087: Admin Dashboard Hook Extraction

- Extract admin dashboard summary loading into `client/src/features/admin/hooks/useAdminDashboard.ts`.
- Keep current admin dashboard presentation and retry behavior.

### MF-HIOS-084: Chapter Detail Tab Extraction

- Extract pages, review, and readiness tabs from `ChapterDetailPage.tsx`.
- Preserve tab switching and existing data flow.

### MF-HIOS-085: Tasks Page Preview Dialog Extraction

- Extract `TaskPreviewDialog` from `TasksPage.tsx`.
- Preserve dialog state and preview behavior.

## Later admin/UI completion candidates

- MF-HIOS-088: SeriesListPanel refinement for admin reuse.
- MF-HIOS-089: Admin users management.
- MF-HIOS-090: Admin board members.
- MF-HIOS-091: Admin series monitor.
- MF-HIOS-092: Admin task types config.
- MF-HIOS-093: Admin task rates config.
- MF-HIOS-094: Admin payroll tracking.
- MF-HIOS-095: Admin storage monitor.
- MF-HIOS-096: Admin AI service monitor.
- MF-HIOS-097: Admin audit logs.
- MF-HIOS-098: Admin system health.
- MF-HIOS-099: Notifications inbox.
- MF-HIOS-100: Placeholder skeleton states.
- MF-HIOS-101: Mobile/QA pass.

## Definition of done per UI story

- Story packet and context pack are current.
- Page shell is thin enough for the selected scope.
- Hook owns data/logic where applicable.
- Extracted components have single responsibility.
- Existing API and permission boundaries are unchanged unless the story explicitly says otherwise.
- Empty/loading/error states are covered.
- `npm run lint --prefix client` passes.
- `npm run build --prefix client` passes.
- Story evidence and harness trace are updated.
- Story/harness verification passes before merge to `new`.
