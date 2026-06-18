import { FileText, Eye, User } from 'lucide-react'
import type { SeriesSummary } from '@/features/series/services/series.api'

export function ManuscriptVersions({ summary }: { summary: SeriesSummary }) {
  const manuscript = summary.currentManuscript
  const file = manuscript?.file

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col w-full shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-sm font-bold text-gray-900">Manuscript Versions</h2>
        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[11px] font-bold">Blocking Comments: {summary.commentSummary.blocking}</span>
      </div>

      <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
            <FileText size={20} />
          </div>
          
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[14px] font-bold text-gray-900">Proposal v{manuscript?.version ?? '-'}</span>
              <span className="bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                {labelize(manuscript?.status ?? summary.series.status)}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-[12px] text-gray-500">
              <span className="flex items-center gap-1.5"><FileText size={12} /> {summary.chapterSummary.totalPages || '-'} pages</span>
              <span className="flex items-center gap-1.5">{formatBytes(file?.size ?? 0)}</span>
              <span className="flex items-center gap-1.5"><User size={12} /> Submitted by {manuscript?.uploadedBy?.name ?? summary.owner?.name ?? 'Unknown'}</span>
              <span>{formatDate(manuscript?.createdAt ?? summary.series.updatedAt)}</span>
            </div>
          </div>
        </div>

        <button className="w-full h-9 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors border border-purple-100">
          <Eye size={14} />
          <span className="text-[13px]">Preview Manuscript</span>
        </button>
      </div>

      <div className="mt-4 flex justify-center">
        <button className="text-[13px] font-bold text-purple-600 hover:text-purple-700">
          View version history
        </button>
      </div>
    </div>
  )
}

function labelize(value: string) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 MB'
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}
