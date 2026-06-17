import { ChevronRight, ArrowLeft, Settings, ChevronDown } from 'lucide-react'
import type { Page } from '@/features/chapters/services/chapter.api'

interface PageStudioHeaderProps {
  onBack: () => void
  chapterId: string
  page: Page
  title: string
}

export function PageStudioHeader({ onBack, chapterId, page, title }: PageStudioHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[12px] font-bold text-gray-500">
          <button type="button" className="hover:text-slate-900 cursor-pointer transition-colors" onClick={onBack}>Production Hub</button>
          <ChevronRight size={14} className="text-slate-400" />
          <button type="button" className="hover:text-slate-900 cursor-pointer transition-colors" onClick={onBack}>Chapter {chapterId}</button>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="text-slate-900">Page {page.pageNumber}</span>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 ml-2">{page.status}</span>
        </div>
        <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight">{title}</h1>
        <span className="text-[12px] font-medium text-gray-500">Annotate regions, review AI suggestions, and prepare task assignment.</span>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-lg text-[13px] transition-colors shadow-sm">
          <ArrowLeft size={16} /> Back to Chapter
        </button>
        <button type="button" className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-[13px] transition-colors shadow-sm">
          <Settings size={16} /> Page Settings
        </button>
        <button type="button" className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[13px] transition-colors shadow-sm">
          Upload New Version <ChevronDown size={14} />
        </button>
      </div>
    </div>
  )
}
