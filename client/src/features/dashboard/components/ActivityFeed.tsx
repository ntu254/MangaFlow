import { Clock } from 'lucide-react'

interface ActivityItem {
  id: string | number
  action: string
  series: string
  user: string
  time: string
  status: 'pending' | 'approved' | 'changes'
}

interface ActivityFeedProps {
  activities: ActivityItem[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[14px] font-bold text-gray-900">Recent Activity</h2>
      </div>
      
      <div className="relative">
        <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-100"></div>
        <div className="flex flex-col gap-6">
          {activities.length === 0 ? (
            <div className="text-sm text-gray-500 pl-8">No recent activity.</div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex gap-4 relative z-10">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm mt-0.5 ${
                  activity.status === 'pending' ? 'bg-indigo-100 text-indigo-600' :
                  activity.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  <Clock size={10} strokeWidth={3} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-gray-900">{activity.action}</span>
                  <span className="text-[12px] font-medium text-gray-600 mt-0.5">{activity.series}</span>
                  <span className="text-[11px] text-gray-400 mt-1">{activity.user} · {activity.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <button className="w-full mt-6 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-2.5 rounded-lg text-[12px] transition-colors">
        View Activity Log
      </button>
    </div>
  )
}
