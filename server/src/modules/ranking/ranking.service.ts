import { AppError } from "../../shared/errors/AppError.js"
import { getRankingById, listRankings, updateRankingStatus, upsertRanking } from "./ranking.repository.js"

export interface ImportRankingServiceInput {
  period: string
  seriesId: string
  voteCount: number
  readerScore: number
}

export function calculateFinalScore(voteCount: number, readerScore: number): number {
  return Number((voteCount * 0.7 + (readerScore * 10) * 0.3).toFixed(2))
}

export async function importRankingService(input: ImportRankingServiceInput) {
  if (!input.period?.trim()) throw new AppError("Ranking period is required", 400)
  if (input.voteCount < 0) throw new AppError("voteCount must be non-negative", 400)
  if (input.readerScore < 1 || input.readerScore > 10) throw new AppError("readerScore must be between 1 and 10", 400)
  return upsertRanking({
    period: input.period.trim(),
    seriesId: input.seriesId,
    voteCount: input.voteCount,
    readerScore: input.readerScore,
    finalScore: calculateFinalScore(input.voteCount, input.readerScore),
  })
}


export async function listRankingsService() {
  return listRankings()
}

export async function finalizeRankingService(rankingId: string) {
  const ranking = await getRankingById(rankingId)
  if (!ranking) throw new AppError("Ranking not found", 404)
  if (ranking.status !== "IMPORTED" && ranking.status !== "REVIEWED") {
    throw new AppError("Only imported or reviewed ranking can be finalized", 409)
  }
  return updateRankingStatus(rankingId, "FINALIZED")
}
