import { UploadCloud, MessageSquare, Clock, FileText, Send, Users, File, CheckCircle2 } from 'lucide-react'
import { ManuscriptVersions } from '@/features/series/components/series-detail/proposal/ManuscriptVersions'
import { ReviewProgress } from '@/features/series/components/series-detail/proposal/ReviewProgress'
import type { SeriesSummary } from '@/features/series/services/series.api'

export function ProposalOverviewTab({ summary }: { summary: SeriesSummary }) {
  const manuscript = summary.currentManuscript
  const manuscriptFile = manuscript?.file
  const editor = summary.members.find((member) => member.role === 'EDITOR' || member.user?.role === 'EDITOR')?.user
  const lastUpdate = formatDateTime(summary.series.updatedAt)
  const statusLabel = labelize(summary.series.status)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col h-full hover:shadow-md transition-shadow">
          <h3 className="text-[15px] font-bold text-gray-900 mb-2">Review Status</h3>
          <p className="text-[13px] text-gray-600 mb-4 font-medium leading-relaxed">{summary.commentSummary.blocking > 0 ? 'Blocking comments need your attention.' : 'The editor is reviewing your manuscript.'}</p>
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 mb-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
              <FileText size={16} className="text-purple-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-gray-900">{statusLabel}</span>
            </div>
            <span className="ml-auto text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">{labelize(manuscript?.status ?? summary.series.status)}</span>
          </div>
          <div className="flex flex-col gap-3 mb-4 mt-auto">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">Estimated Review Time</span>
              <span className="text-[13px] font-medium text-gray-900">{formatDate(summary.series.createdAt)} - {formatDate(summary.series.updatedAt)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">Last Update</span>
              <span className="text-[13px] font-medium text-gray-900">{lastUpdate}</span>
            </div>
          </div>
          <button className="w-full bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-[12px] transition-colors shadow-sm mt-auto">
            <MessageSquare size={14} /> View Editor Feedback ({summary.commentSummary.open})
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col h-full hover:shadow-md transition-shadow">
          <h3 className="text-[15px] font-bold text-gray-900 mb-6">Submission Summary</h3>
          <div className="bg-white border border-emerald-200 shadow-sm rounded-xl p-4 mb-6 flex gap-3 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
            <div className="bg-emerald-50 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[13px] font-bold text-gray-900 leading-tight">Proposal Manuscript v{manuscript?.version ?? '-'}</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">Current</span>
              </div>
              <span className="text-[11px] font-medium text-gray-500">Submitted {formatDate(manuscript?.createdAt ?? summary.series.createdAt)}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-auto">
            <Stat label="Files" value={manuscriptFile ? 1 : 0} />
            <Stat label="Pages" value={summary.chapterSummary.totalPages} />
            <Stat label="Total Size" value={formatBytes(manuscriptFile?.size ?? 0)} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col h-full hover:shadow-md transition-shadow">
          <h3 className="text-[15px] font-bold text-gray-900 mb-6">What Happens Next?</h3>
          <div className="flex flex-col gap-5 relative before:content-[''] before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-100">
            <NextStepItem icon={<Clock size={12} className="text-purple-600" />} bgClass="bg-purple-100 border-purple-200" title="Editor Review" desc={summary.commentSummary.open > 0 ? 'Feedback available' : 'In progress'} active />
            <NextStepItem icon={<MessageSquare size={12} className="text-orange-500" />} bgClass="bg-orange-50 border-orange-100" title="Editor Feedback" desc="You'll receive comments or revision requests." />
            <NextStepItem icon={<Users size={12} className="text-blue-500" />} bgClass="bg-blue-50 border-blue-100" title="Board Review" desc="If approved by editor, it will be sent to the Editorial Board." />
            <NextStepItem icon={<CheckCircle2 size={12} className="text-emerald-500" />} bgClass="bg-emerald-50 border-emerald-100" title="Final Decision" desc="You'll be notified of the board's decision." />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col h-full hover:shadow-md transition-shadow">
          <h3 className="text-[15px] font-bold text-gray-900 mb-6">Action You Can Take</h3>
          <div className="flex flex-col gap-4">
            <ActionItem icon={<UploadCloud size={16} />} title="Upload Revision" desc="If you want to make changes based on the editor's feedback." color="blue" />
            <ActionItem icon={<File size={16} />} title="View Submission" desc="Review the files and details you submitted." color="purple" />
            <ActionItem icon={<MessageSquare size={16} />} title="Ask Editor (Optional)" desc="Send a message to the editor if you have questions." color="emerald" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        <div className="lg:col-span-5">
          <ManuscriptVersions summary={summary} />
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
          <h3 className="text-[15px] font-bold text-gray-900 mb-6">Review Timeline</h3>
          <ReviewProgress status={summary.series.status} />
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
          <h3 className="text-[15px] font-bold text-gray-900 mb-6">Editor Information</h3>
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-100 border-2 border-white shadow-sm shrink-0 flex items-center justify-center">
              <span className="text-indigo-700 font-bold text-[18px]">{(editor?.name ?? 'E').charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-gray-900">{editor?.name ?? 'Unassigned Editor'}</span>
                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Editor</span>
              </div>
              <span className="text-[12px] font-medium text-gray-500">Tantou Editor</span>
              <span className="text-[12px] text-gray-400 font-medium">{editor?.email ?? 'No editor assigned yet'}</span>
            </div>
          </div>

          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">Average Response Time</span>
              <span className="text-[15px] font-extrabold text-gray-900">{summary.commentSummary.open > 0 ? 'Pending' : 'Clear'}</span>
              <span className="text-[11px] text-gray-400 font-medium">Based on current comments</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">Current Workload</span>
              <span className="text-[15px] font-extrabold text-gray-900">{summary.taskSummary.pending}</span>
              <span className="text-[11px] text-gray-400 font-medium">Pending tasks</span>
            </div>
          </div>

          <button className="w-full bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-[13px] transition-colors shadow-sm mt-auto">
            <Send size={14} /> Send Message
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-3">
      <span className="text-[11px] font-bold text-gray-500 mb-1">{label}</span>
      <span className="text-[15px] font-extrabold text-gray-900">{value}</span>
    </div>
  )
}

function NextStepItem({ icon, title, desc, active, bgClass }: any) {
  return (
    <div className="flex gap-3 relative z-10">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center border shrink-0 mt-0.5 ${bgClass}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className={`text-[13px] font-bold ${active ? 'text-gray-900' : 'text-gray-700'}`}>{title}</span>
        <span className="text-[12px] font-medium text-gray-500 leading-tight mt-0.5">{desc}</span>
      </div>
    </div>
  )
}

function ActionItem({ icon, title, desc, color }: any) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-500 bg-blue-50 border-blue-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
    emerald: 'text-emerald-500 bg-emerald-50 border-emerald-100',
  }

  return (
    <div className="flex gap-3 items-start p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[13px] font-bold text-gray-900">{title}</span>
        <span className="text-[11px] font-medium text-gray-500 leading-snug mt-1">{desc}</span>
      </div>
    </div>
  )
}

function labelize(value: string) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 MB'
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
