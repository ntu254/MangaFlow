# Validation

## Proof Strategy

This is a high-risk docs/contracts story. Proof must show that the source of
truth exists, affected contracts point at it or repeat the invariant safely,
and future backend validation expectations are explicit.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Contract/static checks for required terms and files. |
| Integration | Affected contracts and validation plan updated consistently. |
| E2E | Not applicable; no runtime behavior changed. |
| Platform | HI-OS context, arch-check, trace, and story verify pass. |
| Performance | Not applicable. |
| Logs/Audit | Future audit expectations documented for critical transitions. |

## Fixtures

No runtime fixtures are needed. Future backend stories should define users,
Series, SeriesMember, Task, Page, BoardVote, Publication, and
AssistantEarning fixtures.

## Commands

```text
git diff --check
Select-String targeted contract checks
scripts/bin/harness-cli.exe context --story MF-HIOS-029
scripts/bin/harness-cli.exe arch-check --story MF-HIOS-029
scripts/bin/harness-cli.exe story verify MF-HIOS-029
```

## Acceptance Evidence

- `cd client && npm run build` passed on 2026-06-08. Vite emitted the existing
  chunk-size advisory; build exited 0.
- `cd client && npm run lint` passed on 2026-06-08.
- `git diff --check` passed on 2026-06-08 with Git line-ending advisories;
  command exited 0.
- Targeted `Select-String` contract checks found required terms for
  `SeriesStatus`, `BOARD_REVIEW`, `PublicationReadinessService`, Board Chair
  rules, `Task.assignedTo`, POST action endpoints, and Payroll MVP formula.
- `rg "PENDING_REVIEW" client docs -g "!docs/MangaFlow-Business Workflow Specification.md"`
  returned no matches, proving the old frontend/docs status drift was removed
  outside the historical business spec.
- `scripts/bin/harness-cli.exe context --story MF-HIOS-029` passed and wrote
  `.harness/context/MF-HIOS-029-context.md`.
- `scripts/bin/harness-cli.exe arch-check --story MF-HIOS-029` passed.
- `scripts/bin/harness-cli.exe trace ... --story MF-HIOS-029` recorded trace
  `#33` and met the required detailed tier.
- `scripts/bin/harness-cli.exe story verify MF-HIOS-029` passed both
  mechanical verification and governance gate.
