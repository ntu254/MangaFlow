import { useEffect, useMemo, useState } from "react"
import {
  ActionItemList,
  AtRiskBadge,
  DecisionBadge,
  RankingTable,
  ReviewDecisionBar,
  StatusBadge,
  VoteCard,
  type ActionItem,
  type RankingTableRow,
  type VoteCardOption,
} from "@/shared/components/domain"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFButton, MFCard, MFTable, type MFTableColumn } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { boardDecisionStatusUI, rankingStatusUI, seriesStatusUI } from "@/shared/lib/status-ui"
import { castBoardVote, finalizeBoardDecision, listBoardQueue, tieBreakBoardDecision, type BoardQueueItem, type BoardVoteValue } from "../api/board.api"

interface BoardQueueRow {
  id: string
  seriesTitle: string
  owner: string
  status: string
  decisionStatus: string
  voteSummary: string
  age: string
}

const rankingRows: RankingTableRow[] = [
  { id: "ranking-1", rank: 1, seriesTitle: "Moonlit Atelier", voteCount: 1280, readerScore: "9.1", finalScore: "94.2", status: "IMPORTED", periodLabel: "June 2026" },
  { id: "ranking-2", rank: 2, seriesTitle: "Paper Comet", voteCount: 980, readerScore: "8.7", finalScore: "88.4", status: "REVIEWED", periodLabel: "June 2026" },
  { id: "ranking-3", rank: 7, seriesTitle: "Glass Lantern", voteCount: 320, readerScore: "6.4", finalScore: "61.8", status: "WARNING", periodLabel: "June 2026" },
]

const boardColumns: MFTableColumn<BoardQueueRow>[] = [
  { id: "series", header: "Series", cell: (row) => <div className="min-w-0"><p className="break-words text-label-md text-on-surface">{row.seriesTitle}</p><p className="mt-xs break-words text-label-sm text-on-surface-muted">Owner: {row.owner}</p></div> },
  { id: "series-status", header: "Series status", cell: (row) => <StatusBadge status={row.status} mapping={seriesStatusUI} /> },
  { id: "decision", header: "Decision", cell: (row) => <DecisionBadge status={row.decisionStatus} /> },
  { id: "votes", header: "Vote summary", cell: (row) => row.voteSummary },
  { id: "age", header: "Age", cell: (row) => row.age },
]

function BoardStatePreview() {
  return (
    <MFCard>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <h2 className="text-title-lg text-on-surface">Board states</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">Ranking and at-risk remain presentation-only. Queue and vote actions are now API-backed.</p>
        </div>
        <MFBadge tone="warning" size="md">Partial API</MFBadge>
      </div>
      <div className="mt-lg grid gap-md xl:grid-cols-4">
        <div className="rounded-3xl bg-surface-low p-lg" aria-label="Loading board preview"><div className="h-4 w-32 rounded-full bg-surface-container" /><div className="mt-md space-y-sm"><div className="h-3 rounded-full bg-surface-container" /><div className="h-3 w-2/3 rounded-full bg-surface-container" /><div className="h-3 w-1/2 rounded-full bg-surface-container" /></div><p className="mt-md text-label-sm text-on-surface-muted">Loading preview</p></div>
        <MFEmptyState icon="how_to_vote" title="No Board items" description="The Board queue stays empty until Series reach BOARD_REVIEW." />
        <MFErrorState title="Could not load Board queue" description="Recoverable API error preview." onRetry={() => undefined} />
        <div className="rounded-3xl bg-surface-low p-lg"><div className="flex flex-wrap gap-sm"><DecisionBadge status="PENDING" /><DecisionBadge status="TIE_BREAK_REQUIRED" /><StatusBadge status="IMPORTED" mapping={rankingStatusUI} /><AtRiskBadge status="AT_RISK" /></div><p className="mt-md text-body-md text-on-surface">Board statuses stay text-visible and do not rely on color alone.</p></div>
      </div>
    </MFCard>
  )
}

export function BoardPage() {
  const [queueItems, setQueueItems] = useState<BoardQueueItem[]>([])
  const [voteSummary, setVoteSummary] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null)
  const [votePreview, setVotePreview] = useState("No API vote action run yet.")
  const [atRiskPreview, setAtRiskPreview] = useState("No local at-risk action selected.")

  usePageTitle("Board Review", "Review approval, tie-break, ranking, and at-risk states.")

  async function loadBoardQueue() {
    setLoading(true)
    setError("")
    try {
      const response = await listBoardQueue()
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not load Board queue.")
        setQueueItems([])
        return
      }
      setQueueItems(response.data)
    } catch {
      setError("Could not reach MangaFlow. Check API server and try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadBoardQueue() }, [])

  const boardQueueRows = useMemo<BoardQueueRow[]>(() => queueItems.map((item) => {
    const summary = voteSummary[item.id] ?? `${item.voteSummary.APPROVE} approve / ${item.voteSummary.REJECT} reject / ${item.voteSummary.NEEDS_REVISION} revision`
    return {
      id: item.id,
      seriesTitle: item.seriesTitle,
      owner: item.ownerId,
      status: item.seriesStatus,
      decisionStatus: item.decisionStatus,
      voteSummary: summary,
      age: new Date(item.updatedAt).toLocaleDateString(),
    }
  }), [queueItems, voteSummary])

  const firstBoardSeries = queueItems.find((item) => item.seriesStatus === "BOARD_REVIEW") ?? queueItems[0] ?? null

  async function runVote(value: BoardVoteValue) {
    if (!firstBoardSeries) return
    setActiveSeriesId(firstBoardSeries.id)
    const response = await castBoardVote(firstBoardSeries.id, value)
    setActiveSeriesId(null)
    if (!response.success || !response.data) {
      setVotePreview(response.message ?? "Vote failed.")
      return
    }
    const summary = response.data.summary
    setVoteSummary((current) => ({ ...current, [firstBoardSeries.id]: `${summary.APPROVE} approve / ${summary.REJECT} reject / ${summary.NEEDS_REVISION} revision` }))
    setVotePreview(`${value} vote sent to backend for ${firstBoardSeries.seriesTitle}.`)
  }

  async function finalizeVote() {
    if (!firstBoardSeries) return
    setActiveSeriesId(firstBoardSeries.id)
    const response = await finalizeBoardDecision(firstBoardSeries.id)
    setActiveSeriesId(null)
    setVotePreview(response.success ? `Finalize sent for ${firstBoardSeries.seriesTitle}.` : response.message ?? "Finalize failed.")
    await loadBoardQueue()
  }

  async function tieBreak(value: BoardVoteValue) {
    if (!firstBoardSeries) return
    setActiveSeriesId(firstBoardSeries.id)
    const response = await tieBreakBoardDecision(firstBoardSeries.id, value)
    setActiveSeriesId(null)
    setVotePreview(response.success ? `Tie-break ${value} sent for ${firstBoardSeries.seriesTitle}.` : response.message ?? "Tie-break failed.")
    await loadBoardQueue()
  }

  function recordAtRisk(label: string) {
    setAtRiskPreview(`${label} selected locally. No at-risk decision API call was sent.`)
  }

  const boardActions: ActionItem[] = [
    { id: "board-action-1", title: "Series approval queue", description: firstBoardSeries ? `${firstBoardSeries.seriesTitle} is ready for Board workflow.` : "No live Board-review Series available.", metadata: "Queue is API-backed", icon: "how_to_vote", status: "PENDING" },
    { id: "board-action-2", title: "Tie-break workflow", description: "Tie-break action is API-backed and reserved for Board Chair.", metadata: "Chair-only backend rule", icon: "balance", status: "TIE_BREAK_REQUIRED" },
  ]

  const voteOptions: VoteCardOption[] = [
    { id: "approve", label: "Approve", description: "Send Board approve vote to backend.", countLabel: "API-backed", icon: "thumb_up", onVote: () => void runVote("APPROVE") },
    { id: "reject", label: "Reject", description: "Send Board reject vote to backend.", countLabel: "API-backed", icon: "thumb_down", onVote: () => void runVote("REJECT") },
    { id: "needs-revision", label: "Needs revision", description: "Return proposal for revision.", countLabel: "API-backed", icon: "undo", onVote: () => void runVote("NEEDS_REVISION") },
  ]

  if (loading) return <PageShell><MFCard><div className="h-40 rounded-3xl bg-surface-low" /></MFCard></PageShell>
  if (error) return <PageShell><MFErrorState title="Could not load Board queue" description={error} onRetry={() => void loadBoardQueue()} /></PageShell>

  return (
    <PageShell>
      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_22rem]">
        <MFCard padding="lg" className="rounded-3xl">
          <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-sm"><MFBadge tone="primary" size="md">Editorial Board</MFBadge><MFBadge tone="success" size="md">Queue API connected</MFBadge></div>
              <h1 className="mt-md text-headline-lg text-on-surface">Board review</h1>
              <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">Board queue and vote actions now call backend APIs. Ranking and at-risk remain presentation-only.</p>
            </div>
          </div>
        </MFCard>
        <MFCard><h2 className="text-title-lg text-on-surface">Decision boundary</h2><p className="mt-sm text-body-md text-on-surface-muted">Plurality, tie-break requirement, and Series approval state remain backend-owned. The UI only triggers explicit Board actions.</p></MFCard>
      </section>

      <section className="grid gap-lg xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div><h2 className="mb-md text-title-lg text-on-surface">Board actions</h2><ActionItemList items={boardActions} statusMapping={boardDecisionStatusUI} /></div>
        <div><h2 className="mb-md text-title-lg text-on-surface">Approval queue</h2><MFTable caption="Board approval queue" rows={boardQueueRows} columns={boardColumns} getRowKey={(row) => row.id} emptyTitle="No Board queue items" emptyDescription="Board records appear here when backend grants access and Series reach BOARD_REVIEW." /></div>
      </section>

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-lg">
          <VoteCard title="Series approval vote" description={firstBoardSeries ? `Vote on ${firstBoardSeries.seriesTitle}.` : "No Series in BOARD_REVIEW."} options={voteOptions} resultLabel={firstBoardSeries?.seriesStatus ?? "No target"} totalVotesLabel={firstBoardSeries ? voteSummary[firstBoardSeries.id] ?? "No live summary yet" : "No live series"} tieBreakRequired={votePreview.includes("Tie-break")} boardChairNote="Board Chair tie-break remains backend-authorized only." disabled={!firstBoardSeries || activeSeriesId === firstBoardSeries.id} loadingOptionId={null} />
          <MFCard><div className="flex flex-wrap items-start justify-between gap-md"><div><h2 className="text-title-lg text-on-surface">Board workflow actions</h2><p className="mt-xs text-body-md text-on-surface-muted">Finalize and tie-break call backend endpoints.</p></div><MFBadge tone="neutral" size="md">API-backed</MFBadge></div><div className="mt-lg flex flex-wrap gap-sm"><MFButton type="button" variant="outline" size="sm" onClick={() => void finalizeVote()} disabled={!firstBoardSeries || Boolean(activeSeriesId)}>Finalize decision</MFButton><MFButton type="button" variant="outline" size="sm" onClick={() => void tieBreak("APPROVE")} disabled={!firstBoardSeries || Boolean(activeSeriesId)}>Tie-break approve</MFButton><MFButton type="button" variant="outline" size="sm" onClick={() => void tieBreak("REJECT")} disabled={!firstBoardSeries || Boolean(activeSeriesId)}>Tie-break reject</MFButton><MFButton type="button" variant="outline" size="sm" onClick={() => void tieBreak("NEEDS_REVISION")} disabled={!firstBoardSeries || Boolean(activeSeriesId)}>Tie-break revision</MFButton></div><p className="mt-lg rounded-2xl bg-surface-low p-lg text-body-md text-on-surface">{votePreview}</p></MFCard>
        </div>

        <div className="space-y-lg">
          <MFCard><h2 className="text-title-lg text-on-surface">Decision status</h2><p className="mt-xs text-body-md text-on-surface-muted">Decision badges stay display-only summaries of backend state.</p><div className="mt-lg flex flex-wrap gap-sm"><DecisionBadge status="PENDING" size="md" /><DecisionBadge status="TIE_BREAK_REQUIRED" size="md" /><DecisionBadge status="FINALIZED" size="md" /></div></MFCard>
          <MFCard><h2 className="text-title-lg text-on-surface">At-risk status</h2><p className="mt-xs text-body-md text-on-surface-muted">At-risk actions remain local preview only.</p><div className="mt-lg flex flex-wrap gap-sm"><AtRiskBadge status="WARNING" size="md" /><AtRiskBadge status="AT_RISK" size="md" /><AtRiskBadge status="CONTINUE" size="md" /></div></MFCard>
        </div>
      </section>

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div><h2 className="mb-md text-title-lg text-on-surface">Ranking preview</h2><RankingTable rows={rankingRows} /></div>
        <div className="space-y-lg"><ReviewDecisionBar title="At-risk action preview" description="Still local-only preview. No backend at-risk endpoint is called." approveLabel="Keep stable locally" requestRevisionLabel="Watchlist locally" rejectLabel="Mark at risk locally" rejectConfirmationTitle="Preview at-risk decision?" rejectConfirmationDescription="This confirms a local preview action only and will not update Board records." onApprove={() => recordAtRisk("Keep stable")} onRequestRevision={() => recordAtRisk("Watchlist")} onReject={() => recordAtRisk("Mark at risk")} /><MFCard><div className="flex flex-wrap items-start justify-between gap-md"><div><h2 className="text-title-lg text-on-surface">Local at-risk preview</h2><p className="mt-xs text-body-md text-on-surface-muted">Confirmation updates this copy only.</p></div><MFBadge tone="neutral" size="md">Local only</MFBadge></div><p className="mt-lg rounded-2xl bg-surface-low p-lg text-body-md text-on-surface">{atRiskPreview}</p></MFCard></div>
      </section>

      <BoardStatePreview />
    </PageShell>
  )
}
