import { Ranking } from "./ranking.model.js"

export interface ImportRankingInput {
  period: string
  seriesId: string
  voteCount: number
  readerScore: number
  finalScore: number
}

export async function upsertRanking(input: ImportRankingInput): Promise<any> {
  return Ranking.findOneAndUpdate(
    { period: input.period, seriesId: input.seriesId },
    { ...input, status: "IMPORTED" },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )
}


export async function listRankings(): Promise<any[]> {
  return Ranking.find()
    .sort({ finalScore: -1, voteCount: -1, updatedAt: -1 })
    .populate("seriesId", "title")
    .lean()
}

export async function getRankingById(rankingId: string): Promise<any | null> {
  return Ranking.findById(rankingId)
}

export async function updateRankingStatus(rankingId: string, status: string): Promise<any | null> {
  return Ranking.findByIdAndUpdate(rankingId, { status }, { new: true })
}
