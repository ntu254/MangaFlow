# Mobile Flow Remediation Design

## Context

A senior-level review of `mobile/src` (Editor + Board flows) on `main@87fefa20` produced 19 findings across
session/auth integrity, submitted-file review, Board commands, navigation, and CI. This design groups them
into six independently shippable units.

Two verified facts shape the grouping:

- `mobile/scripts/check-utf8.mjs` is **0 bytes in HEAD** (1602 bytes at `677872db`, emptied by merge `73337a9e`).
  `npm run check:utf8` therefore always exits 0 and `npx jest` fails 5/154 on `main`.
- The PDF preview failure is a **shared backend defect**, not a mobile-only one: `contentTypeFor` has no `.pdf`
  branch, so every PDF is served `application/octet-stream` to mobile *and* to the web frontend's
  `<iframe>` viewer.

## Group index

| Group | Title | Lane | Surfaces | Size |
| --- | --- | --- | --- | --- |
| G1 | Unblock CI | infra | mobile | XS |
| G2 | Session and auth integrity | high-risk | mobile | L |
| G3 | Submitted-file PDF review | normal | backend + mobile (+ frontend benefits) | M |
| G4a | Board command contract (client) | high-risk | mobile | M |
| G4b | Cancel session note and version | high-risk | backend + mobile | S |
| G5 | Navigation and shell | normal | mobile | S |
| G6 | Polish, performance, docs | low | mobile + docs | S–M |

Lane names follow the Next Story Picker in `mobile/MOBILE_AGENT_CONTEXT.md`.

## Global constraints

- Capabilities stay backend-owned. No group may recompute eligibility, readiness, tally, ranking, or workflow
  transitions client-side; mobile only ever narrows an action, never re-enables one the backend disabled.
- No client-side mock data-source layer may be reintroduced as a live-failure fallback.
- Mobile scope stays Tantou Editor and Board/Board Chair. No Admin, Mangaka, or Assistant surface is added.
- Backend request-body additions are **additive and optional**, so the existing web frontend keeps working
  unchanged.
- Every group ends green on: `npm run lint --prefix mobile`, `npm test --prefix mobile`,
  `npm run build --prefix mobile`. Groups touching backend additionally end green on
  `npm run lint --prefix backend` and `npm run build --prefix backend`.

---

## G1 — Unblock CI

### Goal

Restore the UTF-8 source guard so `main` is green and every later group's test run is trustworthy.

### Scope

- Restore `mobile/scripts/check-utf8.mjs` to its last working content (`677872db`).

### Non-Goals

- Changing the guard's detection rules, extensions, or ignore list.
- Extending the scan to `backend/` or `frontend/`. The script resolves `scanRoot` to `mobile/` by default and
  that stays true.
- Fixing any mojibake the restored guard may report in unrelated files; that is G6.

### Decisions

- Restore by `git checkout 677872db -- mobile/scripts/check-utf8.mjs` rather than rewriting, so the hardened
  detection regex is recovered exactly as reviewed.
- Land before every other group. A red baseline makes all downstream review unreliable.

### Loop

1. `git checkout 677872db -- mobile/scripts/check-utf8.mjs`
2. `npm run check:utf8 --prefix mobile` — expect exit 0 with a `scanned N files` line, N > 0.
3. `npx jest src/__tests__/utf8-guard.test.ts` in `mobile/` — expect 6/6 green (was 1/6).
4. `npm test --prefix mobile` — expect 154/154.

---

## G2 — Session and auth integrity

### Goal

Make the mobile session survive concurrency, expiry, restart, and logout without stranding the user or
leaving a live refresh session on the server.

### Scope

- Single-flight refresh in `mobile-api-client.ts` so parallel 401s trigger exactly one `/auth/refresh`.
- `logoutMobile` revokes the refresh token that is actually current, and never leaves the UI stuck when the
  network call fails.
- A 401 that survives refresh signs the user out to the login screen instead of an infinite retry surface.
- Wire `restoreMobileSession` so a cold start with a valid stored token resumes the session.
- Remove the `x-mangaflow-e2e` login header.
- Gate demo credential prefill behind `__DEV__`.

### Non-Goals

- Any backend change. `/auth/refresh` rotation-with-revocation is correct as designed; mobile is the outlier.
- Biometric unlock, session pinning, or a "remember me" toggle.
- Changing token lifetimes or the SecureStore/sessionStorage split.
- Touching the frontend's auth client beyond reading it as a reference.

### Decisions

- Port the single-flight pattern already proven in `frontend/src/shared/api/client.ts` (`_refreshPromise`)
  rather than designing a new one. Same backend contract, same repo, one less variable.
- `logoutMobile` reads the current refresh token from `mobileAuthStorage` **before** clearing it, because the
  token held in React state is stale after any refresh and revokes an already-revoked session.
- Local state is cleared first and the `/auth/logout` call is best-effort inside `try/finally`. Logging out
  offline must still log the user out locally.
- Removing `x-mangaflow-e2e` is safe: `grep -rn "e2e" backend/src` returns no handler for it.

### Loop

1. Write failing tests first:
   - two concurrent requests both receiving 401 assert exactly **one** `/auth/refresh` call;
   - `logoutMobile` with a rejecting fetch asserts session state cleared and no stuck flag;
   - a cold start with a stored token asserts the workspace renders without the login screen.
2. `npx jest src/__tests__/mobile-api-client.test.ts src/__tests__/mobile-auth-storage.test.ts` — expect RED.
3. Implement.
4. Re-run the focused tests — expect GREEN.
5. `npm run lint --prefix mobile && npm test --prefix mobile && npm run build --prefix mobile`.
6. Manual: airplane-mode logout; kill and relaunch with a live session; leave the app idle past access-token
   expiry then open two tabs of work at once.

---

## G3 — Submitted-file PDF review

### Goal

Make a submitted PDF reviewable by every role on every platform, either inline or through an explicit,
explained external hand-off.

### Scope

- Backend: `contentTypeFor` maps `.pdf` to `application/pdf`.
- Mobile: `derivePreviewKind` becomes platform-aware — iOS renders PDF inline, Android and web route to the
  existing `external` branch.
- Mobile: the `external` branch copy states the real reason per file type.
- Mobile: proactive lease refresh before expiry, not only reactive `onError` recovery.
- Mobile: a 403 shows "Access denied" before the viewer closes.
- Tests covering all three `previewKind` branches and the backend content type.

### Non-Goals

- Rendering PDF inline on Android. Android's WebView has no PDF renderer; adding a native PDF library or a
  server-side page rasteriser is a separate story.
- Deep-linking into the web app at a specific review screen. `MOBILE_AGENT_CONTEXT.md` records that mobile has
  no approved destination contract, and `actionUrl` is deliberately stripped from notifications.
- Changing file permissions, `assertFileKeyVisible`, or the role/context visibility matrix.
- Persisting or caching display URLs.

### Decisions

- **External hand-off opens the display URL directly** via the existing `openExternally` path, not the web app.
  The token lives in the URL path, so no re-login is required, and `openExternally` already refreshes the lease
  before opening. The alternative — bouncing to the web app — costs a browser login and needs a destination
  contract that does not exist yet.
- Never auto-redirect and never use an `Alert`. Leaving the app is a user decision, and the viewer already
  renders a suitable "Open this file externally" surface.
- `derivePreviewKind` takes the platform as a defaulted parameter so tests can inject it, matching the
  injectable-dependency style used across the mobile data sources.
- The backend fix ships even if the mobile half slips: it independently repairs the web frontend's
  `materials-viewer` iframe, which consumes the same endpoint.

### Loop

1. Backend RED: assert `GET /api/files/display/:token` for a `.pdf` key returns `Content-Type: application/pdf`.
2. `npm test --prefix backend -- --run src/__tests__/file-access-url.test.ts` — expect RED, then implement,
   then GREEN.
3. Mobile RED: assert `derivePreviewKind("application/pdf", "ios") === "pdf"` and `"android" | "web" ===
   "external"`; assert the viewer renders the external surface for a PDF on Android; assert a 403 renders the
   denied message before `onClose` fires.
4. `npx jest src/__tests__/mobile-file-review.test.tsx` — RED, implement, GREEN.
5. `npm run lint --prefix mobile && npm test --prefix mobile && npm run build --prefix mobile`;
   `npm run lint --prefix backend && npm run build --prefix backend`.
6. Manual: open a PDF as Board on a proposal and as Editor on a chapter, on iOS and Android; confirm the web
   frontend's material viewer now renders PDF inline.

---

## G4a — Board command contract (client)

### Goal

Guarantee that every Board command mobile sends carries a validated, trustworthy session version, and that the
Chair can see what they are about to submit.

### Scope

- Validate `BoardSessionDetail` with zod, matching every sibling read in `board-mobile-data-source.ts`.
- Keep `expectedVersion` on close and tie-resolve wired through the validated value.
- Give the WEEKLY/MONTHLY cadence toggle a visible selected state.

### Non-Goals

- Any backend change. `expectedVersionFilter` already supports close, update, and resolve-tie.
- Changing tally, quorum, re-vote, or tie-policy semantics.
- Reintroducing an `ABSTAIN` vote value. It exists in neither backend nor mobile; the doc claiming it is wrong
  and is corrected in G6.

### Decisions

- The zod schema mirrors the existing `BoardSessionDetail` interface exactly; this group changes validation,
  not shape, so no screen logic moves.
- A contract failure surfaces as a normal error state with retry. It must not silently degrade into sending an
  `undefined` or coerced `expectedVersion`.
- The cadence toggle fix is grouped here rather than in polish because the Chair selects cadence immediately
  before `close`, inside the same flow this group is already validating.

### Loop

1. RED: feed `useBoardSession` a payload missing `session.version`; assert an error state rather than a
   mutation carrying a bad `expectedVersion`. Assert the selected cadence chip is distinguishable via
   `accessibilityState.selected` **and** style.
2. `npx jest src/__tests__/board-session-flow.test.tsx` — RED, implement, GREEN.
3. `npm run lint --prefix mobile && npm test --prefix mobile && npm run build --prefix mobile`.
4. Manual: as Chair, open a session, switch cadence, confirm the selection is visible before confirming close.

---

## G4b — Cancel session note and version

### Goal

Make Chair cancellation auditable and safe against stale state: record why the round was cancelled, and refuse
the cancellation when the session changed after the Chair last read it.

### Scope

- Mobile: `cancelBoardSession`, the `cancel` mutation, and `confirmChair` carry `{ expectedVersion, note }`.
- Backend: `cancelSession` parses an optional body; `cancelVotingSession` applies `expectedVersionFilter`,
  persists the note, increments `version`, and records the note in the audit entry.

### Non-Goals

- Making `expectedVersion` or `note` **required** on the backend. The web frontend calls this endpoint with
  `body: {}` (`frontend/src/shared/api/governance.ts`); a required field breaks it immediately.
- Changing who may cancel (`requireExactBoardChair`), the `status !== "OPEN"` guard, the proposal
  `BOARD_REVIEW` precondition, or the return-to-`PENDING_BOARD` effect.
- A schema migration. `looseSchema` is `strict: false`, so the note field needs no model declaration.
- Adding cancellation reasons to any other command.

### Decisions

- **Option B is adopted**: ship note *and* `expectedVersion` together. Option A (note only, ~8 lines) leaves the
  real risk unaddressed — the `status === "OPEN"` guard catches state changes but not content changes, so a
  Chair reading a stale 2/5 tally can still cancel a round that has since reached 5/5 and quorum.
  Option C (drop `requireReason` in the UI) only hides the symptom and forfeits the audit trail.
- `cancelVotingSession` converts from `session.save()` to `findOneAndUpdate` with `$inc: { version: 1 }`,
  copying the shape already used by tie-resolution in the same file. Cancel is currently the only session
  mutation that does not bump `version`.
- The proposal `BOARD_REVIEW` validation stays **before** the session update so the existing 409 test keeps
  passing unchanged.
- The note is written to the audit payload; persisting it on the session document is optional and additive.

### Loop

1. Backend RED: cancel with a stale `expectedVersion` expects 409 and an unchanged session; cancel with the
   correct `expectedVersion` and a note expects 200, `version` incremented, and the note present in the audit
   entry. Assert the three existing `voting-cancel.test.ts` cases still pass with `.send({})`.
2. `npm test --prefix backend -- --run src/__tests__/voting-cancel.test.ts` — RED, implement, GREEN.
3. Mobile RED: assert the cancel mutation receives the typed reason and version rather than `undefined`.
4. `npx jest src/__tests__/board-session-flow.test.tsx` — RED, implement, GREEN.
5. `npm run lint --prefix backend && npm run build --prefix backend`;
   `npm run lint --prefix mobile && npm test --prefix mobile && npm run build --prefix mobile`.
6. Regression check: exercise cancel from the **web** frontend with an empty body and confirm 200.

---

## G5 — Navigation and shell

### Goal

Make in-app navigation behave the way a native user expects: hardware back goes back, and every tap either
does something or explains why it cannot.

### Scope

- Android hardware back pops the open detail screen; at a list root it falls through to the OS default.
- `selectInboxItem` on the Board Today queue gives feedback instead of returning silently.

### Non-Goals

- Migrating workspace navigation to expo-router or a navigation library. Detail state stays local `useState`.
- Adding deep links, URL routes, or a navigation history stack.
- Changing tab structure or the tab-change reset behaviour.

### Decisions

- A `BackHandler` subscription lives in each workspace next to the existing tab-reset effect, so "which detail
  is open" stays the single source of truth for both back sources.
- An item that cannot be opened surfaces the reason rather than being made tappable-but-inert; the backend
  already supplies `blockers` and `disabledReason` for this.

### Non-obvious risk

`BackHandler` is a no-op on iOS and web, so tests must assert the subscription is registered rather than
simulating a platform event.

### Loop

1. RED: assert a registered hardware-back subscription closes an open detail and returns `true`, and returns
   `false` at the list root. Assert an `AT_RISK` item lacking `seriesId` renders feedback on tap.
2. `npx jest src/__tests__/board-at-risk-flow.test.tsx src/__tests__/today-screens.test.tsx` — RED, implement,
   GREEN.
3. `npm run lint --prefix mobile && npm test --prefix mobile && npm run build --prefix mobile`.
4. Manual on an Android device: open every detail screen per role and press hardware back.

---

## G6 — Polish, performance, docs

### Goal

Clear the remaining correctness-neutral debt and stop `MOBILE_AGENT_CONTEXT.md` from teaching future work the
wrong rules.

### Scope

- Replace the stray Vietnamese checklist string with English, matching the rest of the UI.
- Convert unbounded `ScrollView` + `.map()` lists to `FlatList` where the collection is user-data-sized.
- Reduce Board read amplification: `getBoardDecisionHistory` fetching every voting session, and
  `getBoardSessionDetail` costing two round trips.
- Correct three factual errors in `MOBILE_AGENT_CONTEXT.md`: the non-existent `ABSTAIN` vote value, the
  Priority tab described as the full inbox when it filters URGENT/HIGH, and the Reviews tab described as
  excluding `COMMENT_REVIEW` when it includes it.

### Non-Goals

- Introducing an i18n framework. This is a single-string consistency fix.
- Backend response reshaping for the round-trip reduction unless it proves free; otherwise defer.
- Rewriting design tokens or the `mf.tsx` component system.

### Decisions

- The documentation fix ships **first and separately**. It costs minutes and every hour it stays wrong is an
  hour it can misdirect an agent or a new contributor.
- Round-trip reduction is measured before it is optimised. If it requires a backend contract change, it is
  deferred to its own story rather than smuggled into a polish PR.

### Loop

1. Doc fix, reviewed against the code paths it describes, merged on its own.
2. RED for the list conversions: existing screen tests must keep passing; add an assertion that a long inbox
   renders without mounting every row where `FlatList` is introduced.
3. `npm run lint --prefix mobile && npm test --prefix mobile && npm run build --prefix mobile`.
4. Manual: scroll a long inbox and a long notification feed on a low-end Android device.

---

## Sequencing

```
G1 ──┬── G2   (mobile, high-risk)
     ├── G3   (backend + mobile)
     ├── G4a  (mobile, high-risk)  ── G4b (backend + mobile)
     └── G5   (mobile)
                     └── G6 (last, except the doc fix which ships immediately)
```

- G1 is the gate. Nothing else is reviewable until `main` is green.
- G2, G3, G4a, and G5 touch disjoint files and can run in parallel.
- G4b is sequenced after G4a only to avoid two PRs editing `board-session-detail-screen.tsx` at once.
- With one engineer: G1, G3, G2, G4a, G4b, G5, G6. G3 comes early because it repairs a defect users are
  hitting on both mobile and web.

## Cross-surface impact summary

| Group | Backend change | Frontend web impact |
| --- | --- | --- |
| G1 | none | none |
| G2 | none | none |
| G3 | `contentTypeFor` adds `.pdf` | **repairs** the existing iframe PDF viewer |
| G4a | none | none |
| G4b | optional body on `/voting-sessions/:id/cancel` | none, provided the fields stay optional |
| G5 | none | none |
| G6 | none, or deferred | none |

## Open questions

- Confirm by inspection that the web frontend's PDF viewer is currently broken for the same reason. The code
  path implies it; it has not been executed.
- Decide whether the cancellation note is persisted on the session document in addition to the audit entry.
  The audit entry alone satisfies the governance requirement.
