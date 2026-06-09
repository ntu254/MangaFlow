import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { BoardAtRiskPanel, BoardQueuePanel, BoardRankingPanel, BoardStatePreview, BoardVotePanel } from "../components/BoardPanels"
import { useBoardPage } from "../hooks/useBoardPage"

export function BoardPage() {
  const board = useBoardPage()
  usePageTitle("Board Review", "Review approval, tie-break, ranking, and at-risk states.")

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

      <BoardQueuePanel boardActions={board.boardActions} boardQueueRows={board.boardQueueRows} loading={board.loading} error={board.error} onRetry={() => void board.loadBoardQueue()} />

      {!board.loading && !board.error ? <BoardVotePanel firstBoardSeries={board.firstBoardSeries} activeSeriesId={board.activeSeriesId} votePreview={board.votePreview} voteOptions={board.voteOptions} finalizeVote={board.finalizeVote} tieBreak={board.tieBreak} /> : null}

      {!board.loading && !board.error ? <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]"><BoardRankingPanel rankingRows={board.rankingRows} rankingLoading={board.rankingLoading} rankingForm={board.rankingForm} setRankingForm={board.setRankingForm} rankingMessage={board.rankingMessage} submitRankingImport={board.submitRankingImport} finalizeTopRanking={board.finalizeTopRanking} /><BoardAtRiskPanel firstAtRiskSeries={board.firstAtRiskSeries} atRiskPreview={board.atRiskPreview} submitAtRiskDecision={board.submitAtRiskDecision} /></section> : null}

      {!board.loading && !board.error ? <BoardStatePreview /> : null}
    </PageShell>
  )
}
