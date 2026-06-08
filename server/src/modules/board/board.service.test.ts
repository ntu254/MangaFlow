import { beforeEach, describe, expect, it, vi } from "vitest"

const getBoardSeries = vi.fn()
const getDecisionBySeries = vi.fn()
const listBoardQueueSeries = vi.fn()
const getOrCreateDecision = vi.fn()
const isBoardChair = vi.fn()
const listBoardVotes = vi.fn()
const listEligibleBoardUsers = vi.fn()
const updateDecision = vi.fn()
const updateSeriesAfterDecision = vi.fn()
const upsertBoardVote = vi.fn()

vi.mock("./board.repository.js", () => ({
  getBoardSeries,
  getDecisionBySeries,
  listBoardQueueSeries,
  getOrCreateDecision,
  isBoardChair,
  listBoardVotes,
  listEligibleBoardUsers,
  updateDecision,
  updateSeriesAfterDecision,
  upsertBoardVote,
}))

const { castBoardVoteService, finalizeBoardDecisionService, listBoardQueueService, tieBreakBoardDecisionService } = await import("./board.service.js")

describe("board.service", () => {
  beforeEach(() => vi.clearAllMocks())


  it("builds board queue summaries from backend data", async () => {
    listBoardQueueSeries.mockResolvedValue([{
      id: "series-1",
      title: "Moonlit Atelier",
      ownerId: "owner-1",
      status: "BOARD_REVIEW",
      updatedAt: "2026-06-08T00:00:00.000Z",
    }])
    listBoardVotes.mockResolvedValue([{ value: "APPROVE" }, { value: "REJECT" }])
    getDecisionBySeries.mockResolvedValue({ status: "PENDING" })

    const result = await listBoardQueueService()

    expect(result[0]).toMatchObject({
      id: "series-1",
      seriesTitle: "Moonlit Atelier",
      ownerId: "owner-1",
      seriesStatus: "BOARD_REVIEW",
      decisionStatus: "PENDING",
      voteSummary: { APPROVE: 1, REJECT: 1, NEEDS_REVISION: 0 },
    })
  })

  it("records a board vote and returns summary", async () => {
    getBoardSeries.mockResolvedValue({ id: "series-1", status: "BOARD_REVIEW" })
    getOrCreateDecision.mockResolvedValue({ status: "PENDING" })
    upsertBoardVote.mockResolvedValue({ id: "vote-1", value: "APPROVE" })
    listBoardVotes.mockResolvedValue([{ value: "APPROVE" }, { value: "REJECT" }])

    const result = await castBoardVoteService("series-1", "board-1", "APPROVE")

    expect(upsertBoardVote).toHaveBeenCalledWith("series-1", "board-1", "APPROVE")
    expect(result.summary).toEqual({ APPROVE: 1, REJECT: 1, NEEDS_REVISION: 0 })
  })

  it("finalizes APPROVE plurality to APPROVED series", async () => {
    getBoardSeries.mockResolvedValue({ id: "series-1", status: "BOARD_REVIEW" })
    listEligibleBoardUsers.mockResolvedValue([{},{},{}])
    listBoardVotes.mockResolvedValue([{ value: "APPROVE" }, { value: "APPROVE" }, { value: "REJECT" }])
    updateDecision.mockResolvedValue({ status: "APPROVED", result: "APPROVE" })

    await finalizeBoardDecisionService("series-1", "board-1")

    expect(updateSeriesAfterDecision).toHaveBeenCalledWith("series-1", "APPROVED")
    expect(updateDecision).toHaveBeenCalledWith("series-1", "APPROVED", "APPROVE", "board-1")
  })

  it("returns TIE_BREAK_REQUIRED on plurality tie", async () => {
    getBoardSeries.mockResolvedValue({ id: "series-1", status: "BOARD_REVIEW" })
    listEligibleBoardUsers.mockResolvedValue([{},{},{}])
    listBoardVotes.mockResolvedValue([{ value: "APPROVE" }, { value: "REJECT" }, { value: "NEEDS_REVISION" }])
    updateDecision.mockResolvedValue({ status: "TIE_BREAK_REQUIRED" })

    await finalizeBoardDecisionService("series-1", "board-1")

    expect(updateSeriesAfterDecision).not.toHaveBeenCalled()
    expect(updateDecision).toHaveBeenCalledWith("series-1", "TIE_BREAK_REQUIRED", undefined, "board-1")
  })

  it("blocks finalize when minimum votes not met", async () => {
    getBoardSeries.mockResolvedValue({ id: "series-1", status: "BOARD_REVIEW" })
    listEligibleBoardUsers.mockResolvedValue([{},{},{}])
    listBoardVotes.mockResolvedValue([{ value: "APPROVE" }, { value: "APPROVE" }])

    await expect(finalizeBoardDecisionService("series-1", "board-1")).rejects.toMatchObject({
      message: "Not enough Board votes to finalize",
      statusCode: 409,
    })
  })

  it("allows chair tie-break when required", async () => {
    getBoardSeries.mockResolvedValue({ id: "series-1", status: "BOARD_REVIEW" })
    getOrCreateDecision.mockResolvedValue({ status: "TIE_BREAK_REQUIRED" })
    isBoardChair.mockResolvedValue(true)
    updateDecision.mockResolvedValue({ status: "APPROVED", result: "APPROVE" })

    await tieBreakBoardDecisionService("series-1", "chair-1", "APPROVE")

    expect(updateSeriesAfterDecision).toHaveBeenCalledWith("series-1", "APPROVED")
    expect(updateDecision).toHaveBeenCalledWith("series-1", "APPROVED", "APPROVE", "chair-1")
  })

  it("blocks non-chair tie-break", async () => {
    getBoardSeries.mockResolvedValue({ id: "series-1", status: "BOARD_REVIEW" })
    getOrCreateDecision.mockResolvedValue({ status: "TIE_BREAK_REQUIRED" })
    isBoardChair.mockResolvedValue(false)

    await expect(tieBreakBoardDecisionService("series-1", "board-1", "APPROVE")).rejects.toMatchObject({
      message: "Only Board Chair can tie-break",
      statusCode: 403,
    })
  })
})
