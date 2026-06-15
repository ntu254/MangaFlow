import { Card, CardContent } from '@/components/ui/card'
import { Users, UserCheck, UserX, Crown, ShieldCheck } from 'lucide-react'
import { useAdminBoardMembers } from '@/hooks/useAdmin'

export function BoardStatCardsRow() {
  const { data: members, isLoading } = useAdminBoardMembers()
  const total = members?.length ?? 0
  const active = members?.filter((m) => m.isActive).length ?? 0
  const inactive = total - active
  const chairAssigned = members?.some((m) => m.isChair) ?? false

  return (
    <div className='grid grid-cols-2 md:grid-cols-5 gap-4 w-full'>
      <StatCard icon={<Users className="text-purple-600" size={20}/>} title="Total Board Members" value={isLoading ? '...' : total} sub="Registered board members" iconBg="bg-purple-100" />
      <StatCard icon={<UserCheck className="text-emerald-600" size={20}/>} title="Active Members" value={isLoading ? '...' : active} sub={total ? `${Math.round((active / total) * 100)}% of total` : 'No active members'} iconBg="bg-emerald-100" />
      <StatCard icon={<UserX className="text-orange-500" size={20}/>} title="Inactive Members" value={isLoading ? '...' : inactive} sub={total ? `${Math.round((inactive / total) * 100)}% of total` : 'No inactive members'} iconBg="bg-orange-100" />
      <StatCard icon={<Crown className="text-purple-600" size={20}/>} title="Chair Assigned" value={chairAssigned ? 'Yes' : 'No'} sub={chairAssigned ? 'Chair is assigned' : 'Chair not set'} iconBg="bg-purple-100" />
      <StatCard icon={<ShieldCheck className="text-purple-600" size={20}/>} title="Quorum Readiness" value={active >= 5 ? 'Ready' : 'Not Ready'} sub={`${active} of ${total} active`} iconBg="bg-purple-100" />
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
