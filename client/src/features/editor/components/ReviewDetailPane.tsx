import { useState } from "react"
import { Link } from "react-router-dom"
import { Send, XCircle, RefreshCcw, FileText } from "lucide-react"
import { useEditorActions, useEditorSeriesReview } from "@/features/reviews/hooks/useEditorFlow"
import type { PublicationType } from "@/features/series/services/series.api"
import { ReviewDecisionPanel } from "./ReviewDecisionPanel"
import { RevisionComposer } from "./RevisionComposer"
import { Button } from "@/shared/components/ui/button"

/** Detail pane for the Editor master-detail review queue. */
export function ReviewDetailPane({ seriesId }: { seriesId: string }) {
  const { data, isLoading, isError } = useEditorSeriesReview(seriesId)
  const actions = useEditorActions(seriesId)
  const [revisionReason, setRevisionReason] = useState("")
  const [feedbackSummary, setFeedbackSummary] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [editorRecommendation, setEditorRecommendation] = useState("")
  const [feasibilityNote, setFeasibilityNote] = useState("")
  const [suggestedPublicationType, setSuggestedPublicationType] = useState<PublicationType>("WEEKLY")
  const [riskNote, setRiskNote] = useState("")

  if (isLoading) return <div className="p-12 text-center font-medium text-muted-foreground">Loading series review...</div>
  if (isError || !data) return <div className="p-12 text-center font-medium text-rose-500">Failed to load series review.</div>

  const busy = actions.requestRevision.isPending || actions.reject.isPending || actions.forwardToBoard.isPending

  return (
    <div className="space-y-6 p-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-sm">
        <div className="relative h-24 w-full bg-gradient-to-r from-violet-900 to-purple-900">
          <div className="absolute left-5 top-4 rounded border border-white/30 bg-white/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">
            {data.series.status.replace(/_/g, " ")}
          </div>
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{data.series.title}</h1>
          <div className="mt-4 grid grid-cols-2 gap-4 border-y border-slate-100 py-4 md:grid-cols-4">
            <Info label="Genre" value={data.series.genres?.join(", ") || "-"} />
            <Info label="Audience" value={data.series.targetAudience || "-"} />
            <Info label="Requested" value={data.series.requestedPublicationType || "-"} />
            <Info label="Manuscript" value={`v${data.manuscript?.version ?? "-"}`} />
          </div>
          <h3 className="mb-2 mt-5 text-sm font-bold text-slate-900">Synopsis</h3>
          <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
            {data.series.synopsis}
          </p>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-card text-violet-500">
              <FileText size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900">{data.manuscript?.file?.originalName ?? "No file attached"}</span>
              <span className="text-xs text-slate-500">Status: {data.manuscript?.status}</span>
            </div>
          </div>
        </div>
      </div>

      <ReviewDecisionPanel title="Request Revision" icon={<RefreshCcw size={16} className="text-amber-500" />} tone="amber">
        <RevisionComposer label="Revision reason" value={revisionReason} onChange={(e) => setRevisionReason(e.target.value)} placeholder="Explain what needs to change..." />
        <RevisionComposer label="Feedback summary" value={feedbackSummary} onChange={(e) => setFeedbackSummary(e.target.value)} placeholder="Summarize feedback for the author..." />
        <Button
          disabled={busy || !revisionReason.trim() || !feedbackSummary.trim()}
          onClick={() => actions.requestRevision.mutate({ revisionReason, feedbackSummary })}
          className="mt-2 w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-600"
        >
          Request Revision
        </Button>
      </ReviewDecisionPanel>

      <ReviewDecisionPanel title="Forward To Board" icon={<Send size={16} className="text-emerald-500" />} tone="emerald">
        <RevisionComposer label="Editor recommendation" value={editorRecommendation} onChange={(e) => setEditorRecommendation(e.target.value)} placeholder="Why should the board approve this?" />
        <RevisionComposer label="Feasibility note" value={feasibilityNote} onChange={(e) => setFeasibilityNote(e.target.value)} placeholder="Notes on production feasibility..." />
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Suggested publication type
          <select
            value={suggestedPublicationType}
            onChange={(event) => setSuggestedPublicationType(event.target.value as PublicationType)}
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-card px-3 text-[13px] font-medium text-slate-900 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-50"
          >
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </label>
        <RevisionComposer label="Risk note" value={riskNote} onChange={(e) => setRiskNote(e.target.value)} optional placeholder="Any potential risks..." />
        <Button
          disabled={busy || !editorRecommendation.trim() || !feasibilityNote.trim()}
          onClick={() => actions.forwardToBoard.mutate({ editorRecommendation, feasibilityNote, suggestedPublicationType, riskNote: riskNote || undefined })}
          className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600"
        >
          Forward To Board
        </Button>
      </ReviewDecisionPanel>

      <ReviewDecisionPanel title="Reject Series" icon={<XCircle size={16} className="text-rose-500" />} tone="red">
        <RevisionComposer label="Reject reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." />
        <Button
          disabled={busy || !rejectReason.trim()}
          onClick={() => actions.reject.mutate({ rejectReason })}
          variant="outline"
          className="mt-2 w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        >
          Reject Series
        </Button>
      </ReviewDecisionPanel>

      <div className="pt-2 text-center">
        <Link to={`/app/mangaka/series/${data.series.id}`} className="text-xs font-bold text-slate-500 underline underline-offset-2 transition-colors hover:text-violet-600">
          Open full series view
        </Link>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="truncate text-sm font-bold text-slate-900">{value}</span>
    </div>
  )
}
