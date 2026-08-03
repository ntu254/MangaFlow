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
  it("describes the authenticated Editor's audited proposal action", () => {
    const [item] = toEditorActivityItems([
      {
        id: "activity-1",
        action: "PROPOSAL_FORWARDED_TO_BOARD",
        area: "PROPOSAL",
        entityId: "p-1",
        subject: "Neon District",
        seriesTitle: null,
        chapterNumber: null,
        chapterTitle: null,
        outcome: "PENDING_BOARD",
        occurredAt: "2026-07-30T09:00:00.000Z",
      },
    ])

    expect(item.action).toBe("Forwarded a proposal to the Board")
    expect(item.subject).toBe("Neon District")
    expect(item.area).toBe("Proposal review")
    expect(item.outcome).toBe("Waiting on the Board")
    expect(item.occurredAt).toBe("2026-07-30T09:00:00.000Z")
  })

  it("maps audited chapter, comment, and publication actions to their own areas", () => {
    const items = toEditorActivityItems([
      { id: "c-1", action: "CHAPTER_TANTOU_REVISION_REQUESTED", area: "CHAPTER", entityId: "ch-12", subject: "Neon District · Chapter 12", seriesTitle: "Neon District", chapterNumber: 12, chapterTitle: "Fault Line", outcome: "REVISION_REQUIRED", occurredAt: null },
      { id: "c-2", action: "comment.resolved", area: "COMMENT", entityId: "comment-1", subject: "Neon District · Chapter 11", seriesTitle: "Neon District", chapterNumber: 11, chapterTitle: "Crossing", outcome: "RESOLVED", occurredAt: null },
      { id: "c-3", action: "CHAPTER_PUBLISHED", area: "PUBLICATION", entityId: "ch-10", subject: "Neon District · Chapter 10", seriesTitle: "Neon District", chapterNumber: 10, chapterTitle: "Signal", outcome: "PUBLISHED", occurredAt: null },
    ])

    expect(items.map((item) => item.area)).toEqual(["Chapter review", "Comments", "Publication"])
    expect(items[2].action).toBe("Published a chapter")
  })

  it("falls back safely for a new audited action without inventing an outcome", () => {
    const [item] = toEditorActivityItems([
      { id: "p-9", action: "proposal.some_new_action", area: "PROPOSAL", entityId: "p-9", subject: "Iron Sky", seriesTitle: null, chapterNumber: null, chapterTitle: null, outcome: null, occurredAt: null },
    ])

    expect(item.action).toBe("Proposal some new action")
    expect(item.area).toBe("Proposal review")
    expect(item.outcome).toBeNull()
    expect(item.timeLabel).toBe("Unknown time")
  })

  it("groups activities by editorial work area", () => {
    const groups = groupEditorActivities(toEditorActivityItems([
      { id: "proposal", action: "PROPOSAL_CLAIMED", area: "PROPOSAL", entityId: "p-1", subject: "Neon District", seriesTitle: null, chapterNumber: null, chapterTitle: null, outcome: "EDITOR_REVIEWING", occurredAt: null },
      { id: "publication", action: "PUBLICATION_SCHEDULED", area: "PUBLICATION", entityId: "ch-1", subject: "Neon District · Chapter 1", seriesTitle: "Neon District", chapterNumber: 1, chapterTitle: "Arrival", outcome: "SCHEDULED", occurredAt: null },
    ]))

    expect(groups.map((group) => group.title)).toEqual(["Proposal reviews", "Publication"])
  })
})

describe("EditorHistoryScreen", () => {
  afterEach(() => jest.clearAllMocks())

  it("presents the authenticated Editor's audited activity without governance claims", async () => {
    mocked.getEditorHistory.mockResolvedValue([
      {
        id: "activity-1",
        action: "PROPOSAL_FORWARDED_TO_BOARD",
        area: "PROPOSAL",
        entityId: "p-1",
        subject: "Neon District",
        seriesTitle: null,
        chapterNumber: null,
        chapterTitle: null,
        outcome: "PENDING_BOARD",
        occurredAt: "2026-07-30T09:00:00.000Z",
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
    expect(screen.queryByText(/Editorial Workflow Status/)).toBeNull()
    expect(screen.queryByText(/Governance Decision Ledger/)).toBeNull()
    expect(screen.queryByText(/Immutable/)).toBeNull()
  })

  it("has a personal but trustworthy empty state", async () => {
    mocked.getEditorHistory.mockResolvedValue([])

    render(
      <TestQueryProvider>
        <EditorHistoryScreen />
      </TestQueryProvider>,
    )

    expect(await screen.findByText("No editorial activity yet")).toBeVisible()
    expect(
      screen.getByText(
        "Your audited proposal, chapter, comment, and publication actions appear here.",
      ),
    ).toBeVisible()
  })
})
