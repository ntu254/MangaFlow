import { Book, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import type { SeriesViewModel } from './series-view-model'

export function SeriesStatCards({ seriesData }: { seriesData: SeriesViewModel[] }) {
  const stats = [
  {
    title: 'Total Series',
    value: String(seriesData.length),
    subtitle: 'All time',
    icon: <Book size={20} className="text-indigo-600" />,
    iconBg: 'bg-indigo-50 text-indigo-600',
    borderColor: 'border-slate-200',
    cardBg: 'bg-white'
  },
  {
    title: 'In Review',
    value: String(seriesData.filter((series) => series.status.includes('Review')).length),
    subtitle: 'Awaiting feedback',
    icon: <Clock size={20} className="text-orange-600" />,
    iconBg: 'bg-orange-50 text-orange-600',
    borderColor: 'border-slate-200',
    cardBg: 'bg-white'
  },
  {
    title: 'Ongoing',
    value: String(seriesData.filter((series) => series.status === 'In Production').length),
    subtitle: 'Actively publishing',
    icon: <TrendingUp size={20} className="text-emerald-600" />,
    iconBg: 'bg-emerald-50 text-emerald-600',
    borderColor: 'border-slate-200',
    cardBg: 'bg-white'
  },
  {
    title: 'At Risk',
    value: String(seriesData.filter((series) => series.status === 'At Risk').length),
    subtitle: 'Needs attention',
    icon: <AlertTriangle size={20} className="text-red-600" />,
    iconBg: 'bg-red-100 text-red-600',
    borderColor: 'border-red-200',
    cardBg: 'bg-red-50'
  }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div key={idx} className={`${stat.cardBg} rounded-xl shadow-sm border p-4 flex items-center gap-4 ${stat.borderColor} transition-colors hover:shadow-md cursor-pointer`}>
          <div className={`p-3 rounded-xl flex-shrink-0 ${stat.iconBg}`}>
            {stat.icon}
          </div>
          <div className="flex flex-col">
            <div className="text-[13px] font-bold text-slate-700">{stat.title}</div>
            <div className="text-2xl font-bold text-slate-900 leading-tight">{stat.value}</div>
            <div className="text-[12px] text-slate-500 font-medium">{stat.subtitle}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
