import { Upload, MessageSquare, CheckCircle2, ShieldCheck, User, ArrowRight } from 'lucide-react'
import { recentActivityData } from '../../constants/mangaka'

const getIcon = (iconName: string) => {
  switch(iconName) {
    case 'Upload': return <Upload size={14} />
    case 'MessageSquare': return <MessageSquare size={14} />
    case 'CheckCircle2': return <CheckCircle2 size={14} />
    case 'ShieldCheck': return <ShieldCheck size={14} />
    case 'User': return <User size={14} />
    default: return <MessageSquare size={14} />
  }
}

export function RecentActivityTimeline() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
        <a href="#" className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
          View all <ArrowRight size={12}/>
        </a>
      </div>
      <div className="flex flex-col p-5 pr-4 overflow-hidden relative">
        <div className="absolute left-[35px] top-6 bottom-6 w-px bg-gray-200 -z-10"></div>
        {recentActivityData.map((activity, idx) => (
          <div key={activity.id} className={`flex items-start gap-4 relative ${idx !== recentActivityData.length - 1 ? 'mb-5' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-[3px] border-white z-10 ${activity.iconColor}`}>
              {getIcon(activity.icon)}
            </div>
            <div className="flex flex-col min-w-0 pt-0.5 w-full">
              <div className="flex justify-between items-start w-full">
                <span className="text-[13px] font-medium text-gray-900 leading-tight">{activity.title}</span>
                <span className="text-[10px] font-medium text-gray-400 shrink-0 ml-2">{activity.time}</span>
              </div>
              <span className="text-[11px] text-gray-500 mt-0.5">{activity.subtitle}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
