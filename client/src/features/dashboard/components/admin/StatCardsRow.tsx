import { Card, CardContent } from '@/shared/components/ui/card'
import { Users, UserCheck, Layers, UserCog, Activity, ArrowUpRight } from 'lucide-react'
import { useAdminDashboardSummary } from '@/features/dashboard/hooks/useDashboard'

export function StatCardsRow() {
  const { data, isLoading } = useAdminDashboardSummary()

  const stats = data?.stats
  const badges = data?.sidebarBadges
  const totalUsers = (stats?.activeUsers ?? 0) + (badges?.suspendedUsers ?? 0)

  return (
    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
      <StatCard icon={<Users className="text-purple-600" size={20}/>} title="Total Users" value={isLoading ? '...' : totalUsers} sub={<span className="text-green-600 flex items-center gap-1"><ArrowUpRight size={14}/> Live from server</span>} iconBg="bg-purple-100" />
      <StatCard icon={<UserCheck className="text-emerald-600" size={20}/>} title="Active Users" value={isLoading ? '...' : stats?.activeUsers ?? 0} sub="Active accounts" iconBg="bg-emerald-100" />
      <StatCard icon={<Users className="text-purple-600" size={20}/>} title="Board Members" value={isLoading ? '...' : stats?.boardMembers ?? 0} sub={<span className="text-emerald-600">Active board members</span>} iconBg="bg-purple-100" />
      <StatCard icon={<Layers className="text-purple-600" size={20}/>} title="Active Task Types" value={isLoading ? '...' : stats?.activeTaskTypes ?? 0} sub={`${badges?.inactiveTaskTypes ?? 0} inactive`} iconBg="bg-purple-100" />
      <StatCard icon={<UserCog className="text-orange-500" size={20}/>} title="Pending Reviews" value={isLoading ? '...' : badges?.seriesPendingReview ?? 0} sub={<span className="text-orange-500">Series pending review</span>} iconBg="bg-orange-100" />
      <StatCard icon={<Activity className="text-purple-600" size={20}/>} title="System Warnings" value={isLoading ? '...' : badges?.systemWarnings ?? 0} sub={<span className={(badges?.systemWarnings ?? 0) > 0 ? 'text-orange-500' : 'text-emerald-600'}>{(badges?.systemWarnings ?? 0) > 0 ? 'Requires attention' : 'All clear'}</span>} iconBg="bg-purple-100" />
    </div>
  )
}

function StatCard({ icon, title, value, sub, iconBg }: any) {
  return (
    <Card className="shadow-sm border-gray-100">
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between mb-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">{sub}</p>
      </CardContent>
    </Card>
  )
}
