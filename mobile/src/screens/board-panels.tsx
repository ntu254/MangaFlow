import {
  MFDetailList,
  MFTimeline,
  SectionTitle,
} from "@/components/mf"
import type { BoardDecisionHistoryItem, BoardRankingItem } from "@/domain/workflow"

export function BoardRankingInsightPanel({ item }: { item: BoardRankingItem }) {
  const rankChange = item.previousRank - item.rank
  const movement = rankChange > 0 ? `Up ${rankChange} places` : rankChange < 0 ? `Down ${Math.abs(rankChange)} places` : "No rank movement"

  return (
    <>
      <SectionTitle title="Ranking insight" />
      <MFDetailList items={[
        { id: "rank", label: "Rank movement", value: movement, tone: rankChange >= 0 ? "success" : "danger", icon: rankChange >= 0 ? "check-circle" : "alert-triangle" },
        { id: "reader", label: "Reader score", value: `${item.readerScore} / 10. Mobile displays imported score only.`, tone: item.readerScore >= 7 ? "success" : "warning", icon: "bar-chart-2" },
        { id: "votes", label: "Vote count", value: `${item.voteCount} votes in the imported ranking period.`, tone: "primary", icon: "file-check" },
        { id: "final", label: "Final score", value: `${item.finalScore}. Ranking formula remains backend-owned.`, tone: "neutral", icon: "shield-check" },
      ]} />
      <MFTimeline items={[
        { id: "imported", title: "Ranking imported", subtitle: "Board reviews voteCount, readerScore, and backend finalScore output.", tone: "primary", icon: "bar-chart-2" },
        { id: "review", title: item.rankingStatus, subtitle: item.rankingStatus === "AT_RISK" ? "Manual Board attention is required; cancellation is not automatic." : "Warning state can continue with monitoring or improvement plan.", tone: item.tone, icon: item.tone === "danger" ? "alert-triangle" : "alert-circle" },
        { id: "decision", title: "Board decision pending", subtitle: "Any at-risk action must be confirmed and audited by backend workflow later.", tone: "warning", icon: "scale-balance" },
      ]} />
    </>
  )
}

export function BoardDecisionHistoryPanel({ items }: { items: BoardDecisionHistoryItem[] }) {
  return (
    <>
      <SectionTitle title="Decision history" />
      <MFTimeline items={items.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: `${decisionLabel(item.decision)} / ${statusLabel(item.status)} / immutable record / ${item.time}`,
        tone: item.decision === "CANCEL" ? "danger" : item.decision === "WARNING" || item.decision === "NEEDS_REVISION" ? "warning" : "success",
        icon: item.decision === "CANCEL" ? "alert-triangle" : "check-circle",
      }))} />
    </>
  )
}

function decisionLabel(decision: BoardDecisionHistoryItem["decision"]) {
  if (decision === "APPROVE") return "Approved"
  if (decision === "REJECT") return "Rejected"
  if (decision === "NEEDS_REVISION") return "Needs revision"
  if (decision === "REQUEST_IMPROVEMENT_PLAN") return "Improvement plan requested"
  if (decision === "CONTINUE") return "Continue"
  if (decision === "WARNING") return "Warning issued"
  return "Cancelled"
}

function statusLabel(status: BoardDecisionHistoryItem["status"]) {
  if (status === "AT_RISK_ACTION_RECORDED") return "At-risk action recorded"
  if (status === "TIE_BREAK_REQUIRED") return "Tie-break required"
  return status.charAt(0) + status.slice(1).toLowerCase()
}
