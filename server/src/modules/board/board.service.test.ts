import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("mongoose", () => ({
  default: {
    startSession: vi.fn().mockResolvedValue({
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn(),
      endSession: vi.fn(),
    }),
  },
}))

const getBoardSeries = vi.fn()
const getDecisionBySeries = vi.fn()
const listBoardQueueSeries = vi.fn()
const getOrCreateDecision = vi.fn()
const isBoardChair = vi.fn()
const listBoardVotes = vi.fn()
const listEligibleBoardUsers = vi.fn()
const updateDecision = vi.fn()
const updateSeriesAfterDecision = vi.fn()
const createBoardVote = vi.fn()
const getOpenBoardReviewSession = vi.fn()
const closeBoardReviewSession = vi.fn()
const updateLatestManuscriptAfterDecision = vi.fn()
const createAtRiskDecision = vi.fn()

vi.mock("./board.repository.js", () => ({
  closeBoardReviewSession,
  createBoardVote,
  getBoardSeries,
  getDecisionBySeries,
  getOpenBoardReviewSession,
  listBoardQueueSeries,
  getOrCreateDecision,
  isBoardChair,
  listBoardVotes,
  listEligibleBoardUsers,
  updateDecision,
  updateLatestManuscriptAfterDecision,
  updateSeriesAfterDecision,
  createAtRiskDecision,
}))
vi.mock("../../shared/workflow/events.js", () => ({
  notifyRole: vi.fn().mockResolvedValue([]),
  notifyUsers: vi.fn().mockResolvedValue([]),
  recordAuditLog: vi.fn().mockResolvedValue(null),
}))

const { castBoardVoteService, createAtRiskDecisionService, finalizeBoardDecisionService, listBoardQueueService, tieBreakBoardDecisionService } = await import("./board.service.js")

describe("board.service", () => {
  beforeEach(() => vi.clearAllMocks())

  it("builds board queue summaries from backend data", async () => {
    listBoardQueueSeries.mockResolvedValue([
      {
        id: "series-1",
        title: "Moonlit Atelier",
        ownerId: "owner-1",
        status: "BOARD_REVIEW",
        updatedAt: "2026-06-08T00:00:00.000Z",
      },
    ])
    getOpenBoardReviewSession.mockResolvedValue({ id: "session-1" })
    listBoardVotes.mockResolvedValue([{ value: "APPROVE" }, { value: "REJECT" }])
    listEligibleBoardUsers.mockResolvedValue([{ userId: "board-1" }, { userId: "board-2" }, { userId: "board-3" }])
    getDecisionBySeries.mockResolvedValue({ status: "PENDING" })

    const result = await listBoardQueueService()

    expect(result[0]).toMatchObject({
      id: "series-1",
      seriesTitle: "Moonlit Atelier",
      ownerId: "owner-1",
      seriesStatus: "BOARD_REVIEW",
      decisionStatus: "PENDING",
      voteSummary: { APPROVE: 1, REJECT: 1, NEEDS_REVISION: 0 },
      voteCount: 2,
      eligibleBoardCount: 3,
      quorum: 2,
      canFinalize: true,
    })
  })

  it("records a board vote and returns summary", async () => {
    getBoardSeries.mockResolvedValue({
      id: "series-1",
      status: "BOARD_REVIEW",
    })
    listEligibleBoardUsers.mockResolvedValue([{ userId: "board-1" }, { userId: "board-2" }, { userId: "board-3" }])
    getOpenBoardReviewSession.mockResolvedValue({ id: "session-1" })
    getOrCreateDecision.mockResolvedValue({ status: "PENDING" })
    createBoardVote.mockResolvedValue({ id: "vote-1", value: "APPROVE" })
    listBoardVotes.mockResolvedValue([{ value: "APPROVE" }, { value: "REJECT" }])

    const result = await castBoardVoteService("series-1", "board-1", "APPROVE")

    expect(createBoardVote).toHaveBeenCalledWith("series-1", "session-1", "board-1", "APPROVE", undefined, expect.any(Object))
    expect(result.summary).toEqual({
      APPROVE: 1,
      REJECT: 1,
      NEEDS_REVISION: 0,
    })
  })

  it("retries board vote without a transaction when Mongo standalone rejects transaction sessions", async () => {
    const transactionError = new Error("Transaction numbers are only allowed on a replica set member or mongos")
    getBoardSeries.mockRejectedValueOnce(transactionError).mockResolvedValue({ id: "series-1", status: "BOARD_REVIEW" })
    listEligibleBoardUsers.mockResolvedValue([{ userId: "board-1" }, { userId: "board-2" }, { userId: "board-3" }])
    getOpenBoardReviewSession.mockResolvedValue({ id: "session-1" })
    getOrCreateDecision.mockResolvedValue({ status: "PENDING" })
    createBoardVote.mockResolvedValue({ id: "vote-1", value: "APPROVE" })
    listBoardVotes.mockResolvedValue([{ value: "APPROVE" }])

    const result = await castBoardVoteService("series-1", "board-1", "APPROVE")

    expect(getBoardSeries).toHaveBeenNthCalledWith(1, "series-1", expect.any(Object))
    expect(getBoardSeries).toHaveBeenNthCalledWith(2, "series-1", undefined)
    expect(createBoardVote).toHaveBeenCalledWith("series-1", "session-1", "board-1", "APPROVE", undefined, undefined)
    expect(result.summary).toEqual({
      APPROVE: 1,
      REJECT: 0,
      NEEDS_REVISION: 0,
    })
  })

  it("finalizes APPROVE plurality to APPROVED series", async () => {
    getBoardSeries.mockResolvedValue({
      id: "series-1",
      status: "BOARD_REVIEW",
    })
    getOpenBoardReviewSession.mockResolvedValue({ id: "session-1" })
    listEligibleBoardUsers.mockResolvedValue([{ userId: "board-1" }, { userId: "board-2" }, { userId: "board-3" }])
    listBoardVotes.mockResolvedValue([{ value: "APPROVE" }, { value: "APPROVE" }, { value: "REJECT" }])
    updateDecision.mockResolvedValue({ status: "APPROVED", result: "APPROVE" })
    updateSeriesAfterDecision.mockResolvedValue({
      id: "series-1",
      title: "Moonlit Atelier",
      ownerId: "owner-1",
    })

    await finalizeBoardDecisionService("series-1", "board-1", {
      publicationType: "WEEKLY",
    })

    expect(updateSeriesAfterDecision).toHaveBeenCalledWith("series-1", "APPROVED", expect.any(Object), "WEEKLY")
    expect(updateLatestManuscriptAfterDecision).toHaveBeenCalledWith("series-1", "APPROVED", expect.any(Object))
    expect(closeBoardReviewSession).toHaveBeenCalledWith("session-1", expect.any(Object))
    expect(updateDecision).toHaveBeenCalledWith("series-1", "APPROVED", "APPROVE", "board-1", expect.any(Object), "WEEKLY", undefined)
  })

  it("returns TIE_BREAK_REQUIRED on plurality tie", async () => {
    getBoardSeries.mockResolvedValue({
      id: "series-1",
      status: "BOARD_REVIEW",
    })
    getOpenBoardReviewSession.mockResolvedValue({ id: "session-1" })
    listEligibleBoardUsers.mockResolvedValue([{ userId: "board-1" }, { userId: "board-2" }, { userId: "board-3" }])
    listBoardVotes.mockResolvedValue([{ value: "APPROVE" }, { value: "REJECT" }, { value: "NEEDS_REVISION" }])
    updateDecision.mockResolvedValue({ status: "TIE_BREAK_REQUIRED" })

    await finalizeBoardDecisionService("series-1", "board-1")

    expect(updateSeriesAfterDecision).not.toHaveBeenCalled()
    expect(updateDecision).toHaveBeenCalledWith("series-1", "TIE_BREAK_REQUIRED", undefined, "board-1", expect.any(Object))
  })

  it("blocks finalize when minimum votes not met", async () => {
    getBoardSeries.mockResolvedValue({
      id: "series-1",
      status: "BOARD_REVIEW",
    })
    getOpenBoardReviewSession.mockResolvedValue({ id: "session-1" })
    listEligibleBoardUsers.mockResolvedValue([{ userId: "board-1" }, { userId: "board-2" }, { userId: "board-3" }, { userId: "board-4" }, { userId: "board-5" }])
    listBoardVotes.mockResolvedValue([{ value: "APPROVE" }, { value: "APPROVE" }])

    await expect(finalizeBoardDecisionService("series-1", "board-1")).rejects.toMatchObject({
      message: "Not enough Board votes to finalize",
      statusCode: 409,
    })
  })

  it("allows chair tie-break when required", async () => {
    getBoardSeries.mockResolvedValue({
      id: "series-1",
      status: "BOARD_REVIEW",
    })
    listEligibleBoardUsers.mockResolvedValue([{ userId: "chair-1" }, { userId: "board-2" }, { userId: "board-3" }])
    getOpenBoardReviewSession.mockResolvedValue({ id: "session-1" })
    getOrCreateDecision.mockResolvedValue({ status: "TIE_BREAK_REQUIRED" })
    isBoardChair.mockResolvedValue(true)
    updateDecision.mockResolvedValue({ status: "APPROVED", result: "APPROVE" })
    updateSeriesAfterDecision.mockResolvedValue({
      id: "series-1",
      title: "Moonlit Atelier",
      ownerId: "owner-1",
    })

    await tieBreakBoardDecisionService("series-1", "chair-1", {
      value: "APPROVE",
      publicationType: "MONTHLY",
    })

    expect(updateSeriesAfterDecision).toHaveBeenCalledWith("series-1", "APPROVED", expect.any(Object), "MONTHLY")
    expect(updateDecision).toHaveBeenCalledWith("series-1", "APPROVED", "APPROVE", "chair-1", expect.any(Object), "MONTHLY", undefined)
  })

  it("blocks non-chair tie-break", async () => {
    getBoardSeries.mockResolvedValue({
      id: "series-1",
      status: "BOARD_REVIEW",
    })
    listEligibleBoardUsers.mockResolvedValue([{ userId: "board-1" }, { userId: "board-2" }, { userId: "board-3" }])
    getOpenBoardReviewSession.mockResolvedValue({ id: "session-1" })
    getOrCreateDecision.mockResolvedValue({ status: "TIE_BREAK_REQUIRED" })
    isBoardChair.mockResolvedValue(false)

    await expect(tieBreakBoardDecisionService("series-1", "board-1", "APPROVE")).rejects.toMatchObject({
      message: "Only Board Chair can tie-break",
      statusCode: 403,
    })
  })

  it("records manual at-risk CANCEL decision and cancels series", async () => {
    getBoardSeries.mockResolvedValue({ id: "series-1", status: "AT_RISK" })
    createAtRiskDecision.mockResolvedValue({
      id: "risk-1",
      decision: "CANCEL",
    })

    const result = await createAtRiskDecisionService("series-1", "board-1", "CANCEL", "Ranking declined")

    expect(result).toMatchObject({ decision: "CANCEL" })
    expect(createAtRiskDecision).toHaveBeenCalledWith("series-1", "CANCEL", "board-1", "Ranking declined")
    expect(updateSeriesAfterDecision).toHaveBeenCalledWith("series-1", "CANCELLED")
  })

  it("blocks at-risk decisions unless series is AT_RISK", async () => {
    getBoardSeries.mockResolvedValue({ id: "series-1", status: "ONGOING" })

    await expect(createAtRiskDecisionService("series-1", "board-1", "WARNING")).rejects.toMatchObject({
      message: "At-risk decision requires Series in AT_RISK status",
      statusCode: 409,
    })
  })
})
