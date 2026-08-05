import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { BoardSessionDetailScreen } from "@/screens/board-session-detail-screen"
import { TestQueryProvider } from "@/test/test-query-provider"
import * as dataSource from "@/services/board-mobile-data-source"
import type { BoardSessionDetail } from "@/services/board-mobile-data-source"

jest.mock("@/services/board-mobile-data-source", () => ({
  getBoardSessionDetail: jest.fn(),
  castBoardVote: jest.fn(),
  closeBoardSession: jest.fn(),
  cancelBoardSession: jest.fn(),
  createBoardSession: jest.fn(),
  updateBoardSession: jest.fn(),
  getBoardRankings: jest.fn(),
  getBoardDecisionHistory: jest.fn(),
}))

const mocked = dataSource as jest.Mocked<typeof dataSource>

const votableSession: BoardSessionDetail = {
  session: { id: "vs-1", title: "Weekly slate", status: "OPEN", version: 3, proposalId: "p-004", reVoteOfSessionId: null, isReVote: false, votingRound: 1, tiePolicy: "CHAIR_DECIDES", tieResolution: "PENDING" },
  proposal: { id: "p-004", title: "Neon District", status: "BOARD_REVIEW" },
  tally: { approve: 2, reject: 0, total: 2, quorum: 3, eligible: 5, canFinalize: false },
  myVote: null,
  actions: [
    { action: "VOTE", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
  ],
}

function renderScreen(detail: BoardSessionDetail = votableSession) {
  mocked.getBoardSessionDetail.mockResolvedValue(detail)
  return render(
    <TestQueryProvider>
      <BoardSessionDetailScreen sessionId="vs-1" />
    </TestQueryProvider>,
  )
}

describe("BoardSessionDetailScreen", () => {
  afterEach(() => jest.clearAllMocks())

  it("shows the backend tally and casts a vote with expectedVersion", async () => {
    mocked.castBoardVote.mockResolvedValue(undefined)
    renderScreen()
    expect(await screen.findByText("Approve 2 · Reject 0 · Quorum 3 of 5")).toBeVisible()
    fireEvent.press(screen.getByRole("button", { name: "Approve" }))
    fireEvent.press(await screen.findByRole("button", { name: "Confirm approve" }))
    await waitFor(() =>
      expect(mocked.castBoardVote).toHaveBeenCalledWith({
        proposalId: "p-004",
        sessionId: "vs-1",
        value: "APPROVE",
        expectedVersion: 3,
      }),
    )
  })

  it("disables voting with the backend reason after voting", async () => {
    renderScreen({
      ...votableSession,
      myVote: { decision: "APPROVE" },
      actions: [
        { action: "VOTE", enabled: false, disabledReason: "You have already voted in this round.", requiresConfirmation: true, requiresReason: false },
      ],
    })
    expect(await screen.findByText("You have already voted in this round.")).toBeVisible()
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull()
  })

  it("shows the re-vote banner on a fresh re-vote session", async () => {
    renderScreen({
      ...votableSession,
      session: { ...votableSession.session, id: "vs-2", reVoteOfSessionId: "vs-1", isReVote: true },
    })
    expect(await screen.findByText("Fresh re-vote is open")).toBeVisible()
  })

  it("refreshes the session detail after a successful API action", async () => {
    mocked.getBoardSessionDetail
      .mockResolvedValueOnce(votableSession)
      .mockResolvedValueOnce({
        ...votableSession,
        myVote: { decision: "APPROVE" },
        currentUserVote: { decision: "APPROVE" },
      })
    mocked.castBoardVote.mockResolvedValue(undefined)

    renderScreen()
    fireEvent.press(await screen.findByRole("button", { name: "Approve" }))
    fireEvent.press(await screen.findByRole("button", { name: "Confirm approve" }))

    await waitFor(() => expect(screen.getByText("You voted: APPROVE")).toBeVisible())
    expect(mocked.getBoardSessionDetail).toHaveBeenCalledTimes(2)
  })

  it("lets the Chair finalize when the tally is decisive", async () => {
    mocked.closeBoardSession.mockResolvedValue({
      id: "vs-1",
      title: "Weekly slate",
      status: "FINALIZED",
    })
    renderScreen({
      ...votableSession,
      tally: { ...votableSession.tally, approve: 3, canFinalize: true },
      actions: [
        { action: "VOTE", enabled: false, disabledReason: "You have already voted in this round.", requiresConfirmation: true, requiresReason: false },
        { action: "SESSION_FINALIZE", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
      ],
    })
    fireEvent.press(await screen.findByRole("button", { name: "Close voting" }))
    fireEvent.press(await screen.findByRole("button", { name: "Confirm close" }))
    await waitFor(() =>
      expect(mocked.closeBoardSession).toHaveBeenCalledWith("vs-1", {
        expectedVersion: 3,
        note: undefined,
        publicationType: "MONTHLY",
      }),
    )
  })

  it("describes a final tied close as read-only mobile history", async () => {
    mocked.closeBoardSession.mockResolvedValue({
      id: "vs-1",
      title: "Weekly slate",
      status: "TIED",
      votingRound: 2,
      tieResolution: "PENDING",
    })
    renderScreen({
      ...votableSession,
      session: { ...votableSession.session, votingRound: 2 },
      tally: { ...votableSession.tally, approve: 2, reject: 2, total: 4, canFinalize: true },
      actions: [
        { action: "VOTE", enabled: false, disabledReason: "You have already voted in this round.", requiresConfirmation: true, requiresReason: false },
        { action: "SESSION_FINALIZE", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
      ],
    })

    fireEvent.press(await screen.findByRole("button", { name: "Close voting" }))
    fireEvent.press(await screen.findByRole("button", { name: "Confirm close" }))

    expect(
      await screen.findByText("The final re-vote tied. This round is read-only on mobile."),
    ).toBeVisible()
    expect(screen.queryByText(/Chair must resolve/i)).toBeNull()
  })

  it("does not render cancellation or tie-resolution controls", async () => {
    renderScreen({
      ...votableSession,
      actions: [
        { action: "VOTE", enabled: false, disabledReason: "You have already voted in this round.", requiresConfirmation: true, requiresReason: false },
        { action: "SESSION_CANCEL", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: true },
        { action: "TIE_RESOLVE", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: true },
      ],
    })
    await screen.findByText("Session OPEN")
    expect(screen.queryByRole("button", { name: "Cancel session" })).toBeNull()
    expect(screen.queryByRole("button", { name: /resolve tie/i })).toBeNull()
    expect(mocked.cancelBoardSession).not.toHaveBeenCalled()
  })

  it("visually distinguishes the selected publication cadence from the unselected one", async () => {
    renderScreen({
      ...votableSession,
      tally: { ...votableSession.tally, approve: 3, canFinalize: true },
      actions: [
        { action: "VOTE", enabled: false, disabledReason: "You have already voted in this round.", requiresConfirmation: true, requiresReason: false },
        { action: "SESSION_FINALIZE", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
      ],
    })
    const monthly = await screen.findByRole("button", { name: "Set monthly cadence" })
    const weekly = screen.getByRole("button", { name: "Set weekly cadence" })
    const flatten = (style: unknown) => Object.assign({}, ...(Array.isArray(style) ? style : [style]))
    const monthlyStyle = flatten(monthly.props.style)
    const weeklyStyle = flatten(weekly.props.style)

    // MONTHLY is the default cadence and must read as visually selected.
    expect(monthlyStyle.backgroundColor).not.toBe(weeklyStyle.backgroundColor)
  })

  it("keeps finalize disabled with the backend reason before quorum", async () => {
    renderScreen({
      ...votableSession,
      actions: [
        { action: "VOTE", enabled: false, disabledReason: "You have already voted in this round.", requiresConfirmation: true, requiresReason: false },
        { action: "SESSION_FINALIZE", enabled: false, disabledReason: "Quorum or a decisive tally has not been reached yet.", requiresConfirmation: true, requiresReason: false },
      ],
    })
    expect(await screen.findByRole("button", { name: "Close voting" })).toBeDisabled()
    expect(screen.getByText("Quorum or a decisive tally has not been reached yet.")).toBeVisible()
  })

  it("keeps terminal sessions readable without Chair actions", async () => {
    renderScreen({
      ...votableSession,
      session: { ...votableSession.session, status: "FINALIZED" },
      actions: [
        { action: "SESSION_FINALIZE", enabled: false, disabledReason: "This session is already finalized.", requiresConfirmation: true, requiresReason: false },
        { action: "SESSION_CANCEL", enabled: false, disabledReason: "This session is already finalized.", requiresConfirmation: true, requiresReason: true },
        { action: "TIE_RESOLVE", enabled: false, disabledReason: "This session is already finalized.", requiresConfirmation: true, requiresReason: true },
      ],
    })

    expect(await screen.findByText("Session FINALIZED")).toBeVisible()
    expect(screen.queryByText("Chair actions")).toBeNull()
    expect(screen.queryByRole("button", { name: "Close voting" })).toBeNull()
  })
})
