import { useState } from 'react'
import { ProposalOverviewTab } from '@/features/series/components/series-detail/ProposalOverviewTab'
import { ProductionOverviewTab } from '@/features/series/components/series-detail/ProductionOverviewTab'
import { ManuscriptTab } from '@/features/series/components/series-detail/ManuscriptTab'
import { ChaptersTab } from '@/features/series/components/series-detail/ChaptersTab'
import { PagesTab } from '@/features/series/components/series-detail/PagesTab'
import { useParams } from 'react-router-dom'
import { useSeriesSummary } from '@/features/series/hooks/useSeries'
import { useQuery } from '@tanstack/react-query'
import { chapterApi } from '@/features/chapters/services/chapter.api'
import { PageHeader } from '@/shared/components/ui/page-header'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { seriesStatusUi } from '@/shared/lib/status-ui'
import { Edit, Send } from 'lucide-react'

type SeriesPhase = 'proposal' | 'production'
type MainTab = 'overview' | 'manuscript' | 'chapters' | 'pages' | 'team' | 'reviews' | 'settings'

export default function SeriesDetailPage() {
  const { id } = useParams()
  const { data: summary, isLoading, isError } = useSeriesSummary(id)
  const { data: chapters = [] } = useQuery({
    queryKey: ['series', id, 'chapters'],
    queryFn: async () => {
      if (!id) throw new Error('No series ID')
      const { data } = await chapterApi.listBySeries(id)
      return data.data
    },
    enabled: !!id,
  })
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('overview')

  if (isLoading) {
    return <div className="flex h-[calc(100vh-64px)] items-center justify-center text-gray-500">Loading series detail...</div>
  }

  if (isError || !summary || !id) {
    return <div className="flex h-[calc(100vh-64px)] items-center justify-center text-red-500">Failed to load series detail</div>
  }

  const productionStatuses = ['APPROVED', 'ONGOING', 'AT_RISK', 'COMPLETED', 'IN PRODUCTION']
  const seriesPhase: SeriesPhase = productionStatuses.includes(summary.series.status.toUpperCase()) ? 'production' : 'proposal'

  const getStatusConfig = (status: string) => {
    const s = status.toUpperCase().replace(' ', '_')
    if (seriesStatusUi[s]) return seriesStatusUi[s]
    if (s === 'IN_PRODUCTION') return seriesStatusUi['ONGOING']
    return seriesStatusUi['DRAFT']
  }

  const statusConfig = getStatusConfig(summary.series.status)

  return (
    <div className="flex flex-col h-full bg-white w-full max-w-[1400px] mx-auto pb-10">
      <div className="pt-6 pb-2">
        <PageHeader
          title={summary.series.title}
          description={`Series • Last updated ${new Date(summary.series.updatedAt).toLocaleDateString()}`}
          primaryAction={
            <div className="flex items-center gap-3">
              <StatusBadge config={statusConfig} />
              {seriesPhase === 'proposal' ? (
                <button className="flex items-center gap-2 bg-violet-600 text-white h-9 px-4 rounded-lg text-sm font-semibold shadow-sm hover:bg-violet-700 transition-colors">
                  <Send size={16} /> Submit for Review
                </button>
              ) : (
                <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 h-9 px-4 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors">
                  <Edit size={16} /> Edit Details
                </button>
              )}
            </div>
          }
        />
      </div>

      {/* Horizontal Tabs */}
      <div className="flex items-center gap-8 border-b border-slate-200 mb-6">
        <TabButton label="Overview" active={activeMainTab === 'overview'} onClick={() => setActiveMainTab('overview')} />
        <TabButton label="Manuscript" active={activeMainTab === 'manuscript'} onClick={() => setActiveMainTab('manuscript')} />
        <TabButton label="Chapters" active={activeMainTab === 'chapters'} onClick={() => setActiveMainTab('chapters')} />
        <TabButton label="Pages" active={activeMainTab === 'pages'} onClick={() => setActiveMainTab('pages')} />
        <TabButton label="Team" active={activeMainTab === 'team'} onClick={() => setActiveMainTab('team')} />
        <TabButton label="Reviews" active={activeMainTab === 'reviews'} onClick={() => setActiveMainTab('reviews')} />
        <TabButton label="Settings" active={activeMainTab === 'settings'} onClick={() => setActiveMainTab('settings')} />
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col min-h-[500px]">
        {activeMainTab === 'overview' && (
          seriesPhase === 'proposal' ? <ProposalOverviewTab summary={summary} /> : <ProductionOverviewTab summary={summary} />
        )}
        
        {activeMainTab === 'manuscript' && <ManuscriptTab summary={summary} />}
        
        {activeMainTab === 'chapters' && <ChaptersTab chapters={chapters} />}
        
        {activeMainTab === 'pages' && <PagesTab seriesId={id} chapters={chapters} />}

        {['team', 'reviews', 'settings'].includes(activeMainTab) && (
          <div className="flex items-center justify-center h-full text-slate-400">
            {activeMainTab.charAt(0).toUpperCase() + activeMainTab.slice(1)} configuration (Coming soon)
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({ label, badge, active, onClick }: { label: string, badge?: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`font-bold text-[14px] border-b-2 pb-3 mb-[-1px] flex items-center gap-2 transition-colors ${active ? 'text-violet-600 border-violet-600' : 'text-slate-500 hover:text-slate-800 border-transparent'}`}
    >
      {label}
      {badge && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
          {badge}
        </span>
      )}
    </button>
  )
}
