# Mobile UTF-8 CI Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the existing English mobile UI while preventing invalid UTF-8 or common mojibake from entering mobile source through local and CI checks.

**Architecture:** A dependency-free Node script scans tracked mobile text source and validates each file with a fatal UTF-8 decoder before applying a narrow mojibake heuristic. `package.json` exposes it as a standalone check and GitHub Actions runs it after a reproducible mobile dependency install, so developers get the same failure locally and in CI.

**Tech Stack:** Node.js built-ins (`fs`, `path`, `util`), npm, GitHub Actions, Jest.

## Global Constraints

- Keep all current mobile UI copy in English; do not translate strings as part of this work.
- Vietnamese text that legitimately exists in mobile source must remain UTF-8 and render correctly.
- The guard must scan `mobile/src`, `mobile/scripts`, and mobile root TypeScript/configuration files, while excluding `node_modules`, build output, and generated Expo metadata.
- CI must run `npm ci --prefix mobile` and then `npm run check:utf8 --prefix mobile` on a supported LTS Node release.
- The guard must fail non-zero for invalid UTF-8 and mojibake, and name the failing path in its error output.

---

### Task 1: Add the UTF-8 source guard and its test coverage

**Files:**
- Create: `mobile/scripts/check-utf8.mjs`
- Create: `mobile/src/__tests__/utf8-guard.test.ts`
- Modify: `mobile/package.json`

**Interfaces:**
- Produces: `npm run check:utf8`, which invokes `node scripts/check-utf8.mjs [directory]` and exits `0` when every scanned file is valid.
- The optional directory argument exists only for deterministic fixture tests; no argument scans the mobile project root.

- [ ] **Step 1: Write the failing test**

Add a Jest test that creates a temporary directory with `valid.ts` containing `const title = \"Tôi là series\";`, runs `node mobile/scripts/check-utf8.mjs <tempdir>`, and expects status `0`. Add a second test that writes the UTF-8 bytes for `const title = \"Ã´\";` to `broken.ts`, runs the same command, and expects a non-zero status whose combined output contains `broken.ts` and `mojibake`.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test --prefix mobile -- utf8-guard --runInBand`

Expected: FAIL because `mobile/scripts/check-utf8.mjs` does not yet exist.

- [ ] **Step 3: Implement the minimal guard**

Create `check-utf8.mjs` with these exact behaviors:

```js
const scanRoot = process.argv[2] ?? projectRoot;
const supportedExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md"]);
const ignoredDirectoryNames = new Set(["node_modules", "dist", ".expo"]);
```

Walk directories recursively in sorted order. For every supported file, call `new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(file))`; collect a failure if decoding throws. On decoded text, reject the common mojibake marker sequence `/[ÃÂ][\u0080-\u00BF]|\uFFFD/` and report it as `mojibake`. Print every failure as `<relative path>: <reason>` to stderr, exit `1` when any failure exists, otherwise print a concise scanned-file count and exit `0`.

Add the package script:

```json
"check:utf8": "node scripts/check-utf8.mjs"
```

- [ ] **Step 4: Run focused and project checks**

Run: `npm test --prefix mobile -- utf8-guard --runInBand`

Expected: PASS, including the valid Vietnamese fixture and rejected mojibake fixture.

Run: `npm run check:utf8 --prefix mobile`

Expected: PASS and reports a positive count of scanned files.

- [ ] **Step 5: Commit**

```bash
git add mobile/scripts/check-utf8.mjs mobile/src/__tests__/utf8-guard.test.ts mobile/package.json
git commit -m "test: add mobile UTF-8 source guard"
```

### Task 2: Run the guard in CI

**Files:**
- Create: `.github/workflows/mobile-quality.yml`

**Interfaces:**
- Consumes: the `check:utf8` script from Task 1 and `mobile/package-lock.json`.
- Produces: a `mobile-quality` GitHub Actions check for pull requests and pushes.

- [ ] **Step 1: Write the workflow**

Create the workflow with `name: Mobile quality`, trigger on `push` and `pull_request`, and one `mobile-quality` job on `ubuntu-latest`. It must checkout the repository, use `actions/setup-node@v4` with `node-version: 22` and `cache: npm`/`cache-dependency-path: mobile/package-lock.json`, then run exactly:

```yaml
- run: npm ci --prefix mobile
- run: npm run check:utf8 --prefix mobile
- run: npm run lint --prefix mobile
- run: npm test --prefix mobile
```

- [ ] **Step 2: Validate the workflow inputs locally**

Run: `npm ci --prefix mobile --ignore-scripts`

Expected: exits `0` against the committed mobile lockfile. Then run `npm run check:utf8 --prefix mobile`, `npm run lint --prefix mobile`, and `npm test --prefix mobile`; each exits `0`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/mobile-quality.yml
git commit -m "ci: verify mobile UTF-8 and quality"
```

## Plan self-review

- Spec coverage: Task 1 covers correct UTF-8, visible Vietnamese fixture, invalid/mis-decoded text rejection, local command, and actionable paths. Task 2 runs the same command under clean dependency installation in CI.
- Placeholder scan: no TBD/TODO markers, undefined interfaces, or unspecified tests remain.
- Type consistency: the command in Task 2 is exactly the package script produced by Task 1.
