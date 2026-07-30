import { mobileApi } from "@/services/mobile-api-client"

// Board detail reads and canonical vote command. Mobile sends expectedVersion
// for optimistic concurrency; it never computes tally/quorum/result.

export interface BoardActionDescriptor {
  action: string
  enabled: boolean
  disabledReason: string | null
  requiresConfirmation: boolean
  requiresReason: boolean
}

export interface BoardSessionDetail {
  session: {
    id: string
    title: string
    status: string
    version: number | null
    proposalId: string | null
    reVoteOfSessionId: string | null
    isReVote: boolean
  }
  proposal: { id: string; title: string; status: string } | null
  tally: {
    approve: number
    reject: number
    total: number
    quorum: number
    eligible: number
    canFinalize: boolean
  }
  myVote: { decision: string | null } | null
  actions: BoardActionDescriptor[]
}

export type BoardVoteValue = "APPROVE" | "REJECT" | "ABSTAIN"

export function getBoardSessionDetail(sessionId: string): Promise<BoardSessionDetail> {
  return mobileApi.request<BoardSessionDetail>(`/board/sessions/${sessionId}/detail`)
}

export function castBoardVote(input: {
  proposalId: string
  sessionId: string
  value: BoardVoteValue
  expectedVersion: number | null
}): Promise<void> {
  return mobileApi.request<void>(`/board/series/${input.proposalId}/votes`, {
    method: "POST",
    body: JSON.stringify({
      value: input.value,
      sessionId: input.sessionId,
      expectedVersion: input.expectedVersion,
    }),
  })
}

export interface BoardRankingItem {
  id: string
  seriesId: string
  seriesTitle: string
  rank: number | null
  previousRank: number | null
  finalScore: number | null
  readerScore: number | null
  status: string | null
  atRisk: boolean
}

export function getBoardRankings(): Promise<{ generatedAt: string; items: BoardRankingItem[] }> {
  return mobileApi.request(`/board/rankings`)
}
