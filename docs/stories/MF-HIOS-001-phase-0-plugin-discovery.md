# MF-HIOS-001 Phase 0 Repository and Plugin Discovery

## Status

implemented

## Lane

normal

## Task Type

New spec intake and HI-OS governance setup.

## Product Contract

Establish a verified Phase 0 baseline before any MangaFlow implementation
story begins. The baseline must identify the repository state, required
governance documents, available validation entrypoints, and the plugin or skill
pack appropriate for each future work category.

This story does not restore deleted application code, install external tools,
change product behavior, or begin Phase 1.

## Relevant Product Docs

- `AGENTS.md`
- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/CONTEXT_RULES.md`
- `docs/TRACE_SPEC.md`
- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Selected Skill Pack

- Primary: HI-OS Governance
- Secondary: Operations
- Future implementation routing: use the narrowest matching plugin and
  repository skill after the story contract selects its docs and lane.

## Plugin And Skill Routing

| Work category | Preferred plugin or repository skill | Required MangaFlow docs |
| --- | --- | --- |
| React/Vite UI, shared components, screens | Build Web Apps; `frontend-design`, `react-patterns`, `tailwind-patterns`, `ui-styling` | `docs/design/*`, `docs/contracts/ui-main.md`, matching `docs/contracts/ui-*.md` |
| UI verification and accessibility | Build Web Apps; `web-design-guidelines`, `accessibility-compliance-accessibility-audit` | `docs/validation/ui-review-checklist.md`, `docs/design/accessibility-rules.md` |
| Express API and TypeScript | `api-design-principles`, `typescript-expert`, `clean-code` | `docs/architecture/api.md`, relevant feature contract |
| MongoDB and Mongoose data modeling | `database-design` | `docs/architecture/database.md`, `docs/architecture/security.md`, decision records |
| Auth, permissions, and security review | `security-auditor` | `docs/architecture/auth.md`, `docs/architecture/security.md`, `docs/contracts/auth.md` |
| Tests and acceptance proof | `test-driven-development`, `testing-patterns`, `lint-and-validate` | `docs/validation/*`, current story validation section |
| GitHub issues, PRs, and CI | GitHub | Current story, validation evidence, repository status |
| Vercel deployment and operations | Vercel | `docs/operations/*`, `docs/architecture/deployment.md` |
| Expo or React Native mobile work | Expo; `mobile-developer` | A dedicated mobile contract and architecture decision |
| OpenAI API or Agents work | OpenAI Developers | A dedicated AI contract, storage rules, security docs |

Plugins are selected per story. Their availability does not authorize work
outside the current story contract.

## Repository Baseline

- Required governance and MangaFlow source-of-truth documents exist.
- Root `package.json` is missing, so no root application validation script is
  currently available.
- Windows HI-OS CLI exists at `scripts/bin/harness-cli.exe`; the extensionless
  POSIX binary is not expected on this platform.
- The worktree contains extensive pre-existing deletions under `client/`,
  `server/`, `mobile/`, and historical stories.
- New or modified HI-OS/product documentation is present.
- A root `.env` file exists and must not be committed or exposed.

## Acceptance Criteria

- The selected task type, skill pack, docs, lane, risks, implementation plan,
  and validation plan are recorded.
- Required Phase 0 documents are checked for existence.
- Available plugins and repository skills are mapped to future story types.
- Package scripts and HI-OS CLI availability are checked without inventing
  results.
- Existing worktree deletions are not reverted or modified by this story.
- Any unavailable validation evidence is marked inconclusive, not pass.
- Phase 1 does not begin until this story has validation evidence or is
  explicitly resolved through a follow-up HI-OS story.

## Risks

- Restoring or overwriting the user's large pre-existing worktree changes.
- Selecting overlapping UI skills without a story-specific reason.
- Treating an available plugin as permission to bypass MangaFlow contracts.
- Claiming application build or test proof while root package scripts are
  unavailable.
- Exposing or committing the root `.env` file.

## Implementation Plan

1. Inventory repository structure, required docs, package scripts, and CLI.
2. Map available plugins and repository skills to MangaFlow task categories.
3. Record read-only baseline findings and validation evidence in this story.
4. Stop before Phase 1 if the HI-OS verification gate does not pass.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Not applicable for this docs-only discovery story. |
| Integration | Required document existence check. |
| E2E | Not applicable; application entrypoints are absent. |
| Platform | HI-OS CLI identity and matrix commands when the binary exists. |
| Release | Not applicable. |

Required commands:

```powershell
Test-Path <required-document>
Test-Path package.json
Test-Path scripts/bin/harness-cli.exe
.\scripts\bin\harness-cli.exe identity
.\scripts\bin\harness-cli.exe query matrix --numeric
git status --short
```

## Harness Delta

The Windows HI-OS CLI is available. The application validation ladder is not:
root `package.json` and the previously tracked application packages are absent
from the working tree. This story does not restore them because the deletions
are pre-existing user changes.

## Evidence

- Required document check: pass; all 13 selected documents exist.
- Repository skills discovered: 47 directories with `SKILL.md`.
- HI-OS identity: pass; product reported as Harness Intelligence OS.
- HI-OS matrix query: pass; matrix was empty before this story was registered.
- Root package script discovery: inconclusive; root `package.json` is absent.
- Existing deletion preservation: pass; no application files were changed.
- Intake: pass; durable intake `#1` is linked to `MF-HIOS-001`.
- Context: pass; `.harness/context/MF-HIOS-001-context.md` was generated.
- Architecture check: pass; zero application source files were available to
  scan.
- Trace: pass; durable trace `#1` achieved the required standard tier.
- Mechanical verification: pass; `git diff --check`.
- Story governance gate: pass; `story verify MF-HIOS-001`.
- Application build, unit, and E2E tests: not run because the application
  package entrypoints are absent from the working tree.
