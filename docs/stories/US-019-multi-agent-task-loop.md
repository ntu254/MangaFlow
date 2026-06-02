# US-019 Multi-Agent Task Loop

## Status

implemented

## Lane

normal

## Product Contract

MangaFlow agents have a durable multi-agent operating playbook that explains
how to read Harness docs first, understand the current codebase, route work to
sub-agents/plugins/skills, implement bounded code changes, validate proof, and
persist Harness state.

## Relevant Product Docs

- `repository-harness/AGENTS.md`
- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTEXT_RULES.md`
- `docs/MULTI_AGENT_TASK_LOOP.md`
- `docs/README.md`

## Acceptance Criteria

- The workflow requires reading `AGENTS.md`, Harness docs, and matrix state
  before implementation.
- The workflow defines parent-agent/coordinator ownership and safe delegation
  rules for explorers, workers, reviewers, browser verifiers, and deployment
  agents.
- The workflow captures MangaFlow's current codebase surfaces and known proof
  gaps.
- The workflow maps available Build Web Apps, Vercel, OpenAI Developers,
  GitHub, and local skills to coding tasks.
- The workflow states validation, story/matrix update, trace, and final-report
  requirements.

## Design Notes

- Commands:
  - `.\scripts\bin\harness-cli.exe query matrix`
  - `.\scripts\bin\harness-cli.exe intake ...`
  - `.\scripts\bin\harness-cli.exe story verify <story-id>`
  - `.\scripts\bin\harness-cli.exe trace ...`
- Domain rules:
  - The coordinator owns final integration and proof.
  - Sub-agents are used only for explicit multi-agent/delegation requests and
    bounded parallel sidecar tasks.
  - Workers receive disjoint write scopes and must not revert others' changes.
- UI surfaces:
  - None.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id <id> --unit 1 --integration 1 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | Not applicable; workflow documentation only. |
| Integration | Harness intake/story/matrix records can point to the workflow. |
| E2E | Not applicable; no browser flow changed. |
| Platform | Docs and Harness CLI commands run locally. |
| Release | Not applicable. |

## Harness Delta

- Added `docs/MULTI_AGENT_TASK_LOOP.md`.
- Linked the playbook from `docs/README.md`.
- Recorded durable intake for the workflow request.

## Evidence

- Intake recorded: `#12`.
- Sub-agent scout results were received for codebase state and plugin/skills
  catalog.
- `docs/MULTI_AGENT_TASK_LOOP.md` contains the durable operating workflow.

