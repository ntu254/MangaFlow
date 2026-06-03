# Multi-Agent Task Loop

This playbook defines how MangaFlow tasks should be handled when sub-agents,
plugins, skills, and local tools are available.

It is additive to `repository-harness/AGENTS.md`. Always follow the Harness
entrypoint first.

## 1. Mandatory Entry Gate

Before doing implementation work:

1. Read `repository-harness/AGENTS.md`.
2. Read `repository-harness/README.md` for the harness overview when broader
   context is needed.
3. Read the Harness operating docs required by the lane:
   - `docs/HARNESS.md`
   - `docs/FEATURE_INTAKE.md`
   - `docs/ARCHITECTURE.md`
   - `docs/CONTEXT_RULES.md`
4. Query proof state:

```powershell
.\scripts\bin\harness-cli.exe query matrix
```

5. Classify the request with `docs/FEATURE_INTAKE.md`.
6. Record intake:

```powershell
.\scripts\bin\harness-cli.exe intake --type "<type>" --summary "<summary>" --lane <tiny|normal|high-risk>
```

7. Read affected product docs and story packets before editing code.

## 2. Coordinator Responsibilities

The parent agent is always the coordinator. It owns:

- lane classification
- task decomposition
- critical-path decisions
- final integration
- validation proof
- Harness story/matrix updates
- trace recording
- final user report

The coordinator should keep the immediate blocking work local and delegate only
sidecar work that can run in parallel.

## 3. Agent Roles

| Role | Use | Write Scope |
| --- | --- | --- |
| Coordinator | Owns intake, plan, integration, validation, trace, and final answer. | Any, but must avoid overlapping workers. |
| Repo Scout | Answers codebase-state questions: modules, contracts, tests, risks. | Read-only. |
| Product/Harness Scout | Reads docs, matrix, decisions, stories, and identifies proof obligations. | Read-only. |
| Plugin/Skills Scout | Maps available plugins/skills/tools to the current task. | Read-only. |
| Worker | Implements a bounded code slice with a disjoint file/module scope. | Explicitly assigned files/modules only. |
| Reviewer/QA | Reviews changed code for bugs, missing tests, regressions, and proof gaps. | Read-only unless asked to patch fixes. |
| Browser Verifier | Checks rendered frontend behavior, console errors, visual/layout issues. | Read-only unless asked to patch UI fixes. |
| Deployment Agent | Handles Vercel/GitHub/deploy actions only when explicitly requested. | Deployment metadata and requested config. |

## 4. Delegation Rules

Use sub-agents only when the user explicitly asks for multi-agent work,
delegation, or parallel agent work.

Good delegation tasks:

- "Inspect auth and RBAC code paths; return gaps, do not edit."
- "Patch only `client/src/features/page/*` to add upload progress."
- "Run browser verification for the dev server and report console/layout issues."

Bad delegation tasks:

- broad "understand the whole repo" without a specific question
- urgent blocking work that the coordinator needs before the next step
- overlapping write scopes across workers
- asking multiple agents to solve the same unresolved problem

Worker prompts must include:

- the exact responsibility
- owned files/modules
- validation expected
- reminder that other agents may be editing and they must not revert others'
  changes

## 5. MangaFlow Current Codebase Map

Current primary surfaces:

- `client/`: React + Vite + TypeScript + Google OAuth + JWT + Tailwind/shadcn browser app.
- `server/`: Express + TypeScript modular monolith with Mongo/Mongoose, custom
  JWT auth, RBAC, storage, upload, and domain routes.
- `ai-service/`: FastAPI service, currently a thin health surface.
- `docs/`, `scripts/bin/harness-cli.exe`, and `harness.db`: Harness docs,
  durable story/proof/trace state, and workflow records.

Current implemented matrix highlights:

- `MF-001`: Auth/User Sync has unit/integration/platform proof.
- `MF-002`: Role Assignment has unit/integration/platform proof.
- `MF-003`: Admin Role Review UI has unit/integration/platform proof, no E2E.
- `MF-008`: File Upload & Cloudflare R2 has unit/integration/platform proof,
  no E2E.

Validation gaps to watch:

- `MF-004`, `MF-006`, and `MF-007` are marked implemented but have weak or
  missing proof compared with later stories.
- Browser E2E is still mostly deferred.
- Live provider proof for Google OAuth, Mongo fixtures, R2/MinIO, and AI processing is
  not broadly established.
- Do not print environment secrets while debugging.

## 6. Plugin And Skill Routing

### Build Web Apps Plugin

Use when work touches frontend design, browser UI, React quality, shadcn,
rendered debugging, or frontend validation.

| Skill | Use |
| --- | --- |
| `build-web-apps:frontend-app-builder` | New frontend experiences, dashboards, games, redesigns, visually rich UI. |
| `build-web-apps:frontend-testing-debugging` | Rendered UI bugs, console errors, layout/responsive regressions, local dev verification. |
| `build-web-apps:react-best-practices` | React/Next code quality, performance, hook/data-fetching review. |
| `build-web-apps:shadcn` | shadcn component install/composition/theming. |
| `build-web-apps:stripe-best-practices` | Payments and Stripe flows. |
| `build-web-apps:supabase-postgres-best-practices` | Postgres/Supabase schema/query guidance. |

For MangaFlow's current Vite app, prefer existing React/Tailwind/shadcn
patterns and verify rendered behavior when UI changes are user-visible.

### Vercel Plugin

Use for deployment, Vercel docs, deployment logs, protected deployment fetches,
browser verification skills, Vercel functions/storage/env guidance, and Vercel
AI tooling.

Key routes:

- `vercel-deploy` only when the user asks to deploy or create a preview.
- Vercel MCP deployment tools only when live Vercel project/deployment data is
  needed.
- `vercel:agent-browser` / `vercel:agent-browser-verify` / `vercel:verification`
  when a dev server or deployed page needs visual/runtime verification.
- `vercel:ai-sdk`, `vercel:ai-elements`, and `vercel:json-render` for AI UI and
  streaming interfaces.

### OpenAI Developers Plugin

Use for OpenAI API, Agents SDK, ChatGPT Apps, model selection, API-key setup,
and troubleshooting OpenAI requests.

Rules:

- Use official OpenAI docs for current API behavior.
- Do not print or grep secrets.
- Run credential setup only through trusted API-key setup flows.

### GitHub Plugin

Use for PR/issue triage, review-comment fixing, CI debugging, or publishing a
branch/PR when explicitly requested.

Rules:

- Do not commit, push, or open PRs unless the user asks.
- For review requests, findings come first.

### Local Skills

Useful local skill categories:

- architecture and API design: `architecture`, `api-design-principles`,
  `database-design`
- implementation quality: `typescript-expert`, `clean-code`,
  `react-best-practices`, `testing-patterns`, `test-driven-development`
- frontend design: `frontend-design`, `ui-styling`, `ui-ux-designer`,
  `web-design-guidelines`, `design-system`
- risk review: `security-auditor`, `code-review-checklist`,
  `debugging-strategies`, `performance-optimizer`
- assets/design: `imagegen-frontend-web`, `image-to-code-skill`, `brand`

Read only the relevant `SKILL.md` for the current task. Do not bulk-load every
skill.

## 7. Standard Multi-Agent Loop

### Step A - Intake And Proof Check

Coordinator:

- read entry docs
- record intake
- query matrix
- identify affected docs/stories
- choose lane

### Step B - Scout In Parallel

If the task is normal/high-risk or broad:

- Repo Scout maps code paths and tests.
- Product/Harness Scout maps docs, decisions, story requirements, and proof.
- Plugin/Skills Scout maps relevant tools and skill triggers.

The coordinator continues non-overlapping local work while scouts run.

### Step C - Plan The Cut

Coordinator creates a short plan:

- critical path
- delegated sidecar tasks
- write scopes
- validation ladder
- story/matrix/docs updates

For high-risk work, create the high-risk story packet before implementation and
record durable decisions when behavior/architecture/security/API contracts
change meaningfully.

### Step D - Implement

Coordinator and workers patch disjoint scopes.

Rules:

- Use `apply_patch` for manual edits.
- Preserve user changes.
- Follow existing module and API patterns.
- Parse unknown input at boundaries.
- Keep business rules in services/repositories, not UI or route glue.

### Step E - Integrate And Review

Coordinator:

- reviews worker output
- resolves conflicts
- runs targeted tests first
- uses Reviewer/QA or Browser Verifier for risky UI/runtime behavior

### Step F - Validate

Run the smallest proof that matches the story, then broader proof when needed.

Current common commands:

```powershell
npm run typecheck
npm run test
npm run build
npm run test:quick
.\scripts\bin\harness-cli.exe story verify <story-id>
```

Do not claim E2E or provider proof unless it was actually run.

### Step G - Persist Harness State

Update:

- story packet
- validation report
- `docs/TEST_MATRIX.md` when useful
- durable story status and proof flags
- decisions/backlog when needed

Then record trace:

```powershell
.\scripts\bin\harness-cli.exe trace --summary "<summary>" --outcome completed ...
```

### Step H - Final Report

Tell the user:

- what changed
- what proof passed
- what was not attempted
- next best action

## 8. Default Agent Split By Task Type

| Task Type | Suggested Split |
| --- | --- |
| Backend API/story | Coordinator owns route/service integration; Repo Scout checks existing modules; Reviewer checks tests/security. |
| Frontend UI | Coordinator owns data flow; Worker owns TSX/CSS slice; Browser Verifier checks rendered behavior; React skill reviews if multiple TSX files changed. |
| Auth/RBAC/security | High-risk. Coordinator owns decisions; Repo Scout checks auth boundaries; Reviewer checks bypasses and missing tests. |
| Storage/provider | High-risk if live provider behavior changes. Worker may own infra tests; Coordinator owns env/secret handling and docs. |
| Deployment | Deployment Agent/Vercel tools only after explicit deploy request; Coordinator reports deployment URL and unverified areas. |
| CI/GitHub | GitHub CI fixer or PR-comment agent only when requested; Coordinator avoids commit/push unless asked. |

## 9. Stop Conditions

Stop and ask the user only when:

- direction is ambiguous and a wrong assumption could change architecture,
  security, data ownership, or external provider behavior
- required credentials or live fixtures are missing
- validation reveals a blocker that cannot be safely solved locally

Otherwise, make the conservative repo-aligned assumption and continue.
