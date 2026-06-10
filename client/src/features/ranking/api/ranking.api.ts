import { apiRequest } from "@/shared/api/client"

export interface RankingRecord {
  id: string
  period: string
  seriesId: string | { id?: string; title?: string }
  voteCount: number
  readerScore: number
  finalScore: number
  status: string
  createdAt?: string
  updatedAt?: string
}

export interface ImportRankingInput {
  period: string
  seriesId: string | { id?: string; title?: string }
  voteCount: number
  readerScore: number
}

export function listRankings() {
  return apiRequest<RankingRecord[]>("/rankings")
}

export function listMangakaRankings() {
  return apiRequest<RankingRecord[]>("/rankings/my-rankings")
}

export function importRanking(input: ImportRankingInput) {
  return apiRequest<RankingRecord>("/rankings/import", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function finalizeRanking(rankingId: string) {
  return apiRequest<RankingRecord>(`/rankings/${rankingId}/finalize`, {
    method: "POST",
  })
}

