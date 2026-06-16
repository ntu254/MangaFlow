import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { Card } from "@/shared/components/ui/card"

export function RankingReportCard({ data }: { data: any }) {
  const isPositive = data.trend === 'UP'
  return (
    <Card className="p-5 flex flex-col gap-4">
      <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Ranking Report</h3>
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-3xl font-extrabold text-slate-900">#{data.rank}</span>
          <span className="text-[12px] font-medium text-slate-500">Current Rank</span>
        </div>
        <div className="w-px h-10 bg-slate-200"></div>
        <div className="flex flex-col">
          <span className="text-[20px] font-bold text-slate-900">{data.score}</span>
          <span className="text-[12px] font-medium text-slate-500">Score</span>
        </div>
        <div className="flex flex-col items-start gap-1 ml-auto">
          {data.atRisk ? (
             <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-md border border-red-100 text-[12px] font-bold">
               <AlertTriangle size={14} /> At Risk: {data.atRiskReason}
             </div>
          ) : (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[12px] font-bold ${
              isPositive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
            }`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {data.trendValue}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
