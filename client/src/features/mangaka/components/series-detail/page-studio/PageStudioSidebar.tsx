import { Search, Filter, MoreVertical, Check } from 'lucide-react'

const PAGE_IMAGE = "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80&fit=crop"

interface PageWorkspaceSidebarProps {
  leftTab: 'pages' | 'layers';
  setLeftTab: (tab: 'pages' | 'layers') => void;
}

export function PageWorkspaceSidebar({ leftTab, setLeftTab }: PageWorkspaceSidebarProps) {
  return (
    <div className="w-56 flex flex-col border-r border-gray-200 shrink-0 bg-white">
      <div className="flex items-center border-b border-gray-200">
        <button 
          type="button"
          onClick={() => setLeftTab('pages')}
          className={`flex-1 py-3 text-[13px] font-bold border-b-2 transition-colors ${leftTab === 'pages' ? 'text-purple-600 border-purple-600' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
        >
          Pages
        </button>
        <button 
          type="button"
          onClick={() => setLeftTab('layers')}
          className={`flex-1 py-3 text-[13px] font-bold border-b-2 transition-colors ${leftTab === 'layers' ? 'text-purple-600 border-purple-600' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
        >
          Layers
        </button>
      </div>

      {leftTab === 'pages' ? (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex flex-col p-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-extrabold text-gray-900">Pages in Chapter 12 (48)</span>
              <button type="button" aria-label="More options" className="text-gray-400 hover:text-gray-900"><MoreVertical size={14} /></button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Jump to page..." 
                  className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-gray-900 outline-none focus:border-purple-500 bg-gray-50 focus:bg-white shadow-sm transition-all"
                />
              </div>
              <button type="button" aria-label="Filter Pages" className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm bg-white" title="Filter Pages">
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 p-4 overflow-y-auto">
            <PageListItem num={6} status="Approved" />
            <PageListItem num={7} status="Approved" />
            <PageListItem num={8} status="In Progress" active />
            <PageListItem num={9} status="In Progress" />
            <PageListItem num={10} status="Pending Review" />
            <PageListItem num={11} status="Not Started" />
            <PageListItem num={12} status="Not Started" />
            <PageListItem num={13} status="Not Started" />
            <PageListItem num={14} status="Not Started" />
            <PageListItem num={15} status="Not Started" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-y-auto p-4">
          <span className="text-[12px] font-extrabold text-gray-900 mb-4 block">Layers</span>
          <div className="flex flex-col gap-3">
            <LayerToggle label="Regions" count={7} active />
            <LayerToggle label="Comments" count={3} active />
            <LayerToggle label="Submissions" count={2} active />
            <LayerToggle label="AI Results" badge="Layer" />
          </div>
          <button type="button" className="w-full mt-6 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-lg text-[12px] transition-colors">
            Hide All
          </button>
        </div>
      )}
    </div>
  )
}

function PageListItem({ num, status, active }: any) {
  const colors: any = {
    'Approved': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'In Progress': 'bg-purple-50 text-purple-600 border-purple-100',
    'Pending Review': 'bg-orange-50 text-orange-600 border-orange-100',
    'Not Started': 'bg-gray-50 text-gray-500 border-gray-100',
  }

  return (
    <div className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${active ? 'border-purple-300 bg-purple-100 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}>
      <div className="w-12 h-16 bg-gray-100 rounded border border-gray-200 overflow-hidden shrink-0">
        <img src={PAGE_IMAGE} alt="" className="w-full h-full object-cover grayscale opacity-50" />
      </div>
      <div className="flex flex-col flex-1 gap-1.5">
        <span className={`text-[13px] font-extrabold ${active ? 'text-purple-900' : 'text-gray-900'}`}>Page {num}</span>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border w-fit ${colors[status]}`}>
          {status}
        </span>
      </div>
      {active && (
        <button type="button" aria-label="More options" className="text-gray-400 hover:text-gray-900 mr-1"><MoreVertical size={14} /></button>
      )}
    </div>
  )
}

function LayerToggle({ label, count, badge, active }: any) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${active ? 'bg-purple-600 border-purple-600' : 'border-gray-300 bg-white'}`}>
          {active && <Check size={12} className="text-white" strokeWidth={3} />}
        </div>
        <span className="text-[13px] font-bold text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
      </div>
      {count !== undefined && <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center text-[10px] font-bold">{count}</span>}
      {badge && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{badge}</span>}
    </label>
  )
}
