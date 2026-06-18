import { MessageSquare, PenTool, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'
import { activeSeriesData } from '../../constants/mangaka'
const getThumbnail = (name: string, id: number) => {
  const colors = ['bg-purple-100 text-purple-700', 'bg-blue-100 text-blue-700', 'bg-rose-100 text-rose-700', 'bg-emerald-100 text-emerald-700'];
  const color = colors[(id - 1) % colors.length];
  return (
    <div className={`w-10 h-10 rounded object-cover flex items-center justify-center font-bold text-lg shrink-0 border border-gray-100 ${color}`}>
      {name.charAt(0)}
    </div>
  )
}

const getIcon = (iconName: string) => {
  switch(iconName) {
    case 'MessageSquare': return <MessageSquare size={14} />
    case 'PenTool': return <PenTool size={14} />
    case 'AlertTriangle': return <AlertTriangle size={14} />
    case 'CheckCircle2': return <CheckCircle2 size={14} />
    default: return <MessageSquare size={14} />
  }
}

export function ActiveSeriesPipeline() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900">Active Series Pipeline</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-xs font-semibold text-gray-500 border-b border-gray-100 bg-white">
              <th className="px-4 py-3 font-medium">Series</th>
              <th className="px-4 py-3 font-medium text-center">Current Stage</th>
              <th className="px-4 py-3 font-medium">Next Milestone</th>
              <th className="px-4 py-3 font-medium text-center">Chapters</th>
              <th className="px-4 py-3 font-medium w-[260px] text-center">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {activeSeriesData.map((series) => (
              <tr key={series.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {getThumbnail(series.name, series.id)}
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">{series.name}</span>
                      <span className="text-[10px] text-gray-500">{series.genre}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold ${series.stageColor}`}>
                    {series.stage}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 ${series.milestoneIconColor}`}>
                      {getIcon(series.milestoneIcon)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{series.milestoneTitle}</span>
                      <span className="text-[11px] text-gray-500">{series.milestoneDate}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-center text-sm font-medium text-gray-700">
                  {series.chapters}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col w-full relative pt-[3px]">
                    <div className="absolute top-[8px] left-4 right-4 h-[2px] bg-gray-200 -z-10"></div>
                    <div className="flex justify-between w-full z-10 relative px-2">
                      {[1, 2, 3, 4].map((step, idx) => {
                        let dotClass = 'border-gray-300 bg-white';
                        if (series.progressStage >= step) {
                          dotClass = series.progressStage === step && series.stage === 'At Risk' ? 'border-rose-500 bg-white' : 'border-purple-500 bg-purple-500';
                        }
                        return (
                          <div key={step} className="flex flex-col items-center gap-1.5 bg-transparent">
                            <div className={`w-[12px] h-[12px] rounded-full border-[3px] box-content ${dotClass}`}></div>
                            <span className="text-[9px] text-gray-500 font-medium bg-white px-1">
                              {idx === 0 ? 'Draft' : idx === 1 ? 'Review' : idx === 2 ? 'Revisions' : 'Approved'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-gray-100 flex justify-center bg-gray-50/50 cursor-pointer hover:bg-gray-100">
        <span className="text-xs font-semibold text-purple-600 flex items-center gap-1">
          View all series <ArrowRight size={12}/>
        </span>
      </div>
    </div>
  )
}
