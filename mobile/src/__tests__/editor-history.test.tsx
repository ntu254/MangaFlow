import { render, screen } from "@testing-library/react-native"
import { EditorHistoryScreen } from "@/screens/editor-history-screen"
import { TestQueryProvider } from "@/test/test-query-provider"
import { groupEditorActivities, toEditorActivityItems } from "@/domain/editor-activity"
import * as dataSource from "@/services/editor-mobile-data-source"

jest.mock("@/services/editor-mobile-data-source", () => ({
  getEditorHistory: jest.fn(),
}))

const mocked = dataSource as jest.Mocked<typeof dataSource>

describe("Editor activity mapper", () => {
  it("describes a workflow status without claiming the signed-in Editor performed it", () => {
    const [item] = toEditorActivityItems([
      { id: "p-1", label: "Neon District: PENDING_BOARD", createdAt: "2026-07-30T09:00:00.000Z" },
    ])

    expect(item.action).toBe("Proposal status updated")
    expect(item.subject).toBe("Neon District")
    expect(item.area).toBe("Proposal review")
    expect(item.outcome).toBe("Waiting on the Board")
    expect(item.occurredAt).toBe("2026-07-30T09:00:00.000Z")
  })

  it("maps chapter, comment, and publication status to their own areas", () => {
    const items = toEditorActivityItems([
      { id: "c-1", label: "Chapter 12: REVISION_REQUESTED", createdAt: null },
      { id: "c-2", label: "Chapter 11: RESOLVED", createdAt: null },
      { id: "c-3", label: "Chapter 10: PUBLISHED", createdAt: null },
    ])

    expect(items.map((item) => item.area)).toEqual(["Chapter review", "Comments", "Publication"])
    expect(items[2].action).toBe("Publication status updated")
  })

  it("falls back safely for an unknown status without inventing an action", () => {
    const [item] = toEditorActivityItems([
      { id: "p-9", label: "Iron Sky: SOME_NEW_STATUS", createdAt: null },
    ])

    expect(item.action).toBe("Recorded editorial work")
    expect(item.area).toBe("Editorial workflow")
    expect(item.outcome).toBe("Some new status")
    expect(item.timeLabel).toBe("Unknown time")
  })

  it("keeps an unparseable label as the subject", () => {
    const [item] = toEditorActivityItems([{ id: "p-8", label: "Free-form note", createdAt: null }])

    expect(item.subject).toBe("Free-form note")
    expect(item.outcome).toBeNull()
  })

  it("groups activities by editorial work area", () => {
    const groups = groupEditorActivities(toEditorActivityItems([
      { id: "proposal", label: "Neon District: APPROVED", createdAt: null },
      { id: "other", label: "Free-form note", createdAt: null },
    ]))

    expect(groups.map((group) => group.title)).toEqual(["Proposal reviews", "Editorial workflow"])
  })
})

describe("EditorHistoryScreen", () => {
  afterEach(() => jest.clearAllMocks())

  it("presents truthful editorial workflow status, not personal or governance claims", async () => {
    mocked.getEditorHistory.mockResolvedValue([
      {
        id: "p-1",
        label: "Neon District: PENDING_BOARD",
        createdAt: "2026-07-30T09:00:00.000Z",
      },
    ])

    render(
      <TestQueryProvider>
        <EditorHistoryScreen />
      </TestQueryProvider>,
    )

    expect(await screen.findByText("Editorial Workflow Status")).toBeVisible()
    expect(screen.getByText("Proposal status updated")).toBeVisible()
    expect(screen.getByText(/Neon District · Proposal review · Waiting on the Board/)).toBeVisible()
    expect(screen.getByText("Recent editorial workflow updates")).toBeVisible()
    expect(screen.queryByText(/My Editorial Activity|you completed|Your recent editorial work/)).toBeNull()
    // Board governance language must not leak into the Editor feed.
    expect(screen.queryByText(/Governance Decision Ledger/)).toBeNull()
    expect(screen.queryByText(/Immutable/)).toBeNull()
  })

  it("has an empty state that refers only to workflow status", async () => {
    mocked.getEditorHistory.mockResolvedValue([])

    render(
      <TestQueryProvider>
        <EditorHistoryScreen />
      </TestQueryProvider>,
    )

    expect(await screen.findByText("No recent editorial workflow updates")).toBeVisible()
    expect(
      screen.getByText(
        "Recent proposal, chapter, comment, and publication status changes appear here.",
      ),
    ).toBeVisible()
  })
})
