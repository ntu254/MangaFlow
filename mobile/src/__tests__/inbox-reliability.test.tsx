import { fireEvent, render, screen } from "@testing-library/react-native"
import type { UseQueryResult } from "@tanstack/react-query"
import { EditorWorkspace } from "@/screens/editor-workspace"
import { MobileRequestError } from "@/services/mobile-request-diagnostics"
import type { MobileInbox, MobileWorkItem } from "@/domain/mobile-work-item"

function workItem(overrides: Partial<MobileWorkItem>): MobileWorkItem {
  return {
    id: "PROPOSAL_REVIEW:p-001",
    kind: "PROPOSAL_REVIEW",
    entityType: "PROPOSAL",
    entityId: "p-001",
    status: "EDITOR_REVIEW",
    version: 1,
    title: "Neon District",
    subtitle: "Manuscript v2",
    priority: { level: "HIGH", reason: "Revision received", dueAt: null },
    blockers: [],
    actions: [],
    summary: {},
    ...overrides,
  }
}

const editorInbox: MobileInbox = {
  role: "EDITOR",
  generatedAt: new Date().toISOString(),
  items: [
    workItem({ id: "PROPOSAL_REVIEW:p-001", title: "Proposal item" }),
    workItem({
      id: "CHAPTER_REVIEW:c-001",
      kind: "CHAPTER_REVIEW",
      entityType: "CHAPTER",
      entityId: "c-001",
      title: "Chapter item",
    }),
    workItem({
      id: "PUBLICATION:c-002",
      kind: "PUBLICATION",
      entityType: "CHAPTER",
      entityId: "c-002",
      title: "Publication item",
    }),
  ],
}

function inboxQuery(
  overrides: Partial<UseQueryResult<MobileInbox, Error>> = {},
): UseQueryResult<MobileInbox, Error> {
  return {
    data: undefined,
    error: null,
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
    ...overrides,
  } as unknown as UseQueryResult<MobileInbox, Error>
}

const httpFailure = new MobileRequestError({
  context: "Editor work",
  category: "HTTP",
  status: 503,
  code: "SERVICE_UNAVAILABLE",
  requestId: "req-99",
})

describe("Editor inbox failure surface", () => {
  it("explains the failure without technical detail and never falls back to demo data", () => {
    render(<EditorWorkspace tab="priority" inbox={inboxQuery({ error: httpFailure })} />)

    expect(screen.getByText("Could not load Editor work.")).toBeVisible()
    expect(screen.queryByText("Demo data")).toBeNull()
    // Technical facts stay behind the collapsed support disclosure.
    expect(screen.queryByText(/503/)).toBeNull()
    expect(screen.queryByText(/SERVICE_UNAVAILABLE/)).toBeNull()
    expect(screen.queryByText(/req-99/)).toBeNull()
  })

  it("reveals safe support details on demand with a copy affordance", () => {
    render(<EditorWorkspace tab="priority" inbox={inboxQuery({ error: httpFailure })} />)

    fireEvent.press(screen.getByRole("button", { name: "Support details" }))

    expect(screen.getByText(/HTTP status: 503/)).toBeVisible()
    expect(screen.getByText(/Backend code: SERVICE_UNAVAILABLE/)).toBeVisible()
    expect(screen.getByText(/Request ID: req-99/)).toBeVisible()
    expect(screen.getByText(/copy/i)).toBeVisible()
  })

  it("keeps a contract failure free of the rejected payload", () => {
    const contractFailure = new MobileRequestError({
      context: "Editor work",
      category: "CONTRACT",
      status: null,
      code: "CONTRACT_INVALID",
      requestId: null,
    })
    render(<EditorWorkspace tab="priority" inbox={inboxQuery({ error: contractFailure })} />)
    fireEvent.press(screen.getByRole("button", { name: "Support details" }))

    expect(screen.getByText(/Category: CONTRACT/)).toBeVisible()
    expect(screen.getByText(/HTTP status: —/)).toBeVisible()
  })

  it("retries the authenticated query", () => {
    const refetch = jest.fn()
    render(<EditorWorkspace tab="priority" inbox={inboxQuery({ error: httpFailure, refetch })} />)

    fireEvent.press(screen.getByRole("button", { name: "Retry" }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})

describe("Editor tabs as filters over one inbox", () => {
  it("shows only urgent and high inbox items on Priority", () => {
    const inbox = {
      ...editorInbox,
      items: [
        editorInbox.items[0],
        { ...editorInbox.items[1], priority: { ...editorInbox.items[1].priority, level: "NORMAL" as const } },
        { ...editorInbox.items[2], priority: { ...editorInbox.items[2].priority, level: "URGENT" as const } },
      ],
    }
    render(<EditorWorkspace tab="priority" inbox={inboxQuery({ data: inbox })} />)

    expect(screen.getByText("Proposal item")).toBeVisible()
    expect(screen.queryByText("Chapter item")).toBeNull()
    expect(screen.getByText("Publication item")).toBeVisible()
  })

  it("filters Reviews to proposal and chapter review work", () => {
    render(<EditorWorkspace tab="reviews" inbox={inboxQuery({ data: editorInbox })} />)

    expect(screen.getByText("Proposal item")).toBeVisible()
    expect(screen.getByText("Chapter item")).toBeVisible()
    expect(screen.queryByText("Publication item")).toBeNull()
  })

  it("filters Publish to publication work without a second request", () => {
    const refetch = jest.fn()
    render(<EditorWorkspace tab="publish" inbox={inboxQuery({ data: editorInbox, refetch })} />)

    expect(screen.getByText("Publication item")).toBeVisible()
    expect(screen.queryByText("Proposal item")).toBeNull()
    expect(screen.queryByText("Chapter item")).toBeNull()
    // Tabs are client-side filters over the one authenticated inbox read.
    expect(refetch).not.toHaveBeenCalled()
  })
})
