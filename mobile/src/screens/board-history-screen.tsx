import { MFEmptyState, MFHero, MFMetricStrip, MFTimeline, SectionTitle } from "@/components/mf"
import { WorkflowState } from "@/components/workflow-state"
import { useBoardDecisionHistory } from "@/hooks/use-board-rankings"

export function BoardHistoryScreen() {
  const history = useBoardDecisionHistory()

  if (history.isLoading && !history.data) return <WorkflowState kind="loading" />
  if (history.error && !history.data) {
    return (
      <WorkflowState
        kind="error"
        error={history.error}
        onRetry={() => void history.refetch()}
      />
    )
  }

  const rows = history.data ?? []
  const reVotes = rows.filter((row) => row.status === "TIED" || row.status === "TIE_BREAK_REQUIRED")

  return (
    <>
      <MFHero
        role="board"
        title="Decision history"
        subtitle="Immutable Board sessions, outcomes, and manual at-risk decisions."
      />
      <MFMetricStrip items={[
        { id: "records", label: "Records", value: String(rows.length), tone: "primary", icon: "file-check" },
        { id: "ties", label: "Tied rounds", value: String(reVotes.length), tone: "warning", icon: "scale-balance" },
        { id: "mode", label: "Mode", value: "Read only", tone: "success", icon: "shield-check" },
      ]} />
      <SectionTitle title="Immutable records" />
      {rows.length ? (
        <MFTimeline items={rows.map((row) => ({
          id: row.id,
          title: row.title,
          subtitle: `${row.type} · ${historyStatus(row.status)} · ${formatDate(row.date)}${lineageText(row.metadata)}`,
          tone: historyTone(row.status),
          icon: historyIcon(row.status),
        }))} />
      ) : (
        <MFEmptyState
          title="No decision history"
          subtitle="Finalized, tied, cancelled, and at-risk records will appear here."
          icon="shield-check"
        />
      )}
    </>
  )
}

function historyStatus(value: string): string {
  if (value === "TIE_BREAK_REQUIRED") return "Historical tie-break record"
  return value.replaceAll("_", " ")
}

function lineageText(metadata?: Record<string, unknown>): string {
  if (!metadata) return ""
  const prior = metadata.reVoteOfSessionId
  if (typeof prior === "string" && prior) return ` · re-vote of ${prior}`
  return ""
}

function historyTone(status: string): "success" | "warning" | "danger" | "primary" {
  if (status === "APPROVED" || status === "FINALIZED" || status === "CONTINUE") return "success"
  if (status === "REJECTED" || status === "CANCELLED" || status === "CANCEL") return "danger"
  if (status === "TIED" || status === "TIE_BREAK_REQUIRED" || status === "NO_QUORUM" || status === "WARNING") {
    return "warning"
  }
  return "primary"
}

function historyIcon(status: string): "check-circle" | "alert-triangle" | "scale-balance" | "shield-check" {
  if (status === "TIED" || status === "TIE_BREAK_REQUIRED") return "scale-balance"
  if (historyTone(status) === "danger" || historyTone(status) === "warning") return "alert-triangle"
  if (historyTone(status) === "success") return "check-circle"
  return "shield-check"
}

function formatDate(value: string | null): string {
  if (!value) return "Unknown time"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}
