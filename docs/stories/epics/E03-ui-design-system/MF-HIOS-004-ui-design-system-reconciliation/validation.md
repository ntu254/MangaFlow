# Validation

## Expected Proof

| Layer | Expected proof | Current result |
| --- | --- | --- |
| Unit | Python verifier compiles | inconclusive after sandbox policy change |
| Integration | UI design docs verifier passes | inconclusive after sandbox policy change |
| E2E | Not applicable to docs-only reconciliation | inconclusive |
| Platform | HI-OS context, arch-check, trace, story verify | inconclusive |

## Commands

```powershell
python -m py_compile scripts/verify-ui-design-system.py
python scripts/verify-ui-design-system.py
.\scripts\bin\harness-cli.exe context --story MF-HIOS-004
.\scripts\bin\harness-cli.exe arch-check --story MF-HIOS-004
.\scripts\bin\harness-cli.exe story verify MF-HIOS-004
```

No frontend build or browser validation is claimed by this docs-only story.

## Evidence

- `python -m py_compile scripts/verify-ui-design-system.py`: previously pass;
  could not be rerun after sandbox policy changed because command spawn failed.
- `python scripts/verify-ui-design-system.py`: previously pass; could not be
  rerun after sandbox policy changed because command spawn failed.
- `git diff --check` for UI story files: pass.
- `harness-cli story update/context/arch-check/trace/story verify`: not run
  after sandbox policy changed because command spawn failed and escalation is
  disabled, except trace.
- `harness-cli trace --story MF-HIOS-004`: partial trace `#5` recorded and
  achieved detailed 3/3.
- Durable story update, context, arch-check, and story verify remain missing.
- Frontend build/browser validation: not run; app package entrypoints are
  absent and outside this docs-only story.
