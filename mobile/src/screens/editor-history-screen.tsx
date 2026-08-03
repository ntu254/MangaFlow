import { Fragment } from "react"
import { MFEmptyState, MFHero, MFTimeline, SectionTitle } from "@/components/mf"
import { WorkflowState } from "@/components/workflow-state"
import { useEditorHistory } from "@/hooks/use-editor-history"
import { editorActivityAreas, groupEditorActivities, toEditorActivityItems } from "@/domain/editor-activity"

export function EditorHistoryScreen() {
  const history = useEditorHistory()
  if (history.isLoading && !history.data) return <WorkflowState kind="loading" />
  if (history.error && !history.data) {
    return <WorkflowState kind="error" context="your editorial activity" error={history.error} onRetry={() => void history.refetch()} />
  }

  const items = toEditorActivityItems(history.data ?? [])
  const areas = editorActivityAreas(items)
  const groups = groupEditorActivities(items)

  return (
    <>
      <MFHero role="editor" title="My Editorial Activity" subtitle="Editorial work you completed across proposals, chapters, comments, and publications." />
      <SectionTitle title={`${items.length} actions · ${areas.length} work areas · Recent`} />
      {items.length ? <SectionTitle title="Your recent editorial work" /> : null}
      {items.length ? groups.map((group) => (
        <Fragment key={group.id}>
          <SectionTitle title={group.title} />
          <MFTimeline items={group.items.map((item) => ({
            id: item.id,
            title: item.action,
            subtitle: `${item.subject} · ${item.area}${item.outcome ? ` · ${item.outcome}` : ""} · ${item.timeLabel}`,
            tone: item.tone,
            icon: item.icon,
          }))} />
        </Fragment>
      )) : (
        <MFEmptyState title="No editorial activity yet" subtitle="Editorial work you complete — proposal reviews, chapter reviews, comments, and publication actions — appears here." icon="file-check" />
      )}
    </>
  )
}
