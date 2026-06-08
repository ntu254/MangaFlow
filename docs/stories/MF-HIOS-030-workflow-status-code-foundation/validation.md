# Validation

## Proof Strategy

Prove that code compiles, tests pass, Series status values come from the shared
constants, and the old duplicated/narrow enum shape is gone.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Workflow status constants expose canonical Series statuses; Series model enum uses shared array. |
| Integration | Existing Series service tests still pass. |
| E2E | Not applicable; no route flow changes. |
| Platform | HI-OS context, arch-check, trace, and story verify pass. |
| Performance | Not applicable. |
| Logs/Audit | Not implemented in this foundation story. |

## Fixtures

Existing mocked Series service fixtures are enough.

## Commands

```text
npm run build --prefix server
npm run lint --prefix server
npm run test --prefix server
npm run build --prefix client
npm run lint --prefix client
git diff --check
scripts/bin/harness-cli.exe context --story MF-HIOS-030
scripts/bin/harness-cli.exe arch-check --story MF-HIOS-030
scripts/bin/harness-cli.exe story verify MF-HIOS-030
```

## Acceptance Evidence

- `npm run build --prefix server` passed on 2026-06-08.
- `npm run lint --prefix server` passed on 2026-06-08.
- `npm run test --prefix server` passed on 2026-06-08: 4 test files, 14 tests.
- `npm run build --prefix client` passed on 2026-06-08. Vite emitted the
  existing chunk-size advisory; build exited 0.
- `npm run lint --prefix client` passed on 2026-06-08.
- `git diff --check` passed on 2026-06-08 with Git line-ending advisories;
  command exited 0.
- Targeted `Select-String` checks found `SERIES_STATUSES`, `SeriesStatus`,
  `REVISION_REQUESTED`, `BOARD_REVIEW`, and `COMPLETED` in code-level status
  surfaces.
- `scripts/bin/harness-cli.exe context --story MF-HIOS-030` passed and wrote
  `.harness/context/MF-HIOS-030-context.md`.
- `scripts/bin/harness-cli.exe arch-check --story MF-HIOS-030` passed.
- `scripts/bin/harness-cli.exe trace ... --story MF-HIOS-030` recorded trace
  `#34` and met the required detailed tier.
- `scripts/bin/harness-cli.exe story verify MF-HIOS-030` passed both the
  server test command and governance gate.
