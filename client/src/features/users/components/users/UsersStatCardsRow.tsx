import { Card, CardContent } from '@/shared/components/ui/card'
import { Users, UserCheck, UserX, Mail, ArrowUpRight } from 'lucide-react'
import { useAdminUsers } from '@/features/users/hooks/useAdminUsers'

export function UsersStatCardsRow() {
  const { data: users, isLoading } = useAdminUsers()
  const total = users?.length ?? 0
  const active = users?.filter((user) => user.isActive).length ?? 0
  const suspended = total - active

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-2 w-full'>
      <StatCard icon={<Users className="text-purple-600" size={20}/>} title="Total Users" value={isLoading ? '...' : total} sub={<span className="text-emerald-600 flex items-center gap-1"><ArrowUpRight size={14}/> Live from server</span>} iconBg="bg-purple-100" />
      <StatCard icon={<UserCheck className="text-emerald-600" size={20}/>} title="Active Users" value={isLoading ? '...' : active} sub={total ? `${Math.round((active / total) * 100)}% of total` : 'No users'} iconBg="bg-emerald-100" />
      <StatCard icon={<UserX className="text-amber-500" size={20}/>} title="Suspended Users" value={isLoading ? '...' : suspended} sub={<span className="text-amber-500">{total ? `${Math.round((suspended / total) * 100)}% of total` : 'No suspended users'}</span>} iconBg="bg-amber-100" />
      <StatCard icon={<Mail className="text-purple-600" size={20}/>} title="Pending Invitations" value="0" sub="Invitation flow not configured" iconBg="bg-purple-100" />
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
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">{sub}</p>
      </CardContent>
    </Card>
  )
}
