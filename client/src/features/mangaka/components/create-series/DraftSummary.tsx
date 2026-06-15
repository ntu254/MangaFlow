import { Image as ImageIcon } from 'lucide-react'
import type { CreateSeriesFormData } from './types'

interface DraftSummaryProps {
  formData?: CreateSeriesFormData
  editable?: boolean
  title?: string
}

export function DraftSummary({ formData, title = "Draft Summary" }: DraftSummaryProps) {
  const seriesTitle = formData?.title?.trim() || 'Untitled Series'
  const genre = formData?.genre?.trim() || '-'
  const audience = formData?.audience?.trim() || '-'
  const publication = formData?.publicationType?.trim() || '-'
  const tags = formData?.tags ?? []
  const synopsis = formData?.synopsis?.trim() || 'No synopsis yet.'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-indigo-700">{title}</h3>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="w-[120px] h-[160px] rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <ImageIcon size={24} />
            <span className="text-[10px] font-medium">No Cover</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Title</span>
            <span className="text-[13px] font-bold text-slate-900 leading-snug truncate">{seriesTitle}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Genre</span>
            <span className="text-[12px] font-semibold text-slate-700">{genre}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Audience</span>
            <span className="text-[12px] font-semibold text-slate-700">{audience}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Proposed Publication</span>
            <span className="text-[12px] font-semibold text-slate-900">{publication}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col mb-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase mb-2">Tags</span>
        <div className="flex flex-wrap gap-1.5">
          {tags.length > 0 ? (
            tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded border border-slate-200 text-[10px] font-semibold text-slate-600 bg-white">
                {tag}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-slate-400 italic">No tags yet</span>
          )}
        </div>
      </div>

      <div className="flex flex-col pt-4 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Synopsis</span>
        <p className="text-[12px] text-slate-600 leading-relaxed line-clamp-4">{synopsis}</p>
      </div>
    </div>
  )
}
