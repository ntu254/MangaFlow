import { AlertTriangle, MessageSquare, AlertCircle, Clock, ArrowRight } from 'lucide-react'
import { dueSoonData } from '../../constants/mangaka'

const getIcon = (iconName: string) => {
  switch(iconName) {
    case 'AlertTriangle': return <AlertTriangle size={14} />
    case 'MessageSquare': return <MessageSquare size={14} />
    case 'AlertCircle': return <AlertCircle size={14} />
    case 'Clock': return <Clock size={14} />
    default: return <Clock size={14} />
  }
}

export function DueSoonList() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900">Due Soon / At Risk</h2>
        <a href="#" className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
          View all <ArrowRight size={12}/>
        </a>
      </div>
      <div className="flex flex-col p-2">
        {dueSoonData.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group transition-colors">
            <div className="flex items-center gap-4 min-w-0">
              <div className={`flex flex-col items-center justify-center w-12 shrink-0 ${item.statusColor}`}>
                {getIcon(item.icon)}
                <span className="text-[10px] font-bold mt-1 tracking-tight">{item.status}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate leading-tight">{item.title}</span>
                <span className="text-[11px] text-gray-500 truncate mt-0.5">{item.subtitle}</span>
              </div>
            </div>
            <button className="px-3 py-1.5 text-[11px] font-semibold text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 shrink-0 ml-2 shadow-sm bg-white">
              {item.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
