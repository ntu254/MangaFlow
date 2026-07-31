import { fireEvent, render, screen } from "@testing-library/react-native"
import { BoardRankingScreen } from "@/screens/board-ranking-screen"
import { BoardHistoryScreen } from "@/screens/board-history-screen"
import { TestQueryProvider } from "@/test/test-query-provider"
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

    expect(await screen.findByText("Second round")).toBeVisible()
    expect(screen.getByText(/re-vote of vs-1/)).toBeVisible()
    expect(screen.getByText("Read only")).toBeVisible()
  })
})
