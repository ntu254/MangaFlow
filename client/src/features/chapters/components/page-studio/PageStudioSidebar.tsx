import { Search, Filter, MoreVertical, Check } from 'lucide-react'
import type { AIResult, Page, Region } from '@/features/chapters/services/chapter.api'

interface PageStudioSidebarProps {
  leftTab: 'pages' | 'layers'
  setLeftTab: (tab: 'pages' | 'layers') => void
  pages: Page[]
  regions: Region[]
  aiResults: AIResult[]
  selectedPageId?: string
  onSelectPage: (pageId: string) => void
}

export function PageStudioSidebar({ leftTab, setLeftTab, pages, regions, aiResults, selectedPageId, onSelectPage }: PageStudioSidebarProps) {
  return (
    <div className="w-56 flex flex-col border-r border-gray-200 shrink-0 bg-white">
      <div className="flex items-center border-b border-gray-200">
        <button type="button" onClick={() => setLeftTab('pages')} className={`flex-1 py-3 text-[13px] font-bold border-b-2 transition-colors ${leftTab === 'pages' ? 'text-purple-600 border-purple-600' : 'text-gray-500 border-transparent hover:text-gray-900'}`}>
          Pages
        </button>
        <button type="button" onClick={() => setLeftTab('layers')} className={`flex-1 py-3 text-[13px] font-bold border-b-2 transition-colors ${leftTab === 'layers' ? 'text-purple-600 border-purple-600' : 'text-gray-500 border-transparent hover:text-gray-900'}`}>
          Layers
        </button>
      </div>

      {leftTab === 'pages' ? (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex flex-col p-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-extrabold text-gray-900">Pages in Chapter ({pages.length})</span>
              <button type="button" aria-label="More options" className="text-gray-400 hover:text-gray-900"><MoreVertical size={14} /></button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                <input type="text" placeholder="Jump to page..." className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-gray-900 outline-none focus:border-purple-500 bg-gray-50 focus:bg-white shadow-sm transition-all" />
              </div>
              <button type="button" aria-label="Filter Pages" className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm bg-white" title="Filter Pages">
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4 overflow-y-auto">
            {pages.map((page) => (
              <PageListItem
                key={page.id}
                page={page}
                active={page.id === selectedPageId}
                onClick={() => onSelectPage(page.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-y-auto p-4">
          <span className="text-[12px] font-extrabold text-gray-900 mb-4 block">Layers</span>
          <div className="flex flex-col gap-3">
            <LayerToggle label="Regions" count={regions.length} active />
            <LayerToggle label="AI Results" count={aiResults.length} active />
            <LayerToggle label="Accepted Suggestions" count={aiResults.flatMap((r) => r.suggestions).filter((s) => s.decision === 'ACCEPTED').length} active />
            <LayerToggle label="Pending Suggestions" count={aiResults.flatMap((r) => r.suggestions).filter((s) => s.decision === 'PENDING').length} active />
          </div>
          <button type="button" className="w-full mt-6 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-lg text-[12px] transition-colors">
            Hide All
          </button>
        </div>
      )}
    </div>
  )
}

function PageListItem({ page, active, onClick }: { page: Page; active?: boolean; onClick: () => void }) {
  const colors: Record<string, string> = {
    APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    IN_PROGRESS: 'bg-purple-50 text-purple-600 border-purple-100',
    UNDER_REVIEW: 'bg-amber-50 text-amber-600 border-amber-100',
    UPLOADED: 'bg-blue-50 text-blue-600 border-blue-100',
    READY_FOR_REGION: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    PROCESSING_FAILED: 'bg-rose-50 text-rose-600 border-rose-100',
  }

  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border text-left ${active ? 'border-purple-300 bg-purple-100 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}>
      <div className="w-12 h-16 bg-gray-100 rounded border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-gray-400">
        Pg
      </div>
      <div className="flex flex-col flex-1 gap-1.5">
        <span className={`text-[13px] font-extrabold ${active ? 'text-purple-900' : 'text-gray-900'}`}>Page {page.pageNumber}</span>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border w-fit ${colors[page.status] ?? 'bg-gray-50 text-gray-500 border-gray-100'}`}>
          {page.status}
        </span>
      </div>
      {active && <MoreVertical size={14} className="text-gray-400 mr-1" />}
    </button>
  )
}

function LayerToggle({ label, count, active }: { label: string; count?: number; active?: boolean }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${active ? 'bg-purple-600 border-purple-600' : 'border-gray-300 bg-white'}`}>
          {active && <Check size={12} className="text-white" strokeWidth={3} />}
        </div>
        <span className="text-[13px] font-bold text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
      </div>
      {count !== undefined && <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center text-[10px] font-bold">{count}</span>}
    </label>
  )
}
