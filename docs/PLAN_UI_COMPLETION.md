# MangaFlow UI Completion Plan

> Scope: remaining MVP UI work and the execution flow for one story at a time.
> Last sync: 2026-06-09 local workspace + harness audit.
> Current base branch: `new`.
> Current feature branch: none; `new` is current after MF-HIOS-083 through MF-HIOS-088 merges.

## Source-of-truth sync

### Authoritative status after sync

| Range | Status | Evidence |
| --- | --- | --- |
| MF-HIOS-050 through MF-HIOS-059 | implemented | Story packets in `docs/stories/` show `implemented`; harness matrix has implemented rows through MF-HIOS-059. |
| MF-HIOS-060 through MF-HIOS-068 | implemented | Story packets show implemented componentization/modularization evidence. |
| MF-HIOS-069 through MF-HIOS-082 | implemented | Story packets show `implemented`; `.harness/context/` packs were synced from stale planned status to implemented. |
| MF-HIOS-083 through MF-HIOS-088 | implemented | Story packets, verify scripts, and harness matrix rows pass for the completed MVP UI sequence plus SeriesListPanel admin reuse. |
| MF-HIOS-089 through MF-HIOS-101 | implemented | Admin UI components, notifications, and skeletons are fully built, wired to exposed HTTP routes, and pass all validations. |

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

Completed in order:

1. **MF-HIOS-083 through MF-HIOS-088**: MVP UI Componentization.
2. **MF-HIOS-089 through MF-HIOS-098**: Admin UI Dashboard and Monitoring modules.
3. **MF-HIOS-099 through MF-HIOS-101**: Notifications, Skeletons, and QA/Mobile polish.

### Stability/hardening path

Use this path if production readiness, security, or backend certainty becomes the priority:

1. **MF-HIOS-061: Hardening packet implementation**.
2. Re-check **MF-HIOS-050 through MF-HIOS-059** API wiring evidence.
3. Only then continue **MF-HIOS-089+** admin pages.

## Current status

Completed stories on `new`:

- `MF-HIOS-083` to `MF-HIOS-088` Series, Dashboard, and Tasks extraction
- `MF-HIOS-089` Admin Users Management
- `MF-HIOS-090` Admin Board Members
- `MF-HIOS-091` Admin Series Monitor
- `MF-HIOS-092` Admin Task Types Config
- `MF-HIOS-093` Admin Task Rates Config
- `MF-HIOS-094` Admin Payroll Tracking
- `MF-HIOS-095` Admin Storage Monitor
- `MF-HIOS-096` Admin AI Service Monitor
- `MF-HIOS-097` Admin Audit Logs
- `MF-HIOS-098` Admin System Health
- `MF-HIOS-099` Notifications Inbox
- `MF-HIOS-100` Placeholder Skeleton States
- `MF-HIOS-101` Mobile/QA pass

Verified for each completed story:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-XXX.ps1
scripts/bin/harness-cli.exe story verify MF-HIOS-XXX
```

## Next phase audit

The MVP UI Phase (up through MF-HIOS-101) is fully complete. Dead code and placeholder routes have been removed.

Recommended next move: Focus on `MF-HIOS-061: Hardening packet implementation` and production readiness validation.

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
