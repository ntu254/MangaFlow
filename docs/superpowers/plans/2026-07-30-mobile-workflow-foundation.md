# Mobile Workflow Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the typed, authenticated Queue-first foundation used by both Editor and Board mobile workflows, with live inbox projections and no silent mock fallback.

**Architecture:** Backend inbox projections return versioned `MobileWorkItem` records whose priority, blockers, and action capabilities are derived from canonical services. The Expo client validates those records with Zod, stores refresh credentials safely, uses TanStack Query for server state, and renders a shared Queue-first shell. This plan delivers live Editor proposal and Board vote Today queues; later plans extend the same contract with Editor and Board workflow details.

**Tech Stack:** Expo SDK 56, React 19, React Native 0.85, Expo Router, TypeScript, Zod, TanStack Query v5, Expo SecureStore, Jest Expo, React Native Testing Library, Express 5, Mongoose 9, Vitest, Supertest.

## Global Constraints

- Only authenticated `EDITOR` and `BOARD` accounts enter the mobile application.
- Authenticated role and designation come from `/api/auth/me`; there is no manual role switch.
- Live mode never silently falls back to mock workflow data.
- Mock mode requires `EXPO_PUBLIC_ENABLE_MOBILE_MOCK_FALLBACK=true` and displays a persistent `Demo data` label.
- Mobile never calculates workflow eligibility, readiness, quorum, tally, result, or transition state.
- Backend inbox items include canonical status, priority reason, blockers, action capability, and current version.
- Consequential actions are submitted only from detail/confirmation surfaces, never directly from a queue card.
- Interactive targets are at least 44 logical pixels.
- Do not upgrade Expo, React, or React Native core versions as part of this plan.
- Preserve unrelated dirty backend, frontend, and mobile changes.

## File Structure

### Backend

- Create `backend/src/mobile/mobile-work-item.contract.ts`: shared backend DTO and Zod schemas.
- Create `backend/src/services/mobile-inbox.service.ts`: actor-aware Editor/Board inbox projections.
- Modify `backend/src/controllers/mobile.controller.ts`: thin inbox handlers only.
- Modify `backend/src/routes/mobile.routes.ts`: `GET /editor/inbox` and `GET /board/inbox`.
- Create `backend/src/__tests__/mobile-inbox.test.ts`: contract, role, and projection integration coverage.

### Mobile

- Modify `mobile/package.json` and `mobile/tsconfig.json`: testing/runtime dependencies and scripts.
- Create `mobile/jest.setup.ts`: React Native Testing Library setup.
- Create `mobile/src/domain/mobile-work-item.ts`: client Zod schemas and inferred types.
- Create `mobile/src/services/mobile-api-error.ts`: normalized HTTP/business error.
- Create `mobile/src/services/mobile-api-client.ts`: auth-aware JSON client.
- Create `mobile/src/services/mobile-auth-storage.ts`: native SecureStore and web session storage adapter.
- Modify `mobile/src/services/mobile-auth.ts`: designation-aware session restore/login/logout.
- Create `mobile/src/services/mobile-inbox-data-source.ts`: typed inbox queries.
- Create `mobile/src/providers/mobile-query-provider.tsx`: stable QueryClient and retry policy.
- Create `mobile/src/hooks/use-mobile-inbox.ts`: role-keyed inbox queries.
- Create `mobile/src/components/work-item-card.tsx`: accessible shared queue card.
- Create `mobile/src/components/workflow-confirmation-sheet.tsx`: shared confirmation shell for later mutations.
- Create `mobile/src/screens/editor-today-screen.tsx`: live Editor Today queue.
- Create `mobile/src/screens/board-today-screen.tsx`: live Board Today queue.
- Modify `mobile/src/app/_layout.tsx`: query/session provider composition.
- Modify `mobile/src/MangaFlowMobileApp.tsx`: identity-driven Queue-first navigation.
- Add focused Jest tests beside the new modules under `mobile/src/__tests__/`.

---

### Task 1: Install the supported mobile test and server-state stack

**Files:**

- Modify: `mobile/package.json`
- Modify: `mobile/package-lock.json`
- Modify: `mobile/tsconfig.json`
- Create: `mobile/jest.setup.ts`
- Create: `mobile/src/__tests__/testing-stack.test.tsx`

**Interfaces:**

- Consumes: Expo SDK 56 and React 19 already pinned by `mobile/package.json`.
- Produces: `npm test --prefix mobile -- --runInBand`, Jest Expo preset, React Native Testing Library, Zod, TanStack Query, and SecureStore.

- [ ] **Step 1: Install Expo-compatible test and storage packages**

```powershell
cd mobile
npx expo install expo-secure-store
npm install @tanstack/react-query zod
npx expo install jest-expo jest @types/jest @testing-library/react-native "--" --dev
```

Expected: Expo selects SDK-compatible native package versions and updates both package files.

- [ ] **Step 2: Configure deterministic test scripts**

Set these exact package fields:

```json
{
  "scripts": {
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "test:legacy": "node --test ./src/__tests__/mobile-data.test.mjs"
  },
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterEnv": ["<rootDir>/jest.setup.ts"],
    "testMatch": ["<rootDir>/src/**/*.test.{ts,tsx}"]
  }
}
```

Add `"jest"` to `compilerOptions.types` without removing existing Expo types.

- [ ] **Step 3: Write the first component test**

```tsx
import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

it("renders React 19 components through jest-expo", () => {
  render(<Text accessibilityRole="header">Mobile workflow tests ready</Text>);
  expect(screen.getByRole("header", { name: "Mobile workflow tests ready" })).toBeVisible();
});
```

In `jest.setup.ts`, import the supported matchers:

```ts
import "@testing-library/react-native/extend-expect";
```

- [ ] **Step 4: Run the new and legacy tests**

```powershell
npm test -- --runInBand
npm run test:legacy
```

Expected: both commands pass. If the installed Testing Library already registers matchers, remove only the redundant setup import and keep the render assertion.

- [ ] **Step 5: Commit**

```powershell
git add mobile/package.json mobile/package-lock.json mobile/tsconfig.json mobile/jest.setup.ts mobile/src/__tests__/testing-stack.test.tsx
git commit -m "test: add Expo mobile behavior test stack"
```

### Task 2: Define the versioned backend and client work-item contract

**Files:**

- Create: `backend/src/mobile/mobile-work-item.contract.ts`
- Create: `backend/src/__tests__/mobile-work-item.contract.test.ts`
- Create: `mobile/src/domain/mobile-work-item.ts`
- Create: `mobile/src/__tests__/mobile-work-item.test.ts`

**Interfaces:**

- Consumes: backend Zod 4 and mobile Zod.
- Produces: `MobileWorkItem`, `MobileWorkItemKind`, `MobileWorkflowAction`, `MobileWorkflowActionDescriptor`, `MobileInbox`, `mobileWorkItemSchema`, and `mobileInboxSchema` with identical serialized fields on both sides.

- [ ] **Step 1: Write failing backend contract tests**

```ts
import { describe, expect, it } from "vitest";
import { mobileWorkItemSchema } from "../mobile/mobile-work-item.contract.js";

it("accepts a backend-owned proposal work item", () => {
  expect(mobileWorkItemSchema.parse({
    id: "PROPOSAL_REVIEW:p-001",
    kind: "PROPOSAL_REVIEW",
    entityType: "PROPOSAL",
    entityId: "p-001",
    status: "PENDING_EDITOR",
    version: 3,
    title: "Neon District",
    subtitle: "Revision 2",
    priority: { level: "HIGH", reason: "Revision received", dueAt: null },
    blockers: [],
    actions: [{
      action: "CLAIM",
      enabled: true,
      disabledReason: null,
      requiresConfirmation: true,
      requiresReason: false,
    }],
    summary: {},
  }).entityId).toBe("p-001");
});

it("rejects an enabled action that also has a disabled reason", () => {
  const invalid = validProposalItem();
  invalid.actions[0] = { ...invalid.actions[0], enabled: true, disabledReason: "Not assigned" };
  expect(() => mobileWorkItemSchema.parse(invalid)).toThrow();
});
```

- [ ] **Step 2: Run the backend contract test and verify red**

```powershell
cd backend
npx vitest run src/__tests__/mobile-work-item.contract.test.ts
```

Expected: FAIL because the contract module does not exist.

- [ ] **Step 3: Implement the backend schema and types**

Define exact enums:

```ts
export const mobileWorkItemKindSchema = z.enum([
  "PROPOSAL_REVIEW",
  "CHAPTER_REVIEW",
  "COMMENT_REVIEW",
  "PUBLICATION",
  "BOARD_VOTE",
  "SESSION_FINALIZE",
  "BOARD_REVOTE",
  "AT_RISK",
]);

export const mobileWorkflowActionSchema = z.enum([
  "CLAIM",
  "REQUEST_CHANGES",
  "REJECT",
  "FORWARD",
  "REQUEST_REVISION",
  "EDITOR_APPROVE",
  "COMMENT_CREATE",
  "COMMENT_REPLY",
  "COMMENT_RESOLVE",
  "COMMENT_REOPEN",
  "SCHEDULE",
  "POSTPONE",
  "PUBLISH",
  "VOTE",
  "SESSION_CREATE",
  "SESSION_UPDATE",
  "SESSION_CLOSE",
  "SESSION_CANCEL",
  "SESSION_FINALIZE",
  "AT_RISK_DECIDE",
]);
```

Use a `superRefine` rule: enabled actions require `disabledReason === null`; disabled actions require a non-empty reason. Export `MobileWorkItem = z.infer<typeof mobileWorkItemSchema>`.

Define the descriptor and inbox shapes in the same module:

```ts
export const mobileWorkflowActionDescriptorSchema = z.object({
  action: mobileWorkflowActionSchema,
  enabled: z.boolean(),
  disabledReason: z.string().min(1).nullable(),
  requiresConfirmation: z.boolean(),
  requiresReason: z.boolean(),
}).superRefine((value, context) => {
  if (value.enabled && value.disabledReason !== null) {
    context.addIssue({ code: "custom", message: "Enabled actions cannot have a disabled reason." });
  }
  if (!value.enabled && value.disabledReason === null) {
    context.addIssue({ code: "custom", message: "Disabled actions require a reason." });
  }
});

export const mobileInboxSchema = z.object({
  role: z.enum(["EDITOR", "BOARD"]),
  generatedAt: z.string().datetime(),
  items: z.array(mobileWorkItemSchema),
});

export type MobileWorkflowActionDescriptor =
  z.infer<typeof mobileWorkflowActionDescriptorSchema>;
export type MobileInbox = z.infer<typeof mobileInboxSchema>;
```

- [ ] **Step 4: Mirror and test the client runtime schema**

Create the same serialized schema in `mobile/src/domain/mobile-work-item.ts`. Add:

```ts
it("fails closed on an unknown backend action", () => {
  const value = validProposalItem();
  value.actions[0].action = "CLIENT_GUESSED_ACTION";
  expect(() => mobileWorkItemSchema.parse(value)).toThrow();
});
```

- [ ] **Step 5: Run both contract suites**

```powershell
npx vitest run src/__tests__/mobile-work-item.contract.test.ts
cd ../mobile
npm test -- --runInBand src/__tests__/mobile-work-item.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add backend/src/mobile/mobile-work-item.contract.ts backend/src/__tests__/mobile-work-item.contract.test.ts mobile/src/domain/mobile-work-item.ts mobile/src/__tests__/mobile-work-item.test.ts
git commit -m "feat: define mobile workflow item contract"
```

### Task 3: Add actor-aware Editor and Board inbox projections

**Files:**

- Create: `backend/src/services/mobile-inbox.service.ts`
- Modify: `backend/src/controllers/mobile.controller.ts`
- Modify: `backend/src/routes/mobile.routes.ts`
- Create: `backend/src/__tests__/mobile-inbox.test.ts`

**Interfaces:**

- Consumes: `editorReviewQueue()`, `boardQueue()`, `RequestActor`, and the Task 2 contract.
- Produces: `getEditorMobileInbox(actor)` and `getBoardMobileInbox(actor)` plus `GET /api/editor/inbox` and `GET /api/board/inbox`.

- [ ] **Step 1: Write failing role and response tests**

Use `MongoMemoryReplSet`, `seedDatabase()`, and the existing `loginAs` pattern:

```ts
it("returns only proposal work to an Editor in the foundation slice", async () => {
  const editor = await loginAs("editor@mangaflow.local");
  const response = await request(createApp())
    .get("/api/editor/inbox")
    .set("Authorization", `Bearer ${editor.accessToken}`)
    .expect(200);

  expect(response.body.data.items.length).toBeGreaterThan(0);
  expect(response.body.data.items.every((item: any) => item.kind === "PROPOSAL_REVIEW")).toBe(true);
  expect(() => mobileInboxSchema.parse(response.body.data)).not.toThrow();
});

it("does not expose Chair actions to an ordinary Board member", async () => {
  const board = await loginAs("board.member@mangaflow.local");
  const response = await request(createApp())
    .get("/api/board/inbox")
    .set("Authorization", `Bearer ${board.accessToken}`)
    .expect(200);
  expect(response.body.data.items.flatMap((item: any) => item.actions)
    .some((action: any) => action.action === "SESSION_FINALIZE")).toBe(false);
});

it.each(["jun@beachread.jp", "admin@mangaflow.local"])(
  "denies unsupported mobile role %s",
  async (email) => {
    const user = await loginAs(email);
    await request(createApp())
      .get("/api/editor/inbox")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .expect(403);
  },
);
```

- [ ] **Step 2: Run the inbox integration test and verify red**

```powershell
cd backend
npx vitest run src/__tests__/mobile-inbox.test.ts
```

Expected: FAIL with route not found.

- [ ] **Step 3: Implement projection functions**

Create functions with actor arguments:

```ts
export async function getEditorMobileInbox(actor: RequestActor): Promise<MobileInbox> {
  if (actor.role !== "EDITOR") throw forbidden("Editor permission is required.");
  const proposals = await editorReviewQueue();
  return mobileInboxSchema.parse({
    role: "EDITOR",
    generatedAt: new Date().toISOString(),
    items: proposals.map((proposal) => proposalWorkItem(actor, proposal)),
  });
}

export async function getBoardMobileInbox(actor: RequestActor): Promise<MobileInbox> {
  if (actor.role !== "BOARD") throw forbidden("Board permission is required.");
  const items = await boardQueue();
  return mobileInboxSchema.parse({
    role: "BOARD",
    generatedAt: new Date().toISOString(),
    items: items.filter(isProposalVoteItem).map((item) => boardVoteWorkItem(actor, item)),
  });
}
```

`proposalWorkItem` may expose only `CLAIM`, `REQUEST_CHANGES`, `REJECT`, and `FORWARD` according to returned claim/status data. `boardVoteWorkItem` exposes only `VOTE` in this slice. Do not expose at-risk or finalization until the Board plan supplies canonical descriptors.

- [ ] **Step 4: Add thin handlers and routes**

Handlers call `requireActor(req)` and `ok(res, await get...Inbox(actor))`. Routes use `requireExactRole("EDITOR")` and `requireExactRole("BOARD")`.

- [ ] **Step 5: Run inbox and authorization tests**

```powershell
npx vitest run src/__tests__/mobile-inbox.test.ts src/__tests__/authorization-perimeter.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add backend/src/services/mobile-inbox.service.ts backend/src/controllers/mobile.controller.ts backend/src/routes/mobile.routes.ts backend/src/__tests__/mobile-inbox.test.ts
git commit -m "feat: add role-aware mobile inbox projections"
```

### Task 4: Build the typed API client and secure session restoration

**Files:**

- Create: `mobile/src/services/mobile-api-error.ts`
- Create: `mobile/src/services/mobile-api-client.ts`
- Create: `mobile/src/services/mobile-auth-storage.ts`
- Modify: `mobile/src/services/mobile-auth.ts`
- Create: `mobile/src/__tests__/mobile-api-client.test.ts`
- Create: `mobile/src/__tests__/mobile-auth-storage.test.ts`

**Interfaces:**

- Consumes: `getMobileApiBaseUrl()`, `/auth/login`, `/auth/me`, `/auth/refresh`, `/auth/logout`.
- Produces: `MobileApiError`, `mobileApi.request<T>()`, `restoreMobileSession()`, and platform-aware refresh-token persistence.

- [ ] **Step 1: Write failing normalized-error tests**

```ts
it("preserves backend conflict codes and request ids", async () => {
  global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
    success: false,
    code: "CONFLICT",
    message: "This workflow changed.",
  }), { status: 409, headers: { "x-request-id": "req-9" } }));

  await expect(mobileApi.request("/editor/inbox")).rejects.toMatchObject({
    name: "MobileApiError",
    status: 409,
    code: "CONFLICT",
    requestId: "req-9",
  });
});
```

Add storage tests that mock `Platform.OS` and verify native calls `SecureStore.setItemAsync`, while web calls `sessionStorage.setItem`.

- [ ] **Step 2: Run and verify red**

```powershell
cd mobile
npm test -- --runInBand src/__tests__/mobile-api-client.test.ts src/__tests__/mobile-auth-storage.test.ts
```

- [ ] **Step 3: Implement the API error and request client**

```ts
export class MobileApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "MobileApiError";
  }
}
```

The client owns one in-memory access token, adds `Authorization`, parses the `{ success, data, code, message }` envelope, makes one refresh attempt on `401`, and never logs tokens or response bodies.

- [ ] **Step 4: Implement secure refresh-token storage**

Use `expo-secure-store` for native. On web, use `sessionStorage`, not `localStorage`. Export:

```ts
export const mobileAuthStorage = {
  getRefreshToken(): Promise<string | null>,
  setRefreshToken(value: string): Promise<void>,
  clearRefreshToken(): Promise<void>,
};
```

- [ ] **Step 5: Refactor auth around identity restoration**

Extend `MobileAuthUser` with:

```ts
isChair?: boolean;
isEditorInChief?: boolean;
```

Add `restoreMobileSession()` that reads the refresh token, refreshes once, verifies `/auth/me`, rejects unsupported roles, and returns `null` on an expired session after clearing storage. Remove direct calls to `setMobileWorkflowAuthToken`; Task 7 will retire that global-token boundary.

- [ ] **Step 6: Run focused tests and typecheck**

```powershell
npm test -- --runInBand src/__tests__/mobile-api-client.test.ts src/__tests__/mobile-auth-storage.test.ts
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add mobile/src/services/mobile-api-error.ts mobile/src/services/mobile-api-client.ts mobile/src/services/mobile-auth-storage.ts mobile/src/services/mobile-auth.ts mobile/src/__tests__/mobile-api-client.test.ts mobile/src/__tests__/mobile-auth-storage.test.ts
git commit -m "feat: add secure typed mobile API session"
```

### Task 5: Add TanStack Query and typed inbox hooks

**Files:**

- Create: `mobile/src/services/mobile-inbox-data-source.ts`
- Create: `mobile/src/providers/mobile-query-provider.tsx`
- Create: `mobile/src/hooks/use-mobile-inbox.ts`
- Create: `mobile/src/test/test-query-provider.tsx`
- Modify: `mobile/src/app/_layout.tsx`
- Create: `mobile/src/__tests__/use-mobile-inbox.test.tsx`

**Interfaces:**

- Consumes: `mobileApi.request`, `mobileInboxSchema`, and Task 3 endpoints.
- Produces: `mobileInboxKeys`, `getMobileInbox(role)`, `useMobileInbox(role)`, and one stable app QueryClient.

- [ ] **Step 1: Write a failing hook test**

```tsx
function InboxProbe({
  role,
  getInbox,
}: {
  role: MobileAuthRole;
  getInbox: (role: MobileAuthRole) => Promise<MobileInbox>;
}) {
  const query = useMobileInbox(role, getInbox);
  return <Text>{query.data?.items[0]?.title ?? "Loading"}</Text>;
}

it("loads and validates the Editor inbox", async () => {
  const getInbox = jest.fn().mockResolvedValue(editorInboxFixture);
  render(
    <TestQueryProvider>
      <InboxProbe role="editor" getInbox={getInbox} />
    </TestQueryProvider>,
  );
  expect(await screen.findByText("Neon District")).toBeVisible();
  expect(getInbox).toHaveBeenCalledWith("editor");
});
```

Add a second test that returns an unknown action and expects the contract-error state rather than demo data.

- [ ] **Step 2: Run and verify red**

```powershell
cd mobile
npm test -- --runInBand src/__tests__/use-mobile-inbox.test.tsx
```

- [ ] **Step 3: Implement the typed data source and query keys**

```ts
export const mobileInboxKeys = {
  all: ["mobile-inbox"] as const,
  role: (role: MobileAuthRole) => [...mobileInboxKeys.all, role] as const,
};

export async function getMobileInbox(role: MobileAuthRole): Promise<MobileInbox> {
  const path = role === "editor" ? "/editor/inbox" : "/board/inbox";
  return mobileInboxSchema.parse(await mobileApi.request(path));
}
```

- [ ] **Step 4: Configure QueryClient behavior**

Create a stable client with queries retrying network/`5xx` failures at most twice. Do not retry `400`, `401`, `403`, `404`, `409`, `422`, or `429`. Mutations default to zero retries.

Create `TestQueryProvider` with a new `QueryClient` per test:

```tsx
export function TestQueryProvider({ children }: PropsWithChildren) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 5: Wrap the app layout**

`mobile/src/app/_layout.tsx` wraps `ThemeProvider` content with `MobileQueryProvider`. Keep `SafeAreaProvider` behavior unchanged if already supplied by Expo.

- [ ] **Step 6: Run tests and typecheck**

```powershell
npm test -- --runInBand src/__tests__/use-mobile-inbox.test.tsx
npm run lint
```

- [ ] **Step 7: Commit**

```powershell
git add mobile/src/services/mobile-inbox-data-source.ts mobile/src/providers/mobile-query-provider.tsx mobile/src/hooks/use-mobile-inbox.ts mobile/src/test/test-query-provider.tsx mobile/src/app/_layout.tsx mobile/src/__tests__/use-mobile-inbox.test.tsx
git commit -m "feat: query typed mobile workflow inboxes"
```

### Task 6: Build shared Queue-first cards, states, and Today screens

**Files:**

- Create: `mobile/src/components/work-item-card.tsx`
- Create: `mobile/src/components/workflow-state.tsx`
- Create: `mobile/src/components/workflow-confirmation-sheet.tsx`
- Create: `mobile/src/screens/editor-today-screen.tsx`
- Create: `mobile/src/screens/board-today-screen.tsx`
- Create: `mobile/src/__tests__/today-screens.test.tsx`

**Interfaces:**

- Consumes: `MobileWorkItem`, `useMobileInbox`, shared MangaFlow design tokens/icons.
- Produces: `WorkItemCard`, `WorkflowState`, `WorkflowConfirmationSheet`, `EditorTodayScreen`, and `BoardTodayScreen`.

- [ ] **Step 1: Write failing UI behavior tests**

```tsx
it("shows backend priority and opens detail without mutating from the card", async () => {
  const onSelect = jest.fn();
  render(<WorkItemCard item={urgentProposalFixture} onSelect={onSelect} />);
  expect(screen.getByText("Revision received")).toBeVisible();
  expect(screen.queryByRole("button", { name: /reject/i })).toBeNull();
  fireEvent.press(screen.getByRole("button", { name: /open Neon District/i }));
  expect(onSelect).toHaveBeenCalledWith(urgentProposalFixture);
});

it("renders a success empty state without demo rows", () => {
  render(<EditorTodayScreen inbox={{ ...editorInboxFixture, items: [] }} />);
  expect(screen.getByText("No decisions need your attention.")).toBeVisible();
  expect(screen.queryByText("Demo data")).toBeNull();
});
```

- [ ] **Step 2: Run and verify red**

```powershell
cd mobile
npm test -- --runInBand src/__tests__/today-screens.test.tsx
```

- [ ] **Step 3: Implement accessible queue components**

`WorkItemCard` uses one `Pressable` with:

```tsx
accessibilityRole="button"
accessibilityLabel={`Open ${item.title}, ${item.status}, ${item.priority.reason}`}
```

Display no more than two blocker/status badges and cap title text to two lines. Use `minHeight: 44` for all interactive elements.

- [ ] **Step 4: Implement common loading/error/empty states**

`WorkflowState` supports:

```ts
type WorkflowStateProps =
  | { kind: "loading" }
  | { kind: "empty"; title: string; description: string }
  | { kind: "error"; error: MobileApiError | Error; onRetry: () => void };
```

Never import mock data from the component.

- [ ] **Step 5: Implement Editor and Board Today screens**

Both screens render backend order without re-sorting. Editor copy is proposal-focused in this slice; Board copy is vote-focused. Preserve pull-to-refresh and background-refresh indication from the query.

- [ ] **Step 6: Run focused tests, typecheck, and web export**

```powershell
npm test -- --runInBand src/__tests__/today-screens.test.tsx
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add mobile/src/components/work-item-card.tsx mobile/src/components/workflow-state.tsx mobile/src/components/workflow-confirmation-sheet.tsx mobile/src/screens/editor-today-screen.tsx mobile/src/screens/board-today-screen.tsx mobile/src/__tests__/today-screens.test.tsx
git commit -m "feat: add Queue-first mobile Today screens"
```

### Task 7: Replace the role shell and disable silent fallback

**Files:**

- Modify: `mobile/src/MangaFlowMobileApp.tsx`
- Modify: `mobile/src/services/mobile-workflow-data-source.ts`
- Modify: `mobile/src/config/mobile-env.ts`
- Modify: `mobile/src/data/mobile-data.ts`
- Modify: `mobile/README.md`
- Modify: `mobile/src/__tests__/mobile-data.test.mjs`
- Create: `mobile/src/__tests__/mobile-shell.test.tsx`

**Interfaces:**

- Consumes: `restoreMobileSession`, authenticated `MobileAuthUser`, `EditorTodayScreen`, `BoardTodayScreen`.
- Produces: identity-driven navigation, avatar profile/logout entry, four role tabs, and explicit demo-only fallback.

- [ ] **Step 1: Write failing shell tests**

```tsx
it("uses the authenticated role and never renders a role switch", async () => {
  render(<MangaFlowMobileApp initialSession={editorSessionFixture} />);
  expect(await screen.findByText("Today")).toBeVisible();
  expect(screen.getByText("Tantou Editor")).toBeVisible();
  expect(screen.queryByText("Board Demo")).toBeNull();
  expect(screen.queryByRole("button", { name: /switch role/i })).toBeNull();
});

it("labels explicit mock mode", () => {
  render(<MangaFlowMobileApp initialSession={editorSessionFixture} forceDemoMode />);
  expect(screen.getByText("Demo data")).toBeVisible();
});
```

- [ ] **Step 2: Run and verify red**

```powershell
cd mobile
npm test -- --runInBand src/__tests__/mobile-shell.test.tsx
```

- [ ] **Step 3: Refactor the shell**

Use exact tab sets:

```ts
const editorTabs = ["today", "reviews", "publish", "history"] as const;
const boardTabs = ["today", "sessions", "ranking", "history"] as const;
```

Profile/logout moves to the avatar menu. `session.user.role` selects the tab set. `isChair` changes designation copy only; it does not change role.

- [ ] **Step 4: Remove fallback from live data-source behavior**

`mobileWorkflowDataSource` selects mock only when `mobileEnv.enableMockFallback === true`. A live read failure throws `MobileApiError`; it does not return `@/data/editor` or `@/data/board`.

Keep reference fixtures for tests/demo mode, but rename UI messages from `lastMockAction` to `lastActionMessage`.

- [ ] **Step 5: Update documentation and legacy assertions**

README states:

- Live mode is default.
- Demo mode is explicitly labeled.
- Editor and Board identities come from auth.
- The foundation slice exposes live proposal/vote Today queues; later plans complete the remaining tabs.

Replace regex assertions that require silent fallback or Board tie-break UI with assertions for explicit demo gating and re-vote wording.

- [ ] **Step 6: Run the full foundation verification**

```powershell
cd backend
npx vitest run src/__tests__/mobile-work-item.contract.test.ts src/__tests__/mobile-inbox.test.ts src/__tests__/authorization-perimeter.test.ts
npm run build
cd ../mobile
npm test -- --runInBand
npm run test:legacy
npm run lint
npm run build
npx expo install --check
```

Expected: all tests/builds pass and Expo reports no incompatible package versions.

- [ ] **Step 7: Commit**

```powershell
git add mobile/src/MangaFlowMobileApp.tsx mobile/src/services/mobile-workflow-data-source.ts mobile/src/config/mobile-env.ts mobile/src/data/mobile-data.ts mobile/README.md mobile/src/__tests__/mobile-data.test.mjs mobile/src/__tests__/mobile-shell.test.tsx
git commit -m "feat: adopt authenticated Queue-first mobile shell"
```

## Plan 1 Completion Evidence

- `GET /api/editor/inbox` and `GET /api/board/inbox` return schema-valid actor-aware records.
- Unsupported roles receive `403`.
- Mobile restores an Editor or Board session without a role switch.
- Editor and Board Today screens load live queue cards.
- API/contract failures show errors, not fallback work.
- Focused backend tests, all mobile Jest tests, legacy contract checks, typecheck, Expo export, and `expo install --check` pass.
