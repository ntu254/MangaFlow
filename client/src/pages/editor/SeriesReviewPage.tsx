import { useState } from "react"
import type { ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Send, XCircle, RefreshCcw } from "lucide-react"
import { useEditorActions, useEditorSeriesReview } from "@/hooks/useEditorFlow"
import type { PublicationType } from "@/api/series"

export default function EditorSeriesReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useEditorSeriesReview(id)
  const actions = useEditorActions(id)
  const [revisionReason, setRevisionReason] = useState("")
  const [feedbackSummary, setFeedbackSummary] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [editorRecommendation, setEditorRecommendation] = useState("")
  const [feasibilityNote, setFeasibilityNote] = useState("")
  const [suggestedPublicationType, setSuggestedPublicationType] = useState<PublicationType>("WEEKLY")
  const [riskNote, setRiskNote] = useState("")

  if (isLoading) return <div className="p-6 text-gray-500">Loading series review...</div>
  if (isError || !data) return <div className="p-6 text-red-500">Failed to load series review.</div>

  const busy = actions.requestRevision.isPending || actions.reject.isPending || actions.forwardToBoard.isPending

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-lg border bg-white p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{data.series.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{data.series.synopsis}</p>
            </div>
            <span className="rounded-md bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">{data.series.status}</span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Info label="Genre" value={data.series.genres?.join(", ") || "-"} />
            <Info label="Target Audience" value={data.series.targetAudience || "-"} />
            <Info label="Requested Type" value={data.series.requestedPublicationType || "-"} />
          </div>

          <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-bold text-slate-900">Latest Manuscript</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-3">
              <Info label="Version" value={`v${data.manuscript.version}`} />
              <Info label="Status" value={data.manuscript.status} />
              <Info label="File" value={data.manuscript.file?.originalName ?? "-"} />
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <ActionPanel title="Request Revision">
            <TextArea label="Revision reason" value={revisionReason} onChange={setRevisionReason} />
            <TextArea label="Feedback summary" value={feedbackSummary} onChange={setFeedbackSummary} />
            <button
              disabled={busy || !revisionReason.trim() || !feedbackSummary.trim()}
              onClick={() => actions.requestRevision.mutate({ revisionReason, feedbackSummary })}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-amber-600 px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              <RefreshCcw size={16} /> Request Revision
            </button>
          </ActionPanel>

          <ActionPanel title="Forward To Board">
            <TextArea label="Editor recommendation" value={editorRecommendation} onChange={setEditorRecommendation} />
            <TextArea label="Feasibility note" value={feasibilityNote} onChange={setFeasibilityNote} />
            <label className="block text-xs font-bold uppercase text-slate-500">
              Suggested publication type
              <select
                value={suggestedPublicationType}
                onChange={(event) => setSuggestedPublicationType(event.target.value as PublicationType)}
                className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900"
              >
                <option value="WEEKLY">WEEKLY</option>
                <option value="MONTHLY">MONTHLY</option>
              </select>
            </label>
            <TextArea label="Risk note" value={riskNote} onChange={setRiskNote} optional />
            <button
              disabled={busy || !editorRecommendation.trim() || !feasibilityNote.trim()}
              onClick={() => actions.forwardToBoard.mutate({ editorRecommendation, feasibilityNote, suggestedPublicationType, riskNote: riskNote || undefined })}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              <Send size={16} /> Forward To Board
            </button>
          </ActionPanel>

          <ActionPanel title="Reject">
            <TextArea label="Reject reason" value={rejectReason} onChange={setRejectReason} />
            <button
              disabled={busy || !rejectReason.trim()}
              onClick={() => actions.reject.mutate({ rejectReason })}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-rose-600 px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              <XCircle size={16} /> Reject Series
            </button>
          </ActionPanel>

          <Link to={`/app/mangaka/series/${data.series.id}`} className="block text-center text-xs font-semibold text-slate-500 hover:text-slate-900">
            Open mangaka view
          </Link>
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

function ActionPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border bg-white p-4">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {children}
    </div>
  )
}

function TextArea({ label, value, onChange, optional = false }: { label: string; value: string; onChange: (value: string) => void; optional?: boolean }) {
  return (
    <label className="block text-xs font-bold uppercase text-slate-500">
      {label} {optional && <span className="font-medium normal-case text-slate-400">(optional)</span>}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-20 w-full resize-none rounded-md border border-slate-200 p-3 text-sm normal-case text-slate-900"
      />
    </label>
  )
}
