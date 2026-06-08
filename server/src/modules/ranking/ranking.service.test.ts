import { beforeEach, describe, expect, it, vi } from "vitest"

const upsertRanking = vi.fn()
const getRankingById = vi.fn()
const updateRankingStatus = vi.fn()

vi.mock("./ranking.repository.js", () => ({ upsertRanking, getRankingById, updateRankingStatus }))

const { calculateFinalScore, finalizeRankingService, importRankingService } = await import("./ranking.service.js")

describe("ranking.service", () => {
  beforeEach(() => vi.clearAllMocks())

  it("calculates final score with MVP formula", () => {
    expect(calculateFinalScore(100, 8)).toBe(94)
  })

  it("imports ranking with calculated final score", async () => {
    upsertRanking.mockResolvedValue({ id: "ranking-1" })
    await importRankingService({ period: "2026-06", seriesId: "series-1", voteCount: 100, readerScore: 8 })
    expect(upsertRanking).toHaveBeenCalledWith({ period: "2026-06", seriesId: "series-1", voteCount: 100, readerScore: 8, finalScore: 94 })
  })

  it("blocks invalid readerScore", async () => {
    await expect(importRankingService({ period: "2026-06", seriesId: "series-1", voteCount: 100, readerScore: 11 })).rejects.toMatchObject({ statusCode: 400 })
  })

  it("finalizes imported ranking", async () => {
    getRankingById.mockResolvedValue({ id: "ranking-1", status: "IMPORTED" })
    updateRankingStatus.mockResolvedValue({ id: "ranking-1", status: "FINALIZED" })
    await finalizeRankingService("ranking-1")
    expect(updateRankingStatus).toHaveBeenCalledWith("ranking-1", "FINALIZED")
  })
})
