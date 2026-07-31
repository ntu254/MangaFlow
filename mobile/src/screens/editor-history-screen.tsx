import { MFEmptyState, MFHero, MFMetricStrip, MFTimeline, SectionTitle } from "@/components/mf"
import { WorkflowState } from "@/components/workflow-state"
import { useEditorHistory } from "@/hooks/use-editor-history"

export function EditorHistoryScreen() {
  const history = useEditorHistory()

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

  return (
    <>
      <MFHero
        role="editor"
        title="Recent workflow history"
        subtitle="Read-only activity supplied by the Editor backend summary."
      />
      <MFMetricStrip items={[
        { id: "activity", label: "Recent", value: String(rows.length), tone: "primary", icon: "shield-check" },
        { id: "source", label: "Source", value: "Backend", tone: "success", icon: "file-check" },
        { id: "mode", label: "Mode", value: "Read only", tone: "neutral", icon: "lock" },
      ]} />
      <SectionTitle title="Activity" />
      {rows.length ? (
        <MFTimeline items={rows.map((row) => ({
          id: row.id,
          title: row.label,
          subtitle: formatDate(row.createdAt),
          tone: "primary",
          icon: "file-check",
        }))} />
      ) : (
        <MFEmptyState
          title="No recent activity"
          subtitle="Completed Editor workflow activity will appear here."
          icon="shield-check"
        />
      )}
    </>
  )
}

function formatDate(value: string | null): string {
  if (!value) return "Unknown time"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}
