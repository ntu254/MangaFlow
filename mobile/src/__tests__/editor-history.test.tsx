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
  it("describes the editorial work behind a known status", () => {
    const [item] = toEditorActivityItems([
      { id: "p-1", label: "Neon District: PENDING_BOARD", createdAt: "2026-07-30T09:00:00.000Z" },
    ])

    expect(item.action).toBe("Forwarded a proposal to the Board")
    expect(item.subject).toBe("Neon District")
    expect(item.area).toBe("Proposal review")
    expect(item.outcome).toBe("Waiting on the Board")
    expect(item.occurredAt).toBe("2026-07-30T09:00:00.000Z")
  })

  it("maps chapter, comment, and publication work to their own areas", () => {
    const items = toEditorActivityItems([
      { id: "c-1", label: "Chapter 12: REVISION_REQUESTED", createdAt: null },
      { id: "c-2", label: "Chapter 11: RESOLVED", createdAt: null },
      { id: "c-3", label: "Chapter 10: PUBLISHED", createdAt: null },
    ])

    expect(items.map((item) => item.area)).toEqual(["Chapter review", "Comments", "Publication"])
    expect(items[2].action).toBe("Published a chapter")
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

  it("presents personal editorial activity, not a governance record", async () => {
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

    expect(await screen.findByText("My Editorial Activity")).toBeVisible()
    expect(screen.getByText("Forwarded a proposal to the Board")).toBeVisible()
    expect(screen.getByText(/Neon District · Proposal review · Waiting on the Board/)).toBeVisible()
    expect(screen.getByText("Your recent editorial work")).toBeVisible()
    // Board governance language must not leak into the Editor feed.
    expect(screen.queryByText(/Governance Decision Ledger/)).toBeNull()
    expect(screen.queryByText(/Immutable/)).toBeNull()
  })

  it("has an empty state that only refers to Editorial activity", async () => {
    mocked.getEditorHistory.mockResolvedValue([])

    render(
      <TestQueryProvider>
        <EditorHistoryScreen />
      </TestQueryProvider>,
    )

    expect(await screen.findByText("No editorial activity yet")).toBeVisible()
    expect(
      screen.getByText(
        "Editorial work you complete — proposal reviews, chapter reviews, comments, and publication actions — appears here.",
      ),
    ).toBeVisible()
  })
})
