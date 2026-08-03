# Release hardening — 2026-07-27

## Decision

The backend full-suite timeout was a verification-command/environment issue,
not a confirmed runtime defect. The authoritative command is the repository's
existing single-fork Vitest configuration run sequentially:

```bash
cd backend
npm test -- --reporter=dot
```

The run passed with exit code 0 in approximately 248 seconds.

Running many MongoMemory test files concurrently is not supported on this
workspace: it saturates local Mongo resources and causes pool timeouts,
`EPIPE` reporter errors, and misleading hook failures. Those parallel results
were discarded.

## Structural roadmap

The current architecture is safe to keep while decomposition is prepared:

| Area | Current owner | Safe next seam |
| --- | --- | --- |
| Proposal/Board | proposal lifecycle, proposal governance, board governance services plus compatibility orchestration | further reduce compatibility imports |
| Production | chapter readiness/review and task/submission services plus compatibility orchestration | move remaining chapter transitions behind explicit owners |
| Publication/Earnings | publication and earning services | keep outbox/earning transaction tests as contracts |
| Persistence | Publication/Earning bounded model modules plus compatibility registry | split remaining legacy models incrementally |
| Web API contracts | domain modules under `src/shared/api/` plus compatibility exports | migrate remaining feature imports gradually |

The extracted seams are now covered by focused tests and the existing
controller/route contracts are preserved. Remaining decomposition is incremental;
no broad rewrite is justified before each new seam has equivalent transaction and
authorization coverage.

## Open business decision

`FLOW-GAP-04 / CT-11` is implemented: Admin remains limited to account lifecycle,
Board Chair designation management, and explicitly retained system surfaces.
