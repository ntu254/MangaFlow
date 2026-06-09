import type { ActionItem, RankingTableRow, VoteCardOption } from "@/shared/components/domain"
import { DecisionBadge, StatusBadge } from "@/shared/components/domain"
import type { MFTableColumn } from "@/shared/components/ui"
import { boardDecisionStatusUI, rankingStatusUI, seriesStatusUI } from "@/shared/lib/status-ui"
import type { RankingRecord } from "@/features/ranking/api/ranking.api"
import type { BoardQueueItem, BoardVoteSummary, BoardVoteValue } from "../api/board.api"

export interface BoardQueueRow {
  id: string
  seriesTitle: string
  owner: string
  status: string
  decisionStatus: string
  voteSummary: string
  age: string
}

export const boardColumns: MFTableColumn<BoardQueueRow>[] = [
  { id: "series", header: "Series", cell: (row) => <div className="min-w-0"><p className="break-words text-label-md text-on-surface">{row.seriesTitle}</p><p className="mt-xs break-words text-label-sm text-on-surface-muted">Owner: {row.owner}</p></div> },
  { id: "series-status", header: "Series status", cell: (row) => <StatusBadge status={row.status} mapping={seriesStatusUI} /> },
  { id: "decision", header: "Decision", cell: (row) => <DecisionBadge status={row.decisionStatus} /> },
  { id: "votes", header: "Vote summary", cell: (row) => row.voteSummary },
  { id: "age", header: "Age", cell: (row) => row.age },
]

export function toBoardQueueRows(queueItems: BoardQueueItem[], voteSummary: Record<string, string>): BoardQueueRow[] {
  return queueItems.map((item) => ({
    id: item.id,
    seriesTitle: item.seriesTitle,
    owner: item.ownerId,
    status: item.seriesStatus,
    decisionStatus: item.decisionStatus,
    voteSummary: voteSummary[item.id] ?? `${item.voteSummary.APPROVE} approve / ${item.voteSummary.REJECT} reject / ${item.voteSummary.NEEDS_REVISION} revision`,
    age: new Date(item.updatedAt).toLocaleDateString(),
  }))
}

export function toRankingRows(rankingRecords: RankingRecord[]): RankingTableRow[] {
  return rankingRecords.map((record, index) => {
    const seriesRef = typeof record.seriesId === "object" && record.seriesId ? record.seriesId : null
    const seriesTitle = seriesRef?.title ?? String(record.seriesId)
    return {
      id: record.id,
      rank: index + 1,
      seriesTitle,
      voteCount: record.voteCount,
      readerScore: record.readerScore.toFixed(1),
      finalScore: record.finalScore.toFixed(2),
      status: record.status,
      periodLabel: record.period,
    }
  })
}

export function buildVoteSummary(summary: BoardVoteSummary) {
  return `${summary.APPROVE} approve / ${summary.REJECT} reject / ${summary.NEEDS_REVISION} revision`
}

export function toBoardActions(firstBoardSeries: BoardQueueItem | null, firstAtRiskSeries: BoardQueueItem | null): ActionItem[] {
  return [
    { id: "board-action-1", title: "Series approval queue", description: firstBoardSeries ? `${firstBoardSeries.seriesTitle} is ready for Board workflow.` : "No live Board-review Series available.", metadata: "Queue is API-backed", icon: "how_to_vote", status: "PENDING" },
    { id: "board-action-2", title: "Tie-break workflow", description: "Tie-break action is API-backed and reserved for Board Chair.", metadata: "Chair-only backend rule", icon: "balance", status: "TIE_BREAK_REQUIRED" },
    { id: "board-action-3", title: "At-risk review", description: firstAtRiskSeries ? `${firstAtRiskSeries.seriesTitle} needs a manual Board at-risk decision.` : "No AT_RISK Series currently needs a manual Board decision.", metadata: "Manual Board action", icon: "warning", status: firstAtRiskSeries ? "AT_RISK" : "PENDING" },
  ]
}

export function toVoteOptions(runVote: (value: BoardVoteValue) => Promise<void>): VoteCardOption[] {
  return [
    { id: "approve", label: "Approve", description: "Send Board approve vote to backend.", countLabel: "API-backed", icon: "thumb_up", onVote: () => void runVote("APPROVE") },
    { id: "reject", label: "Reject", description: "Send Board reject vote to backend.", countLabel: "API-backed", icon: "thumb_down", onVote: () => void runVote("REJECT") },
    { id: "needs-revision", label: "Needs revision", description: "Return proposal for revision.", countLabel: "API-backed", icon: "undo", onVote: () => void runVote("NEEDS_REVISION") },
  ]
}

export { boardDecisionStatusUI, rankingStatusUI }
