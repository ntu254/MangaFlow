import { useState } from 'react'
import { SeriesSidebar } from '@/features/mangaka/components/series-detail/SeriesSidebar'
import { SeriesMainHeader } from '@/features/mangaka/components/series-detail/SeriesMainHeader'
import { ProposalOverviewTab } from '@/features/mangaka/components/series-detail/ProposalOverviewTab'
import { ProductionOverviewTab } from '@/features/mangaka/components/series-detail/ProductionOverviewTab'
import { ManuscriptTab } from '@/features/mangaka/components/series-detail/ManuscriptTab'
import { PagesTab } from '@/features/mangaka/components/series-detail/PagesTab'
import { FileText, MessageSquare, ShieldAlert, BarChart3 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useSeriesSummary } from '@/hooks/useSeries'
import { useQuery } from '@tanstack/react-query'
import { chapterApi } from '@/api/chapter'

type SeriesPhase = 'proposal' | 'production'
type SubTab = 'overview' | 'manuscript' | 'editor_feedback' | 'board_review'

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
  const [activeMainTab, setActiveMainTab] = useState<string>('overview')
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview')

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading series detail...</div>
  }

  if (isError || !summary || !id) {
    return <div className="flex h-screen items-center justify-center text-red-500">Failed to load series detail</div>
  }

  const productionStatuses = ['APPROVED', 'ONGOING', 'AT_RISK', 'COMPLETED']
  const seriesPhase: SeriesPhase = productionStatuses.includes(summary.series.status) ? 'production' : 'proposal'

  return (
    <div className="flex -m-6 h-[calc(100vh-64px)] bg-white overflow-hidden">
      <SeriesSidebar 
        summary={summary}
        seriesPhase={seriesPhase} 
        activeTab={activeMainTab}
        onChangeTab={setActiveMainTab}
      />

      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50/30">
        <div className={`flex flex-col w-full mx-auto flex-1 ${activeMainTab === 'pages' ? '' : 'px-10 py-8 max-w-[1600px]'}`}>
          {/* Main Header (Only for non-pages tabs) */}
          {activeMainTab !== 'pages' && <SeriesMainHeader summary={summary} seriesPhase={seriesPhase} />}
          {activeMainTab === 'overview' && (
            <div className="flex items-center gap-8 border-b border-gray-200 mb-6 mt-4">
              <button 
                onClick={() => setActiveSubTab('overview')}
                className={`font-bold text-[13px] border-b-2 pb-3 flex items-center gap-2 transition-colors ${activeSubTab === 'overview' ? 'text-purple-600 border-purple-600' : 'text-gray-500 hover:text-gray-900 border-transparent'}`}
              >
                <BarChart3 size={16} /> {seriesPhase === 'proposal' ? 'Review Overview' : 'Production Overview'}
              </button>
              <button 
                onClick={() => setActiveSubTab('manuscript')}
                className={`font-bold text-[13px] border-b-2 pb-3 flex items-center gap-2 transition-colors ${activeSubTab === 'manuscript' ? 'text-purple-600 border-purple-600' : 'text-gray-500 hover:text-gray-900 border-transparent'}`}
              >
                <FileText size={16} /> Manuscript
              </button>
              <button 
                onClick={() => setActiveSubTab('editor_feedback')}
                className={`font-bold text-[13px] border-b-2 pb-3 flex items-center gap-2 transition-colors ${activeSubTab === 'editor_feedback' ? 'text-purple-600 border-purple-600' : 'text-gray-500 hover:text-gray-900 border-transparent'}`}
              >
                <MessageSquare size={16} /> Editor Feedback
                <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold ml-1">{summary.commentSummary.open}</div>
              </button>
              <button 
                onClick={() => setActiveSubTab('board_review')}
                className={`font-bold text-[13px] border-b-2 pb-3 flex items-center gap-2 transition-colors ${activeSubTab === 'board_review' ? 'text-purple-600 border-purple-600' : 'text-gray-500 hover:text-gray-900 border-transparent'}`}
              >
                <ShieldAlert size={16} /> Board Review
              </button>
            </div>
          )}

          {activeMainTab === 'overview' && (
            <>
              {activeSubTab === 'overview' && (
                seriesPhase === 'proposal' ? <ProposalOverviewTab summary={summary} /> : <ProductionOverviewTab summary={summary} />
              )}
              {activeSubTab === 'manuscript' && <ManuscriptTab summary={summary} />}
              {activeSubTab === 'editor_feedback' && (
                <div className="space-y-3">
                  {summary.recentComments.map((comment) => (
                    <div key={comment.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-gray-900">{comment.author ?? 'Unknown'} - {comment.authorRole ?? 'Member'}</span>
                        <span className={`text-[11px] font-bold ${comment.isBlocking ? 'text-red-600' : 'text-gray-500'}`}>{labelize(comment.status)}</span>
                      </div>
                      <p className="text-[13px] text-gray-600 mt-2">{comment.body}</p>
                      <span className="text-[11px] text-gray-400 mt-2 block">{formatDate(comment.updatedAt)}</span>
                    </div>
                  ))}
                  {summary.recentComments.length === 0 && <div className="p-8 text-center text-gray-500">No editor feedback yet.</div>}
                </div>
              )}
              {activeSubTab === 'board_review' && (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">
                  {summary.boardReview ? `Board review ${labelize(summary.boardReview.status)} - ${summary.boardReview.voteCount} vote(s)` : 'Board review has not started.'}
                </div>
              )}
            </>
          )}
          
          {activeMainTab === 'pages' && <PagesTab seriesId={id} chapters={chapters} />}
        </div>
      </div>
    </div>
  )
}

function labelize(value: string) {
  return value.split('_').join(' ')
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}
