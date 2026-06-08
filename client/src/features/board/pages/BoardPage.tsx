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
import { finalizeRanking, importRanking, listRankings, type RankingRecord } from "@/features/ranking/api/ranking.api"
import {
  castBoardVote,
  createAtRiskDecision,
  finalizeBoardDecision,
  listBoardQueue,
  tieBreakBoardDecision,
  type AtRiskDecisionValue,
  type BoardQueueItem,
  type BoardVoteValue,
} from "../api/board.api"

interface BoardQueueRow {
  id: string
  seriesTitle: string
  owner: string
  status: string
  decisionStatus: string
  voteSummary: string
  age: string
}

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
          <p className="mt-xs text-body-md text-on-surface-muted">Queue, ranking, and at-risk actions are backend-owned. The UI shows explicit workflow actions only.</p>
        </div>
        <MFBadge tone="success" size="md">API-backed</MFBadge>
      </div>
      <div className="mt-lg grid gap-md xl:grid-cols-4">
        <div className="rounded-3xl bg-surface-low p-lg" aria-label="Loading board preview"><div className="h-4 w-32 rounded-full bg-surface-container" /><div className="mt-md space-y-sm"><div className="h-3 rounded-full bg-surface-container" /><div className="h-3 w-2/3 rounded-full bg-surface-container" /><div className="h-3 w-1/2 rounded-full bg-surface-container" /></div><p className="mt-md text-label-sm text-on-surface-muted">Loading preview</p></div>
        <MFEmptyState icon="how_to_vote" title="No Board items" description="The Board queue stays empty until Series reach BOARD_REVIEW or AT_RISK." />
        <MFErrorState title="Could not load Board queue" description="Recoverable API error preview." onRetry={() => undefined} />
        <div className="rounded-3xl bg-surface-low p-lg"><div className="flex flex-wrap gap-sm"><DecisionBadge status="PENDING" /><DecisionBadge status="TIE_BREAK_REQUIRED" /><StatusBadge status="IMPORTED" mapping={rankingStatusUI} /><AtRiskBadge status="AT_RISK" /></div><p className="mt-md text-body-md text-on-surface">Board workflow states stay text-visible and do not rely on color alone.</p></div>
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
  const [atRiskPreview, setAtRiskPreview] = useState("No at-risk API action run yet.")
  const [rankingRecords, setRankingRecords] = useState<RankingRecord[]>([])
  const [rankingLoading, setRankingLoading] = useState(true)
  const [rankingMessage, setRankingMessage] = useState("No ranking API action run yet.")
  const [rankingForm, setRankingForm] = useState({ period: "", seriesId: "", voteCount: "", readerScore: "" })

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

  async function loadRankings() {
    setRankingLoading(true)
    const response = await listRankings()
    if (!response.success || !response.data) {
      setRankingMessage(response.message ?? "Could not load rankings.")
      setRankingRecords([])
    } else {
      setRankingRecords(response.data)
    }
    setRankingLoading(false)
  }

  useEffect(() => { void loadBoardQueue(); void loadRankings() }, [])

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
  const firstAtRiskSeries = queueItems.find((item) => item.seriesStatus === "AT_RISK") ?? null

  const rankingRows = useMemo<RankingTableRow[]>(() => rankingRecords.map((record, index) => {
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
  }), [rankingRecords])

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

  async function submitRankingImport() {
    const response = await importRanking({
      period: rankingForm.period,
      seriesId: rankingForm.seriesId,
      voteCount: Number(rankingForm.voteCount),
      readerScore: Number(rankingForm.readerScore),
    })
    setRankingMessage(response.success ? "Ranking imported with backend formula." : response.message ?? "Ranking import failed.")
    await loadRankings()
  }

  async function finalizeTopRanking() {
    const target = rankingRecords.find((record) => record.status === "IMPORTED") ?? rankingRecords[0]
    if (!target) {
      setRankingMessage("No ranking row available to finalize.")
      return
    }
    const response = await finalizeRanking(target.id)
    setRankingMessage(response.success ? "Ranking finalized by backend." : response.message ?? "Ranking finalize failed.")
    await loadRankings()
  }

  async function submitAtRiskDecision(decision: AtRiskDecisionValue, note: string) {
    if (!firstAtRiskSeries) {
      setAtRiskPreview("No AT_RISK series is available for manual Board action.")
      return
    }
    setActiveSeriesId(firstAtRiskSeries.id)
    const response = await createAtRiskDecision(firstAtRiskSeries.id, decision, note)
    setActiveSeriesId(null)
    setAtRiskPreview(response.success ? `${decision} recorded for ${firstAtRiskSeries.seriesTitle}.` : response.message ?? "At-risk decision failed.")
    await loadBoardQueue()
  }

  const boardActions: ActionItem[] = [
    { id: "board-action-1", title: "Series approval queue", description: firstBoardSeries ? `${firstBoardSeries.seriesTitle} is ready for Board workflow.` : "No live Board-review Series available.", metadata: "Queue is API-backed", icon: "how_to_vote", status: "PENDING" },
    { id: "board-action-2", title: "Tie-break workflow", description: "Tie-break action is API-backed and reserved for Board Chair.", metadata: "Chair-only backend rule", icon: "balance", status: "TIE_BREAK_REQUIRED" },
    { id: "board-action-3", title: "At-risk review", description: firstAtRiskSeries ? `${firstAtRiskSeries.seriesTitle} needs a manual Board at-risk decision.` : "No AT_RISK Series currently needs a manual Board decision.", metadata: "Manual Board action", icon: "warning", status: firstAtRiskSeries ? "AT_RISK" : "PENDING" },
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
              <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">Board queue, vote actions, ranking import/finalize, and at-risk decisions now call backend APIs.</p>
            </div>
          </div>
        </MFCard>
        <MFCard><h2 className="text-title-lg text-on-surface">Decision boundary</h2><p className="mt-sm text-body-md text-on-surface-muted">Plurality, tie-break requirement, at-risk cancellation, and Series workflow state remain backend-owned. The UI only triggers explicit Board actions.</p></MFCard>
      </section>

      <section className="grid gap-lg xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div><h2 className="mb-md text-title-lg text-on-surface">Board actions</h2><ActionItemList items={boardActions} statusMapping={boardDecisionStatusUI} /></div>
        <div><h2 className="mb-md text-title-lg text-on-surface">Approval queue</h2><MFTable caption="Board approval queue" rows={boardQueueRows} columns={boardColumns} getRowKey={(row) => row.id} emptyTitle="No Board queue items" emptyDescription="Board records appear here when backend grants access and Series reach BOARD_REVIEW or AT_RISK." /></div>
      </section>

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-lg">
          <VoteCard title="Series approval vote" description={firstBoardSeries ? `Vote on ${firstBoardSeries.seriesTitle}.` : "No Series in BOARD_REVIEW."} options={voteOptions} resultLabel={firstBoardSeries?.seriesStatus ?? "No target"} totalVotesLabel={firstBoardSeries ? voteSummary[firstBoardSeries.id] ?? "No live summary yet" : "No live series"} tieBreakRequired={votePreview.includes("Tie-break")} boardChairNote="Board Chair tie-break remains backend-authorized only." disabled={!firstBoardSeries || activeSeriesId === firstBoardSeries.id} loadingOptionId={null} />
          <MFCard><div className="flex flex-wrap items-start justify-between gap-md"><div><h2 className="text-title-lg text-on-surface">Board workflow actions</h2><p className="mt-xs text-body-md text-on-surface-muted">Finalize and tie-break call backend endpoints.</p></div><MFBadge tone="neutral" size="md">API-backed</MFBadge></div><div className="mt-lg flex flex-wrap gap-sm"><MFButton type="button" variant="outline" size="sm" onClick={() => void finalizeVote()} disabled={!firstBoardSeries || Boolean(activeSeriesId)}>Finalize decision</MFButton><MFButton type="button" variant="outline" size="sm" onClick={() => void tieBreak("APPROVE")} disabled={!firstBoardSeries || Boolean(activeSeriesId)}>Tie-break approve</MFButton><MFButton type="button" variant="outline" size="sm" onClick={() => void tieBreak("REJECT")} disabled={!firstBoardSeries || Boolean(activeSeriesId)}>Tie-break reject</MFButton><MFButton type="button" variant="outline" size="sm" onClick={() => void tieBreak("NEEDS_REVISION")} disabled={!firstBoardSeries || Boolean(activeSeriesId)}>Tie-break revision</MFButton></div><p className="mt-lg rounded-2xl bg-surface-low p-lg text-body-md text-on-surface">{votePreview}</p></MFCard>
        </div>

        <div className="space-y-lg">
          <MFCard><h2 className="text-title-lg text-on-surface">Decision status</h2><p className="mt-xs text-body-md text-on-surface-muted">Decision badges stay display-only summaries of backend state.</p><div className="mt-lg flex flex-wrap gap-sm"><DecisionBadge status="PENDING" size="md" /><DecisionBadge status="TIE_BREAK_REQUIRED" size="md" /><DecisionBadge status="FINALIZED" size="md" /></div></MFCard>
          <MFCard><h2 className="text-title-lg text-on-surface">At-risk status</h2><p className="mt-xs text-body-md text-on-surface-muted">Manual Board at-risk outcomes stay text-visible and use explicit confirmation.</p><div className="mt-lg flex flex-wrap gap-sm"><AtRiskBadge status="WARNING" size="md" /><AtRiskBadge status="AT_RISK" size="md" /><AtRiskBadge status="CONTINUE" size="md" /></div></MFCard>
        </div>
      </section>

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-md"><div className="flex flex-wrap items-center justify-between gap-md"><h2 className="text-title-lg text-on-surface">Ranking import</h2><MFBadge tone="success" size="md">API-backed</MFBadge></div><RankingTable rows={rankingRows} loading={rankingLoading} /><MFCard><div className="grid gap-md md:grid-cols-4"><input className="rounded-xl border border-outline-variant bg-surface-lowest px-md py-sm text-body-md" placeholder="Period e.g. 2026-06" value={rankingForm.period} onChange={(event) => setRankingForm((current) => ({ ...current, period: event.target.value }))} /><input className="rounded-xl border border-outline-variant bg-surface-lowest px-md py-sm text-body-md" placeholder="Series ID" value={rankingForm.seriesId} onChange={(event) => setRankingForm((current) => ({ ...current, seriesId: event.target.value }))} /><input className="rounded-xl border border-outline-variant bg-surface-lowest px-md py-sm text-body-md" placeholder="Vote count" inputMode="numeric" value={rankingForm.voteCount} onChange={(event) => setRankingForm((current) => ({ ...current, voteCount: event.target.value }))} /><input className="rounded-xl border border-outline-variant bg-surface-lowest px-md py-sm text-body-md" placeholder="Reader score 1-10" inputMode="decimal" value={rankingForm.readerScore} onChange={(event) => setRankingForm((current) => ({ ...current, readerScore: event.target.value }))} /></div><div className="mt-md flex flex-wrap gap-sm"><MFButton type="button" size="sm" onClick={() => void submitRankingImport()} disabled={!rankingForm.period || !rankingForm.seriesId || !rankingForm.voteCount || !rankingForm.readerScore}>Import ranking</MFButton><MFButton type="button" variant="outline" size="sm" onClick={() => void finalizeTopRanking()}>Finalize top imported row</MFButton></div><p className="mt-md rounded-2xl bg-surface-low p-md text-body-md text-on-surface">{rankingMessage}</p></MFCard></div>
        <div className="space-y-lg"><ReviewDecisionBar title="At-risk decision" description={firstAtRiskSeries ? `Manual Board action for ${firstAtRiskSeries.seriesTitle}.` : "No AT_RISK series is waiting for a Board at-risk decision."} approveLabel="Continue production" requestRevisionLabel="Request plan" rejectLabel="Cancel series" rejectConfirmationTitle="Cancel this at-risk series?" rejectConfirmationDescription="This sends a real backend Board cancellation decision and moves the Series to CANCELLED." onApprove={() => void submitAtRiskDecision("CONTINUE", "Continue production after Board at-risk review.")} onRequestRevision={() => void submitAtRiskDecision("REQUEST_IMPROVEMENT_PLAN", "Board requests an improvement plan before continuing.")} onReject={() => void submitAtRiskDecision("CANCEL", "Board manually cancelled this AT_RISK series.")} /><MFCard><div className="flex flex-wrap items-start justify-between gap-md"><div><h2 className="text-title-lg text-on-surface">At-risk decision result</h2><p className="mt-xs text-body-md text-on-surface-muted">Backend response updates this summary after confirmation.</p></div><MFBadge tone="neutral" size="md">Manual Board action</MFBadge></div><p className="mt-lg rounded-2xl bg-surface-low p-lg text-body-md text-on-surface">{atRiskPreview}</p></MFCard></div>
      </section>

      <BoardStatePreview />
    </PageShell>
  )
}
