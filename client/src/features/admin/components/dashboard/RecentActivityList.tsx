import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, ArrowRight } from 'lucide-react'
import { recentActivity } from '../../constants/dashboard'

export function RecentActivityList() {
  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock size={18} className="text-purple-600" />
          Recent User Activity
        </CardTitle>
        <a href="#" className="text-xs text-primary hover:underline flex items-center gap-1">View all activity <ArrowRight size={12}/></a>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {recentActivity.map((act, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                <img src={act.img} alt={act.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{act.name}</p>
                <p className="text-xs text-gray-500 truncate">{act.role}</p>
              </div>
              <span className="text-xs text-gray-400">{act.time}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <a href="#" className="text-xs text-primary hover:underline flex items-center justify-center gap-1">View full activity log <ArrowRight size={12}/></a>
        </div>
      </CardContent>
    </Card>
  )
}
