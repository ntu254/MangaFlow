import { Link } from "react-router-dom"
import { ArrowRight, Vote } from "lucide-react"
import { useBoardQueue } from "@/hooks/useBoardFlow"

export default function BoardSeriesReviewPage() {
  const { data = [], isLoading, isError } = useBoardQueue()

  if (isLoading) return <div className="p-6 text-gray-500">Loading Board queue...</div>
  if (isError) return <div className="p-6 text-red-500">Failed to load Board queue.</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Series Review</h1>
        <p className="text-sm text-muted-foreground">Editorial Board voting queue and finalized proposal decisions.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {data.map((item) => (
          <Link
            key={item.id}
            to={`/app/board/series/${item.id}/summary`}
            className="rounded-lg border bg-white p-5 transition hover:border-purple-200 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900">{item.seriesTitle}</h2>
                <p className="mt-1 text-xs font-semibold uppercase text-slate-400">{item.seriesStatus} / {item.decisionStatus}</p>
              </div>
              <ArrowRight size={18} className="text-slate-400" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <VoteStat label="Approve" value={item.voteSummary.APPROVE} />
              <VoteStat label="Reject" value={item.voteSummary.REJECT} />
              <VoteStat label="Revision" value={item.voteSummary.NEEDS_REVISION} />
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-slate-500">
              <span>Requested: {item.requestedPublicationType ?? "-"}</span>
              <span className="inline-flex items-center gap-1"><Vote size={13} /> {item.voteCount} vote(s)</span>
            </div>
          </Link>
        ))}
      </div>

      {data.length === 0 && (
        <div className="rounded-lg border bg-white p-12 text-center text-slate-500">No series are waiting for Board review.</div>
      )}
    </div>
  )
}

function VoteStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="font-bold text-slate-900">{value}</p>
      <p className="text-slate-500">{label}</p>
    </div>
  )
}
