import { Outlet, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Edit, Send } from 'lucide-react'
import { useSeriesSummary } from '@/features/series/hooks/useSeries'
import { chapterApi } from '@/features/chapters/services/chapter.api'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { seriesStatusUi } from '@/shared/lib/status-ui'
import { usePageChrome, type ContextTab } from '@/shared/components/layout/page-chrome'
import type { SeriesSummary } from '@/features/series/services/series.api'

export interface SeriesHubContext {
  id: string
  summary: SeriesSummary
  chapters: any[]
  phase: 'proposal' | 'production'
}

export default function SeriesHubLayout() {
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

  const productionStatuses = ['APPROVED', 'ONGOING', 'AT_RISK', 'COMPLETED', 'IN PRODUCTION']
  const phase: 'proposal' | 'production' =
    summary && productionStatuses.includes(summary.series.status.toUpperCase()) ? 'production' : 'proposal'

  const base = `/app/mangaka/series/${id}`
  const tabs: ContextTab[] = [
    { label: 'Overview', to: `${base}/overview` },
    { label: 'Manuscript', to: `${base}/manuscript` },
    { label: 'Chapters', to: `${base}/chapters`, badge: chapters.length || undefined },
    { label: 'Pages', to: `${base}/pages` },
    { label: 'Team', to: `${base}/team` },
    { label: 'Reviews', to: `${base}/reviews` },
    { label: 'Settings', to: `${base}/settings` },
  ]

  const statusConfig = summary
    ? seriesStatusUi[summary.series.status.toUpperCase().replace(' ', '_')] ?? seriesStatusUi['DRAFT']
    : seriesStatusUi['DRAFT']

  usePageChrome(
    {
      contextHeader: summary
        ? {
            title: summary.series.title,
            breadcrumb: 'Series',
            status: <StatusBadge config={statusConfig} />,
            actions:
              phase === 'proposal' ? (
                <button className="flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700">
                  <Send size={16} /> Submit for Review
                </button>
              ) : (
                <button className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-card px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                  <Edit size={16} /> Edit Details
                </button>
              ),
          }
        : { title: 'Series' },
      tabs: summary ? tabs : undefined,
    },
    [summary?.series.id, summary?.series.status, chapters.length, phase]
  )

  if (isLoading) return <div className="flex h-full items-center justify-center text-muted-foreground">Loading series detail...</div>
  if (isError || !summary || !id) return <div className="flex h-full items-center justify-center text-rose-500">Failed to load series detail</div>

  return (
    <div className="mx-auto w-full max-w-[1400px] pb-10">
      <Outlet context={{ id, summary, chapters, phase } satisfies SeriesHubContext} />
    </div>
  )
}
