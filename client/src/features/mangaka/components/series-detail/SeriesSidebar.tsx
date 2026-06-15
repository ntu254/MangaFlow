import { useState } from 'react'
import { LayoutTemplate, Lock, BarChart3, CreditCard, PenTool, PanelLeftClose, PanelLeftOpen, Users2Icon } from 'lucide-react'
import coverMock from '@/assets/image-mangaka.webp'
import type { SeriesSummary } from '@/api/series'

interface SeriesSidebarProps {
  summary: SeriesSummary
  seriesPhase?: 'proposal' | 'production'
  activeTab: string
  onChangeTab: (tab: string) => void
}

export function SeriesSidebar({ summary, seriesPhase = 'production', activeTab, onChangeTab }: SeriesSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isProposal = seriesPhase === 'proposal';

  return (
    <div className={`shrink-0 flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300 relative ${isCollapsed ? 'w-[80px]' : 'w-[230px]'}`}>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 bottom-8 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-purple-600 shadow-sm z-10 transition-colors"
      >
        {isCollapsed ? <PanelLeftOpen size={12} /> : <PanelLeftClose size={12} />}
      </button>

      {/* Series Info */}
      <div className={`px-6 py-4 flex flex-col gap-3 mt-4 ${isCollapsed ? 'items-center px-2' : ''}`}>
        <div className={`rounded-xl overflow-hidden shadow-sm border border-gray-100 mb-2 transition-all ${isCollapsed ? 'w-10 h-10 rounded-lg' : 'w-[120px] h-[160px]'}`}>
          <img src={coverMock} alt={summary.series.title} className="w-full h-full object-cover" />
        </div>

        {!isCollapsed && (
          <>
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-extrabold text-gray-900 tracking-tight leading-tight">{summary.series.title}</h2>
              <button className="text-gray-400 hover:text-purple-600 transition-colors shrink-0">
                <PenTool size={14} />
              </button>
            </div>

            <span className="text-[12px] font-medium text-gray-500">{summary.series.genres.join(', ') || 'No genres'}</span>

            {isProposal ? (
              <div className="inline-flex items-center justify-center bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-fit mt-1">
                {summary.series.status.split('_').join(' ')}
              </div>
            ) : (
              <div className="inline-flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-fit mt-1">
                PRODUCTION: {summary.series.status.split('_').join(' ')}
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <div className={`flex-1 flex flex-col py-4 gap-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3'}`}>
        <NavItem icon={<LayoutTemplate size={16} />} label="Overview" active={activeTab === 'overview'} onClick={() => onChangeTab('overview')} isCollapsed={isCollapsed} />

        <div className="h-px bg-gray-100 my-2 mx-3"></div>

        <NavItem icon={<Lock size={16} />} label="Workspace" active={activeTab === 'workspace'} onClick={() => onChangeTab('workspace')} locked={!summary.allowedActions.canOpenWorkspace} isCollapsed={isCollapsed} />
        <NavItem icon={<BarChart3 size={16} />} label="Ranking" active={activeTab === 'ranking'} onClick={() => onChangeTab('ranking')} locked={isProposal} isCollapsed={isCollapsed} />
        <NavItem icon={<CreditCard size={16} />} label="Payroll" active={activeTab === 'payroll'} onClick={() => onChangeTab('payroll')} locked={isProposal} isCollapsed={isCollapsed} />

        <div className="h-px bg-gray-100 my-2 mx-3"></div>

        <NavItem icon={<Users2Icon size={16} />} label="Team" active={activeTab === 'Team'} onClick={() => onChangeTab('history')} badge={String(summary.members.length)} isCollapsed={isCollapsed} />
      </div>

    </div>
  )
}

function NavItem({ icon, label, active, badge, locked, isCollapsed, onClick }: { icon: React.ReactNode, label: string, active?: boolean, badge?: string, locked?: boolean, isCollapsed?: boolean, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      title={isCollapsed ? label : undefined}
      className={`
        flex items-center gap-3 py-3 rounded-xl text-[13px] font-bold transition-all w-full
        ${isCollapsed ? 'justify-center px-0' : 'px-4 text-left'}
        ${locked ? 'opacity-50 cursor-not-allowed text-gray-400' : ''}
        ${active ? 'bg-purple-100 text-purple-700' : (!locked && 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}
      `}
    >
      <div className={`${active ? 'text-purple-600' : 'text-gray-400'}`}>{icon}</div>
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge && (
            <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">
              {badge}
            </div>
          )}
          {locked && (
            <div className="text-gray-300 shrink-0">
              {/* Note: The lock icon could go here if we want to explicitly show it's locked, but we omit it to match design if not active. Let's just keep it simple. */}
            </div>
          )}
        </>
      )}
    </button>
  )
}
