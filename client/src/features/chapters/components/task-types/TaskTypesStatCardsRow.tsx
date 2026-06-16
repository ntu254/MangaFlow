import { Card, CardContent } from '@/shared/components/ui/card'
import { Layers, Ban, TrendingUp, JapaneseYen, AlertTriangle } from 'lucide-react'
import { useAdminTaskTypes } from '@/features/chapters/hooks/useAdminTaskTypes'

export function TaskTypesStatCardsRow() {
  const { data: taskTypes, isLoading } = useAdminTaskTypes()
  const active = taskTypes?.filter((type) => type.isActive).length ?? 0
  const inactive = taskTypes ? taskTypes.length - active : 0
  const averageRate = taskTypes?.length
    ? Math.round(taskTypes.reduce((sum, type) => sum + type.baseRate, 0) / taskTypes.length)
    : 0

  return (
    <div className='grid grid-cols-2 md:grid-cols-5 gap-4 w-full'>
      <StatCard icon={<Layers className="text-purple-600" size={20}/>} title="Active Task Types" value={isLoading ? '...' : active} sub={<span className="text-purple-600">{inactive} inactive</span>} iconBg="bg-purple-100" />
      <StatCard icon={<Ban className="text-orange-500" size={20}/>} title="Inactive" value={isLoading ? '...' : inactive} sub={<span className="text-orange-500">Deactivated</span>} iconBg="bg-orange-100" />
      <StatCard icon={<TrendingUp className="text-emerald-600" size={20}/>} title="Used This Month" value="-" sub={<span className="text-gray-400 font-medium">Usage analytics pending</span>} iconBg="bg-emerald-100" />
      <StatCard icon={<JapaneseYen className="text-purple-600" size={20}/>} title="Average Base Rate" value={`${averageRate.toLocaleString()} VND`} sub="All task types" iconBg="bg-purple-100" />
      <StatCard icon={<AlertTriangle className="text-red-500" size={20}/>} title="Conflicts" value="0" sub={<span className="text-emerald-600">No conflicts</span>} iconBg="bg-red-100" />
    </div>
  )
}

function StatCard({ icon, title, value, sub, iconBg }: any) {
  return (
    <Card className="shadow-sm border-gray-100">
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between mb-2">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">{sub}</p>
      </CardContent>
    </Card>
  )
}
