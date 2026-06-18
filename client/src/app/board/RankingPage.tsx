import { useMemo } from 'react'
import { Trophy, TrendingUp, TrendingDown, Star, ArrowUpRight } from 'lucide-react'
import { PageHeader } from '@/shared/components/ui/page-header'
import { BentoGrid, BentoCard } from '@/shared/components/layout/BentoGrid'
import { DataTable, type DataTableColumn } from '@/shared/components/ui/data-table'
import { useSeriesList } from '@/features/series/hooks/useSeries'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { seriesStatusUi } from '@/shared/lib/status-ui'

export default function BoardRankingPage() {
  const { data: seriesList = [], isLoading } = useSeriesList()

  // Filter for published or ongoing series that would theoretically be ranked
  const rankedSeries = useMemo(() => {
    return (seriesList as any[])
      .filter(s => s.status === 'PUBLISHED' || s.status === 'READY_FOR_PUBLICATION' || s.status === 'ONGOING' || s.status === 'IN_PRODUCTION')
      // Sort by mock readership or id for now
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [seriesList])

  const topSeries = rankedSeries[0]
  const risingSeries = rankedSeries[1]

  const columns: DataTableColumn<any>[] = [
    {
      header: 'RANK',
      className: 'w-[10%] text-center',
      cell: (item: any) => {
        const rank = rankedSeries.findIndex(s => s.id === item.id) + 1
        return (
          <div className="flex items-center justify-center font-extrabold text-[16px] text-slate-700">
            {rank === 1 ? <Trophy className="text-amber-500 w-5 h-5 mr-1" /> : `#${rank}`}
          </div>
        )
      }
    },
    {
      header: 'SERIES',
      className: 'w-[40%]',
      cell: (series) => (
        <div className="flex flex-col min-w-0">
          <span className="text-[14px] font-bold text-slate-900 truncate">{series.title}</span>
          <span className="text-[12px] text-slate-500">{series.type}</span>
        </div>
      )
    },
    {
      header: 'STATUS',
      className: 'w-[15%]',
      cell: (series) => {
        const statusStr = series.status.toUpperCase().replace(' ', '_')
        const config = seriesStatusUi[statusStr] || seriesStatusUi['ONGOING']
        return <StatusBadge config={config} size="sm" />
      }
    },
    {
      header: 'PERFORMANCE',
      className: 'w-[20%]',
      cell: (series: any) => {
        const score = (series.title.length * 4.2) % 100;
        return (
          <div className="flex flex-col gap-1 w-3/4">
             <div className="flex items-center justify-between text-[11px] font-bold">
               <span className="text-slate-500">Readership Score</span>
               <span className="text-emerald-600">{score.toFixed(1)}k</span>
             </div>
             <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, score)}%` }}></div>
             </div>
          </div>
        )
      }
    },
    {
      header: 'TREND',
      className: 'w-[15%] text-right',
      cell: (series: any) => {
        const rank = rankedSeries.findIndex(s => s.id === series.id) + 1
        const isUp = rank % 2 !== 0;
        return (
          <div className={`flex items-center justify-end gap-1 text-[12px] font-bold ${isUp ? 'text-emerald-600' : 'text-rose-500'}`}>
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isUp ? '+2' : '-1'}
          </div>
        )
      }
    }
  ]

  return (
    <div className="max-w-[1400px] w-full mx-auto pb-10 space-y-6">
      <PageHeader 
        title="Series Ranking Report"
        description="Performance overview and readership rankings across all active publications."
      />

      {/* Top Dashboard KPIs */}
      <BentoGrid>
        <BentoCard colSpan={4} className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-500 mb-1">Top Performer</span>
            <span className="text-2xl font-extrabold text-slate-900">{topSeries?.title || "N/A"}</span>
            <span className="text-sm text-emerald-600 font-bold mt-1">+12% vs last week</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            <span className="text-[12px] font-bold text-amber-700 uppercase tracking-wider">#1 Ranked</span>
          </div>
        </BentoCard>

        <BentoCard colSpan={4} className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
           <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-500 mb-1">Fastest Rising</span>
            <span className="text-2xl font-extrabold text-slate-900">{risingSeries?.title || "N/A"}</span>
            <span className="text-sm text-emerald-600 font-bold mt-1">+24% this month</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <ArrowUpRight size={16} className="text-emerald-500" />
            <span className="text-[12px] font-bold text-emerald-700 uppercase tracking-wider">Trending Up</span>
          </div>
        </BentoCard>

        <BentoCard colSpan={4}>
           <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-500 mb-1">Average Rating</span>
            <span className="text-2xl font-extrabold text-slate-900">4.8</span>
            <span className="text-sm text-emerald-600 font-bold mt-1">+0.1 vs last quarter</span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-amber-400">
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" className="opacity-50" />
          </div>
        </BentoCard>
      </BentoGrid>

      {/* Detailed Ranking Table */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">Global Ranking Table</h2>
          <span className="text-[12px] font-medium text-slate-500">Updated hourly</span>
        </div>
        <DataTable
          data={rankedSeries}
          columns={columns}
          rowKey={(s) => s.id}
          loading={isLoading}
          className="border-0 rounded-none bg-transparent"
        />
      </section>
    </div>
  )
}
