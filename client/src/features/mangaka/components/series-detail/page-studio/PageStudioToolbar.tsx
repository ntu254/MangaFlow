import type { ReactNode } from 'react'
import { MousePointer2, Square, MessageSquare, Hand, ZoomIn, Sparkles, Undo2, Redo2, ChevronDown, Loader2 } from 'lucide-react'

interface PageWorkspaceToolbarProps {
  onRunAI: () => void
  aiPending: boolean
}

export function PageWorkspaceToolbar({ onRunAI, aiPending }: PageWorkspaceToolbarProps) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
      <div className="flex items-center gap-1 shrink-0">
        <ToolBtn icon={<MousePointer2 size={10} />} label="Select" />
        <div className="w-px h-6 bg-gray-200 mx-1"></div>
        <ToolBtn icon={<Square size={10} />} label="Draw Region" active />
        <ToolBtn icon={<MessageSquare size={10} />} label="Comment" />
        <div className="w-px h-6 bg-gray-200 mx-1"></div>
        <ToolBtn icon={<Hand size={10} />} label="Pan" />
        <ToolBtn icon={<ZoomIn size={10} />} label="Zoom" />

        <div className="flex items-center ml-2 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
          <button type="button" aria-label="Zoom out" className="px-2 py-1 text-gray-500 hover:bg-gray-50 transition-colors">-</button>
          <span className="text-[12px] font-bold text-gray-900 px-3 border-x border-gray-200">100%</span>
          <button type="button" aria-label="Zoom in" className="px-2 py-1 text-gray-500 hover:bg-gray-50 transition-colors">+</button>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        <button
          type="button"
          onClick={onRunAI}
          disabled={aiPending}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-[12px] font-bold hover:bg-purple-100 transition-colors disabled:opacity-60"
        >
          {aiPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI Detect
        </button>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Undo" className="p-1.5 text-gray-400 hover:text-gray-900 rounded transition-colors"><Undo2 size={16} /></button>
          <button type="button" aria-label="Redo" className="p-1.5 text-gray-400 hover:text-gray-900 rounded transition-colors"><Redo2 size={16} /></button>
        </div>
        <div className="flex items-center bg-purple-600 rounded-lg shadow-sm">
          <button type="button" className="px-4 py-1.5 text-white font-bold text-[13px] hover:bg-purple-700 rounded-l-lg transition-colors">Save</button>
          <div className="w-px h-full bg-purple-700"></div>
          <button type="button" aria-label="More save options" className="px-2 py-1.5 text-white hover:bg-purple-700 rounded-r-lg transition-colors"><ChevronDown size={14} /></button>
        </div>
      </div>
    </div>
  )
}

function ToolBtn({ icon, label, active }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <button type="button" className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${active ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
      {icon} {label}
    </button>
  )
}
