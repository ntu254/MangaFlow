import { useOutletContext } from 'react-router-dom'
import type { SeriesHubContext } from './SeriesDetailPage'
import { ProposalOverviewTab } from '@/features/series/components/series-detail/ProposalOverviewTab'
import { ProductionOverviewTab } from '@/features/series/components/series-detail/ProductionOverviewTab'
import { ManuscriptTab } from '@/features/series/components/series-detail/ManuscriptTab'
import { ChaptersTab } from '@/features/series/components/series-detail/ChaptersTab'
import { PagesTab } from '@/features/series/components/series-detail/PagesTab'

function useHub() {
  return useOutletContext<SeriesHubContext>()
}

export function SeriesOverviewRoute() {
  const { summary, phase } = useHub()
  return phase === 'proposal' ? <ProposalOverviewTab summary={summary} /> : <ProductionOverviewTab summary={summary} />
}

export function SeriesManuscriptRoute() {
  const { summary } = useHub()
  return <ManuscriptTab summary={summary} />
}

export function SeriesChaptersRoute() {
  const { id, chapters } = useHub()
  return <ChaptersTab seriesId={id} chapters={chapters} />
}

export function SeriesPagesRoute() {
  const { chapters } = useHub()
  return <PagesTab chapters={chapters} />
}

export function SeriesComingSoonRoute({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center text-slate-400">
      {label} configuration (Coming soon)
    </div>
  )
}
