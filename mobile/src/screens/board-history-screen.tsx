import { Fragment } from "react"
import { MFEmptyState, MFHero, MFTimeline, SectionTitle } from "@/components/mf"
import { WorkflowState } from "@/components/workflow-state"
import { useBoardDecisionHistory } from "@/hooks/use-board-rankings"
import { groupBoardLedger, partitionBoardLedger, toBoardLedgerEntries } from "@/domain/board-decision-ledger"

export function BoardHistoryScreen() {
  const history = useBoardDecisionHistory()
  if (history.isLoading && !history.data) return <WorkflowState kind="loading" />
  if (history.error && !history.data) {
    return (
      <WorkflowState
        kind="error"
        context="the governance decision ledger"
        error={history.error}
        onRetry={() => void history.refetch()}
      />
    )
  }

  const entries = toBoardLedgerEntries(history.data ?? [])
  const { votingRounds } = partitionBoardLedger(entries)
  const sections = groupBoardLedger(entries)

  return (
    <>
      <MFHero
        role="board"
        title="Governance Decision Ledger"
        subtitle="Immutable Board record, separated by voting rounds and governance outcomes."
      />
      <SectionTitle title={`${entries.length} entries · ${votingRounds.length} voting rounds · Read only`} />
      <SectionTitle title="Immutable governance records" />
      {entries.length ? (
        sections.map((section) => (
          <Fragment key={section.id}>
            <SectionTitle title={section.title} />
            <MFTimeline items={section.items.map((entry) => ({
              id: entry.id,
              title: entry.title,
              subtitle: `${section.tag} · ${entry.recordType} · ${entry.outcome} · ${entry.timeLabel}${entry.lineage ? ` · ${entry.lineage}` : ""}`,
              tone: entry.tone,
              icon: entry.icon,
            }))} />
          </Fragment>
        ))
      ) : (
        <MFEmptyState
          title="No governance decisions recorded"
          subtitle="Finalized, tied, cancelled, and at-risk Board records will appear here."
          icon="shield-check"
        />
      )}
    </>
  )
}
