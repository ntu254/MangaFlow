import { useState } from "react"
import type { ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Send, XCircle, RefreshCcw, FileText, Download } from "lucide-react"
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

  if (isLoading) return <div className="p-12 text-center text-gray-500 font-medium">Loading series review...</div>
  if (isError || !data) return <div className="p-12 text-center text-red-500 font-medium">Failed to load series review.</div>

  const busy = actions.requestRevision.isPending || actions.reject.isPending || actions.forwardToBoard.isPending

  return (
    <div className="max-w-[1400px] w-full mx-auto pb-10 space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft size={16} /> Back to Queue
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Main Content Area - 70% */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Series Overview Header */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
            <div className="h-32 bg-gradient-to-r from-indigo-900 to-purple-900 w-full relative">
               <div className="absolute top-4 left-6 px-2.5 py-1 bg-white/20 backdrop-blur border border-white/30 text-white rounded text-[11px] font-bold tracking-wider uppercase">
                 {data.series.status.replace(/_/g, ' ')}
               </div>
            </div>
            <div className="p-8 pt-0">
              <div className="flex justify-between items-start">
                <div className="flex flex-col mt-[-32px] relative z-10">
                  <div className="w-24 h-32 bg-white rounded-xl shadow-md border-4 border-white overflow-hidden mb-4">
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">COVER</div>
                  </div>
                  <h1 className="text-[28px] font-extrabold tracking-tight text-gray-900">{data.series.title}</h1>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-6 py-4 border-y border-gray-100">
                <Info label="Genre" value={data.series.genres?.join(", ") || "-"} />
                <Info label="Target Audience" value={data.series.targetAudience || "-"} />
                <Info label="Requested Type" value={data.series.requestedPublicationType || "-"} />
                <Info label="Author" value="Unknown" />
              </div>

              <div className="mt-6">
                <h3 className="text-[14px] font-bold text-gray-900 mb-2">Synopsis</h3>
                <p className="text-[14px] leading-relaxed text-gray-600 bg-gray-50 p-5 rounded-xl border border-gray-100">{data.series.synopsis}</p>
              </div>
            </div>
          </div>

          {/* Manuscript Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" /> Latest Manuscript 
                <span className="text-[12px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded ml-2">v{data.manuscript.version}</span>
              </h2>
              <button className="flex items-center gap-2 text-[12px] font-bold text-gray-600 hover:text-indigo-600 transition-colors border border-gray-200 hover:border-indigo-200 rounded-lg px-3 py-1.5 shadow-sm">
                <Download size={14} /> Download PDF
              </button>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
              <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-indigo-500 shadow-sm">
                <FileText size={24} />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[14px] font-bold text-gray-900">{data.manuscript.file?.originalName ?? "No file attached"}</span>
                <span className="text-[12px] text-gray-500">Submitted status: {data.manuscript.status}</span>
              </div>
            </div>
          </div>
          
        </div>

        {/* Sidebar Actions - 30% */}
        <div className="xl:col-span-4 space-y-6">
          <ActionPanel title="Request Revision" icon={<RefreshCcw size={16} className="text-amber-500"/>} borderColor="border-amber-200" bgColor="bg-amber-50/50">
            <TextArea label="Revision reason" value={revisionReason} onChange={setRevisionReason} placeholder="Explain what needs to change..." />
            <TextArea label="Feedback summary" value={feedbackSummary} onChange={setFeedbackSummary} placeholder="Summarize feedback for the author..." />
            <button
              disabled={busy || !revisionReason.trim() || !feedbackSummary.trim()}
              onClick={() => actions.requestRevision.mutate({ revisionReason, feedbackSummary })}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 text-[13px] font-bold text-white hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:hover:bg-amber-600 shadow-sm"
            >
              Request Revision
            </button>
          </ActionPanel>

          <ActionPanel title="Forward To Board" icon={<Send size={16} className="text-emerald-500"/>} borderColor="border-emerald-200" bgColor="bg-emerald-50/50">
            <TextArea label="Editor recommendation" value={editorRecommendation} onChange={setEditorRecommendation} placeholder="Why should the board approve this?" />
            <TextArea label="Feasibility note" value={feasibilityNote} onChange={setFeasibilityNote} placeholder="Notes on production feasibility..." />
            <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">
              Suggested publication type
              <select
                value={suggestedPublicationType}
                onChange={(event) => setSuggestedPublicationType(event.target.value as PublicationType)}
                className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] font-medium text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all shadow-sm"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </label>
            <TextArea label="Risk note" value={riskNote} onChange={setRiskNote} optional placeholder="Any potential risks..." />
            <button
              disabled={busy || !editorRecommendation.trim() || !feasibilityNote.trim()}
              onClick={() => actions.forwardToBoard.mutate({ editorRecommendation, feasibilityNote, suggestedPublicationType, riskNote: riskNote || undefined })}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[13px] font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:hover:bg-emerald-600 shadow-sm"
            >
              Forward To Board
            </button>
          </ActionPanel>

          <ActionPanel title="Reject Series" icon={<XCircle size={16} className="text-rose-500"/>} borderColor="border-rose-200" bgColor="bg-rose-50/50">
            <TextArea label="Reject reason" value={rejectReason} onChange={setRejectReason} placeholder="Reason for rejection..." />
            <button
              disabled={busy || !rejectReason.trim()}
              onClick={() => actions.reject.mutate({ rejectReason })}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white border border-rose-200 text-[13px] font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors disabled:opacity-50 shadow-sm"
            >
              Reject Series
            </button>
          </ActionPanel>
          
          <div className="pt-2 text-center">
             <Link to={`/app/mangaka/series/${data.series.id}`} className="text-[12px] font-bold text-gray-500 hover:text-indigo-600 transition-colors underline underline-offset-2">
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
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-[14px] font-bold text-gray-900">{value}</span>
    </div>
  )
}

function ActionPanel({ title, icon, borderColor, bgColor, children }: { title: string; icon: ReactNode, borderColor: string, bgColor: string, children: ReactNode }) {
  return (
    <div className={`space-y-4 rounded-2xl border ${borderColor} ${bgColor} p-5 shadow-sm`}>
      <h2 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
        {icon} {title}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

function TextArea({ label, value, onChange, optional = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; optional?: boolean; placeholder?: string }) {
  return (
    <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">
      {label} {optional && <span className="font-medium normal-case text-gray-400 ml-1">(optional)</span>}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 min-h-[80px] w-full resize-y rounded-xl border border-gray-200 bg-white p-3 text-[13px] font-medium normal-case text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all shadow-sm"
      />
    </label>
  )
}
