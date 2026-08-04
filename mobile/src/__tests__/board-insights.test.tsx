import { fireEvent, render, screen } from "@testing-library/react-native"
import { BoardRankingScreen } from "@/screens/board-ranking-screen"
import { BoardHistoryScreen } from "@/screens/board-history-screen"
import { TestQueryProvider } from "@/test/test-query-provider"
import { groupBoardLedger, isReVoteRecord, partitionBoardLedger, toBoardLedgerEntries } from "@/domain/board-decision-ledger"
import * as dataSource from "@/services/board-mobile-data-source"

jest.mock("@/services/board-mobile-data-source", () => ({
  getBoardRankings: jest.fn(),
  getBoardDecisionHistory: jest.fn(),
}))

const mocked = dataSource as jest.Mocked<typeof dataSource>

describe("Board read-only insights", () => {
  afterEach(() => jest.clearAllMocks())

  it("shows backend ranking values and opens manual at-risk review", async () => {
    const onOpenAtRisk = jest.fn()
    mocked.getBoardRankings.mockResolvedValue({
      generatedAt: "2026-07-30T09:00:00.000Z",
      items: [{
        id: "rank-1",
        seriesId: "series-1",
        seriesTitle: "Neon District",
        rank: 19,
        previousRank: 12,
        finalScore: 4.2,
        readerScore: 3.8,
        status: "AT_RISK",
        atRisk: true,
      }],
    })

    render(
      <TestQueryProvider>
        <BoardRankingScreen onOpenAtRisk={onOpenAtRisk} />
      </TestQueryProvider>,
    )

    expect(await screen.findByText("Neon District")).toBeVisible()
    expect(screen.getByText(/Reader score 3.8/)).toBeVisible()
    expect(screen.queryByText(/import/i)).toBeVisible()
    fireEvent.press(screen.getByRole("button", { name: "Review at-risk decision for Neon District" }))
    expect(onOpenAtRisk).toHaveBeenCalledWith(expect.objectContaining({ id: "rank-1" }))
  })

  it("renders immutable backend decision records with re-vote lineage", async () => {
    mocked.getBoardDecisionHistory.mockResolvedValue([{
      id: "vs-2",
      type: "Session",
      title: "Second round",
      status: "TIED",
      date: "2026-07-30T09:00:00.000Z",
      entityId: "vs-2",
      entityType: "voting_session",
      metadata: { reVoteOfSessionId: "vs-1" },
    }])

    render(
      <TestQueryProvider>
        <BoardHistoryScreen />
      </TestQueryProvider>,
    )

    expect(await screen.findByText("Governance Decision Ledger")).toBeVisible()
    expect(screen.getByText("Second round")).toBeVisible()
    expect(screen.getByText(/Voting session · Tied round/)).toBeVisible()
    expect(screen.getByText(/Re-vote of vs-1/)).toBeVisible()
    expect(screen.getByText(/Read only/)).toBeVisible()
    expect(screen.getByText("Immutable governance records")).toBeVisible()
    // Governance records are never framed as one person's activity feed.
    expect(screen.queryByText(/My Editorial Activity/)).toBeNull()
    expect(screen.queryByText(/Your recent editorial work/)).toBeNull()
  })

  it("has a governance empty state rather than an activity empty state", async () => {
    mocked.getBoardDecisionHistory.mockResolvedValue([])

    render(
      <TestQueryProvider>
        <BoardHistoryScreen />
      </TestQueryProvider>,
    )

    expect(await screen.findByText("No governance decisions recorded")).toBeVisible()
    expect(
      screen.getByText("Finalized, tied, cancelled, and at-risk Board records will appear here."),
    ).toBeVisible()
  })
})

describe("Board decision ledger mapper", () => {
  it("separates voting rounds from governance outcomes", () => {
    const entries = toBoardLedgerEntries([
      { id: "vote", type: "Session", title: "Round", status: "TIED", date: null, entityId: "vote", entityType: "voting_session" },
      { id: "decision", type: "Session", title: "Final", status: "FINALIZED", date: null, entityId: "decision", entityType: "voting_session" },
    ])

    expect(partitionBoardLedger(entries).votingRounds.map((entry) => entry.id)).toEqual(["vote"])
    expect(partitionBoardLedger(entries).governanceOutcomes.map((entry) => entry.id)).toEqual(["decision"])
  })

  it("does not mix proposal decisions with finalized voting sessions", () => {
    const groups = groupBoardLedger(toBoardLedgerEntries([
      { id: "proposal", type: "Proposal", title: "Series", status: "APPROVED", date: null, entityId: "proposal", entityType: "proposal" },
      { id: "session", type: "Session", title: "Session", status: "FINALIZED", date: null, entityId: "session", entityType: "voting_session" },
    ]))

    expect(groups.map((group) => group.title)).toEqual(["Proposal decisions", "Session outcomes"])
  })

  it("labels record classes and audit outcomes", () => {
    const [session, atRisk] = toBoardLedgerEntries([
      {
        id: "vs-3",
        type: "Session",
        title: "Third round",
        status: "FINALIZED",
        date: "2026-07-30T09:00:00.000Z",
        entityId: "vs-3",
        entityType: "voting_session",
      },
      {
        id: "ar-1",
        type: "At-risk",
        title: "Neon District",
        status: "CANCEL",
        date: null,
        entityId: "series-1",
        entityType: "at_risk_decision",
      },
    ])

    expect(session.recordType).toBe("Voting session")
    expect(session.outcome).toBe("Finalized")
    expect(session.tone).toBe("success")
    expect(atRisk.recordType).toBe("At-risk decision")
    expect(atRisk.outcome).toBe("Cancellation decision")
    expect(atRisk.tone).toBe("danger")
    expect(atRisk.timeLabel).toBe("Unknown time")
  })

  it("carries re-vote lineage and marks tied rounds", () => {
    const [entry] = toBoardLedgerEntries([
      {
        id: "vs-2",
        type: "Session",
        title: "Second round",
        status: "TIED",
        date: null,
        entityId: "vs-2",
        entityType: "voting_session",
        metadata: { reVoteOfSessionId: "vs-1" },
      },
    ])

    expect(entry.lineage).toBe("Re-vote of vs-1")
    expect(entry.icon).toBe("scale-balance")
    expect(isReVoteRecord(entry)).toBe(true)
  })

  it("does not invent lineage where the backend supplied none", () => {
    const [entry] = toBoardLedgerEntries([
      {
        id: "p-1",
        type: "Proposal",
        title: "Neon District",
        status: "APPROVED",
        date: null,
        entityId: "p-1",
        entityType: "proposal",
      },
    ])

    expect(entry.lineage).toBeNull()
    expect(entry.recordType).toBe("Proposal decision")
    expect(isReVoteRecord(entry)).toBe(false)
  })
})
