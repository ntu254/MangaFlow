# Harness Backlog

Use this file when an agent discovers a missing harness capability but should
not change the operating model immediately.

## Template

```md
## Missing Harness Capability

### Title

Short name.

### Discovered While

Task or story that exposed the gap.

### Current Pain

What was hard, repeated, ambiguous, or unsafe?

### Suggested Improvement

What should be added or changed?

### Risk

Tiny, normal, or high-risk.

CLI value: `--risk tiny`, `--risk normal`, or `--risk high-risk`.

### Status

proposed | accepted | implemented | rejected
```

## Items

## Missing Harness CLI Binary

### Title

Install or restore Windows Harness CLI binary.

### Discovered While

US-000 Foundation Scaffold.

### Current Pain

`scripts/bin/harness-cli.exe` is required by AGENTS/Harness instructions. It was
reported missing during Phase 0 follow-up, which blocked durable intake, story,
matrix, decision, backlog, and trace updates through the standard CLI path.

As of the Auth/User Sync planning pass, the binary is available and reports
`harness-cli 0.1.8`.

### Suggested Improvement

No further action is needed while the binary remains available. If this recurs,
restore the prebuilt Windows binary with the Harness installer or document a
safe local bootstrap path for Windows workspaces where the binary is absent.

### Risk

Tiny.

CLI value: `--risk tiny`.

### Status

implemented
