import { Book, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import type { SeriesViewModel } from './series-view-model'
import { StatCard } from '@/shared/components/ui/stat-card'

export function SeriesStatCards({ seriesData }: { seriesData: SeriesViewModel[] }) {
  const stats = [
  {
    title: 'Total Series',
    value: String(seriesData.length),
    subtitle: 'All time',
    icon: Book,
    tone: 'violet' as const
  },
  {
    title: 'In Review',
    value: String(seriesData.filter((series) => series.status.includes('Review')).length),
    subtitle: 'Awaiting feedback',
    icon: Clock,
    tone: 'amber' as const
  },
  {
    title: 'Ongoing',
    value: String(seriesData.filter((series) => series.status === 'In Production').length),
    subtitle: 'Actively publishing',
    icon: TrendingUp,
    tone: 'emerald' as const
  },
  {
    title: 'At Risk',
    value: String(seriesData.filter((series) => series.status === 'At Risk').length),
    subtitle: 'Needs attention',
    icon: AlertTriangle,
    tone: 'red' as const // We added red in StatCard
  }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <StatCard
          key={idx}
          label={stat.title}
          value={stat.value}
          description={stat.subtitle}
          icon={stat.icon}
          tone={stat.tone as any}
        />
      ))}
    </div>
  )
}

