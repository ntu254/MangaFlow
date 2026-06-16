import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CheckCircle2, GitPullRequest, ThumbsDown, Vote } from "lucide-react"
import { useBoardQueue } from "@/hooks/useBoardFlow"
import { useBoardActions } from "@/hooks/useBoardFlow"
import { useSeriesSummary } from "@/hooks/useSeries"
import type { BoardVoteValue } from "@/api/board"
import type { PublicationType } from "@/api/series"

const VOTES: Array<{ value: BoardVoteValue; label: string; icon: ReactNode }> = [
  { value: "APPROVE", label: "Approve", icon: <CheckCircle2 size={16} /> },
  { value: "REJECT", label: "Reject", icon: <ThumbsDown size={16} /> },
  { value: "NEEDS_REVISION", label: "Needs Revision", icon: <GitPullRequest size={16} /> },
]

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
  if (isError || !summary) return <div className="p-6 text-red-500">Failed to load Board summary.</div>

  const busy = actions.vote.isPending || actions.finalize.isPending || actions.tieBreak.isPending
  const decisionStatus = queueItem?.decisionStatus ?? summary.boardReview?.status ?? "PENDING"
  const isTieBreak = decisionStatus === "TIE_BREAK_REQUIRED"

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-lg border bg-white p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{summary.series.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{summary.series.synopsis}</p>
            </div>
            <span className="rounded-md bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">{summary.series.status}</span>
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

          <div className="mt-6 grid grid-cols-3 gap-3">
            <VoteStat label="Approve" value={queueItem?.voteSummary.APPROVE ?? 0} />
            <VoteStat label="Reject" value={queueItem?.voteSummary.REJECT ?? 0} />
            <VoteStat label="Needs Revision" value={queueItem?.voteSummary.NEEDS_REVISION ?? 0} />
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-white p-4">
            <h2 className="text-sm font-bold text-slate-900">Cast Vote</h2>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {VOTES.map((vote) => (
                <button
                  key={vote.value}
                  onClick={() => setVoteValue(vote.value)}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-bold ${voteValue === vote.value ? "border-purple-600 bg-purple-50 text-purple-700" : "border-slate-200 text-slate-700"}`}
                >
                  {vote.icon} {vote.label}
                </button>
              ))}
            </div>
            <textarea
              value={voteNote}
              onChange={(event) => setVoteNote(event.target.value)}
              placeholder="Vote note"
              className="mt-3 min-h-20 w-full resize-none rounded-md border border-slate-200 p-3 text-sm"
            />
            <button
              disabled={busy || summary.series.status !== "BOARD_REVIEW"}
              onClick={() => actions.vote.mutate({ value: voteValue, note: voteNote || undefined })}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-900 text-sm font-bold text-white disabled:opacity-50"
            >
              <Vote size={16} /> Submit Vote
            </button>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h2 className="text-sm font-bold text-slate-900">{isTieBreak ? "Tie-Break Decision" : "Finalize Decision"}</h2>
            <label className="mt-3 block text-xs font-bold uppercase text-slate-500">
              Publication type for approval
              <select
                value={publicationType}
                onChange={(event) => setPublicationType(event.target.value as PublicationType)}
                className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900"
              >
                <option value="WEEKLY">WEEKLY</option>
                <option value="MONTHLY">MONTHLY</option>
              </select>
            </label>
            <textarea
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              placeholder="Decision note"
              className="mt-3 min-h-20 w-full resize-none rounded-md border border-slate-200 p-3 text-sm"
            />
            <button
              disabled={busy || summary.series.status !== "BOARD_REVIEW"}
              onClick={() => {
                if (isTieBreak) {
                  actions.tieBreak.mutate({ value: voteValue, publicationType: voteValue === "APPROVE" ? publicationType : undefined, note: decisionNote || undefined })
                } else {
                  actions.finalize.mutate({ publicationType, note: decisionNote || undefined })
                }
              }}
              className="mt-3 h-10 w-full rounded-md bg-emerald-600 text-sm font-bold text-white disabled:opacity-50"
            >
              {isTieBreak ? "Finalize Tie-Break" : "Finalize Vote Result"}
            </button>
          </div>
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

function VoteStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 p-3 text-center">
      <p className="text-lg font-black text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  )
}
