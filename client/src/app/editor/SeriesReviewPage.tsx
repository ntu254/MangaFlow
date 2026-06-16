import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Send, XCircle, RefreshCcw, FileText, Download } from "lucide-react"
import { useEditorActions, useEditorSeriesReview } from "@/features/reviews/hooks/useEditorFlow"
import type { PublicationType } from "@/features/series/services/series.api"
import { ReviewDecisionPanel } from "@/features/editor/components/ReviewDecisionPanel"
import { RevisionComposer } from "@/features/editor/components/RevisionComposer"
import { Button } from "@/shared/components/ui/button"

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

  if (isLoading) return <div className="p-12 text-center text-gray-500 font-medium">Loading series review...</div>
  if (isError || !data) return <div className="p-12 text-center text-red-500 font-medium">Failed to load series review.</div>

  const busy = actions.requestRevision.isPending || actions.reject.isPending || actions.forwardToBoard.isPending

  return (
    <div className="max-w-[1400px] w-full mx-auto pb-10 space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft size={16} /> Back to Queue
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Main Content Area - 70% */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Series Overview Header */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
            <div className="h-32 bg-gradient-to-r from-violet-900 to-purple-900 w-full relative">
               <div className="absolute top-4 left-6 px-2.5 py-1 bg-white/20 backdrop-blur border border-white/30 text-white rounded text-[11px] font-bold tracking-wider uppercase">
                 {data.series.status.replace(/_/g, ' ')}
               </div>
            </div>
            <div className="p-8 pt-0">
              <div className="flex justify-between items-start">
                <div className="flex flex-col mt-[-32px] relative z-10">
                  <div className="w-24 h-32 bg-white rounded-xl shadow-md border-4 border-white overflow-hidden mb-4">
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">COVER</div>
                  </div>
                  <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">{data.series.title}</h1>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-6 py-4 border-y border-slate-100">
                <Info label="Genre" value={data.series.genres?.join(", ") || "-"} />
                <Info label="Target Audience" value={data.series.targetAudience || "-"} />
                <Info label="Requested Type" value={data.series.requestedPublicationType || "-"} />
                <Info label="Author" value="Unknown" />
              </div>

              <div className="mt-6">
                <h3 className="text-[14px] font-bold text-slate-900 mb-2">Synopsis</h3>
                <p className="text-[14px] leading-relaxed text-slate-600 bg-slate-50 p-5 rounded-xl border border-slate-100">{data.series.synopsis}</p>
              </div>
            </div>
          </div>

          {/* Manuscript Info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-violet-600" /> Latest Manuscript 
                <span className="text-[12px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded ml-2">v{data.manuscript.version}</span>
              </h2>
              <button className="flex items-center gap-2 text-[12px] font-bold text-slate-600 hover:text-violet-600 transition-colors border border-slate-200 hover:border-violet-200 rounded-lg px-3 py-1.5 shadow-sm">
                <Download size={14} /> Download PDF
              </button>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
              <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-violet-500 shadow-sm">
                <FileText size={24} />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[14px] font-bold text-slate-900">{data.manuscript.file?.originalName ?? "No file attached"}</span>
                <span className="text-[12px] text-slate-500">Submitted status: {data.manuscript.status}</span>
              </div>
            </div>
          </div>
          
        </div>

        {/* Sidebar Actions - 30% */}
        <div className="xl:col-span-4 space-y-6">
          <ReviewDecisionPanel title="Request Revision" icon={<RefreshCcw size={16} className="text-amber-500"/>} tone="amber">
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

          <ReviewDecisionPanel title="Forward To Board" icon={<Send size={16} className="text-emerald-500"/>} tone="emerald">
            <RevisionComposer label="Editor recommendation" value={editorRecommendation} onChange={(e) => setEditorRecommendation(e.target.value)} placeholder="Why should the board approve this?" />
            <RevisionComposer label="Feasibility note" value={feasibilityNote} onChange={(e) => setFeasibilityNote(e.target.value)} placeholder="Notes on production feasibility..." />
            <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              Suggested publication type
              <select
                value={suggestedPublicationType}
                onChange={(event) => setSuggestedPublicationType(event.target.value as PublicationType)}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-50 transition-all shadow-sm"
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

          <ReviewDecisionPanel title="Reject Series" icon={<XCircle size={16} className="text-red-500"/>} tone="red">
            <RevisionComposer label="Reject reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." />
            <Button
              disabled={busy || !rejectReason.trim()}
              onClick={() => actions.reject.mutate({ rejectReason })}
              variant="outline"
              className="mt-2 w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Reject Series
            </Button>
          </ReviewDecisionPanel>
          
          <div className="pt-2 text-center">
             <Link to={`/app/mangaka/series/${data.series.id}`} className="text-[12px] font-bold text-slate-500 hover:text-violet-600 transition-colors underline underline-offset-2">
               Open Mangaka View
             </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-[14px] font-bold text-slate-900">{value}</span>
    </div>
  )
}
