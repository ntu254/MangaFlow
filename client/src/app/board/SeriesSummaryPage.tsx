import { useMemo, useState } from "react"

import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CheckCircle2, GitPullRequest, ThumbsDown, Vote } from "lucide-react"
import { useBoardQueue } from "@/features/reviews/hooks/useBoardFlow"
import { useBoardActions } from "@/features/reviews/hooks/useBoardFlow"
import { useSeriesSummary } from "@/features/series/hooks/useSeries"
import type { BoardVoteValue } from "@/features/reviews/services/board.api"
import type { PublicationType } from "@/features/series/services/series.api"
import { RankingReportCard } from "@/features/board/components/RankingReportCard"
import { VoteSummary } from "@/features/board/components/VoteSummary"
import { BoardDecisionPanel } from "@/features/board/components/BoardDecisionPanel"
import { ReasonRequiredComposer } from "@/features/board/components/ReasonRequiredComposer"

export default function BoardSeriesSummaryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: summary, isLoading, isError } = useSeriesSummary(id)
  const { data: queue = [] } = useBoardQueue()
  const queueItem = useMemo(() => queue.find((item) => item.id === id), [queue, id])
  const actions = useBoardActions(id)
  const [voteValue, setVoteValue] = useState<BoardVoteValue>("APPROVE")
  const [voteNote, setVoteNote] = useState("")
  const [publicationType, setPublicationType] = useState<PublicationType>("WEEKLY")
  const [decisionNote, setDecisionNote] = useState("")

  if (isLoading) return <div className="p-6 text-gray-500">Loading Board summary...</div>
  if (isError || !summary) return <div className="p-6 text-rose-500">Failed to load Board summary.</div>

  const busy = actions.vote.isPending || actions.finalize.isPending || actions.tieBreak.isPending
  const decisionStatus = queueItem?.decisionStatus ?? summary.boardReview?.status ?? "PENDING"
  const isTieBreak = decisionStatus === "TIE_BREAK_REQUIRED"

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <section className="space-y-6">
          <RankingReportCard data={{
             rank: (summary as any)?.ranking?.rank || '-', 
             score: (summary as any)?.ranking?.score || '-', 
             trend: (summary as any)?.ranking?.trend || 'UP', 
             trendValue: (summary as any)?.ranking?.trendValue || '+0',
             atRisk: (summary as any)?.ranking?.atRisk || false,
             atRiskReason: (summary as any)?.ranking?.atRiskReason
          }} />

          <div className="rounded-2xl border border-slate-200 shadow-sm bg-white p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{summary.series.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{summary.series.synopsis}</p>
            </div>
            <span className="rounded-md bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{summary.series.status}</span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Info label="Genre" value={summary.series.genres?.join(", ") || "-"} />
            <Info label="Audience" value={summary.series.targetAudience || "-"} />
            <Info label="Requested Type" value={summary.series.requestedPublicationType || "-"} />
            <Info label="Board Type" value={summary.series.publicationType || "-"} />
          </div>

          <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-bold text-slate-900">Latest Manuscript</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-3">
              <Info label="Version" value={`v${summary.currentManuscript?.version ?? "-"}`} />
              <Info label="Status" value={summary.currentManuscript?.status ?? "-"} />
              <Info label="File" value={summary.currentManuscript?.file?.originalName ?? "-"} />
            </div>
          </div>

          </div>
        </section>

        <aside className="space-y-6">
          <VoteSummary 
             votes={(summary as any)?.boardReview?.votes || []}
             pendingCount={Math.max(0, 3 - (summary?.boardReview?.voteCount || 0))}
             isFinalized={summary?.boardReview?.status === "FINALIZED"}
          />

          <BoardDecisionPanel title="Cast Vote" icon={<Vote size={18} className="text-violet-600"/>} tone="violet">
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: "APPROVE", label: "Approve", icon: <CheckCircle2 size={16} /> },
                { value: "REJECT", label: "Reject", icon: <ThumbsDown size={16} /> },
                { value: "NEEDS_REVISION", label: "Needs Revision", icon: <GitPullRequest size={16} /> }
              ].map((vote) => (
                <button
                  key={vote.value}
                  onClick={() => setVoteValue(vote.value as BoardVoteValue)}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border text-[13px] font-bold shadow-sm transition-all ${voteValue === vote.value ? "border-violet-500 bg-violet-50 text-violet-700 ring-2 ring-violet-50" : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50"}`}
                >
                  {vote.icon} {vote.label}
                </button>
              ))}
            </div>
            
            <ReasonRequiredComposer 
              label="Vote Note"
              value={voteNote}
              onChange={(e) => setVoteNote(e.target.value)}
              placeholder="Add your note..."
            />
            <button
              disabled={busy || summary.series.status !== "BOARD_REVIEW" || !voteNote.trim()}
              onClick={() => actions.vote.mutate({ value: voteValue, note: voteNote || undefined })}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-[13px] font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 transition-colors"
            >
              <Vote size={16} /> Submit Vote
            </button>
          </BoardDecisionPanel>

          <BoardDecisionPanel title={isTieBreak ? "Tie-Break Decision" : "Finalize Decision"} icon={<ArrowLeft size={18} className="text-emerald-600 rotate-180"/>} tone="emerald">
            <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              Publication type for approval
              <select
                value={publicationType}
                onChange={(event) => setPublicationType(event.target.value as PublicationType)}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 transition-all shadow-sm"
              >
                <option value="WEEKLY">WEEKLY</option>
                <option value="MONTHLY">MONTHLY</option>
              </select>
            </label>
            
            <ReasonRequiredComposer 
              label="Decision Note"
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder="Finalize note..."
            />
            
            <button
              disabled={busy || summary.series.status !== "BOARD_REVIEW" || !decisionNote.trim()}
              onClick={() => {
                if (isTieBreak) {
                  actions.tieBreak.mutate({ value: voteValue, publicationType: voteValue === "APPROVE" ? publicationType : undefined, note: decisionNote || undefined })
                } else {
                  actions.finalize.mutate({ publicationType, note: decisionNote || undefined })
                }
              }}
              className="mt-2 h-11 w-full rounded-xl bg-emerald-600 text-[13px] font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
            >
              {isTieBreak ? "Finalize Tie-Break" : "Finalize Vote Result"}
            </button>
          </BoardDecisionPanel>
        </aside>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}
