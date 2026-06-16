import { ArrowRight, ChevronUp } from 'lucide-react'

export function RankingSnapshot() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/30 rounded-t-xl">
        <h2 className="text-sm font-bold text-gray-900">Ranking Snapshot</h2>
        <a href="#" className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
          View ranking <ArrowRight size={12}/>
        </a>
      </div>
      <div className="flex flex-col justify-center flex-1 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg border border-purple-100">
              #12
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">Eclipse of Eternity</span>
              <span className="text-[11px] font-medium text-gray-500">Overall Ranking</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-gray-900">Top 15%</span>
            <span className="text-[11px] text-gray-500">Action Genre</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-emerald-600 flex items-center gap-0.5">
              <ChevronUp size={14} /> 3
            </span>
            <span className="text-[10px] text-gray-400 font-medium">vs last week</span>
          </div>
        </div>
      </div>
    </div>
  )
}
