import { StatCardsRow } from '@/features/dashboard/components/admin/StatCardsRow'
import { RoleDistributionChart } from '@/features/dashboard/components/admin/RoleDistributionChart'
import { Users, ArrowRight } from 'lucide-react'
import { RecentActivityList } from '@/features/dashboard/components/admin/RecentActivityList'
import { PendingActionsList } from '@/features/dashboard/components/admin/PendingActionsList'
import { BoardGovernanceCard } from '@/features/dashboard/components/admin/BoardGovernanceCard'
import { TaskHealthTable } from '@/features/dashboard/components/admin/TaskHealthTable'
import { QuickActionsGrid } from '@/features/dashboard/components/admin/QuickActionsGrid'
import { SystemStatusCard } from '@/features/dashboard/components/admin/SystemStatusCard'

export default function AdminDashboard() {
  return (
    <div className='max-w-7xl mx-auto space-y-6 pb-10'>
      <StatCardsRow />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RoleDistributionChart 
          title="User Overview" 
          icon={<Users size={18} className="text-purple-600" />}
          rightElement={<a href="#" className="text-xs text-primary hover:underline flex items-center gap-1">View all users <ArrowRight size={12}/></a>}
        />
        <RecentActivityList />
        <PendingActionsList />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BoardGovernanceCard />
        <TaskHealthTable />
        <div className="flex flex-col gap-6">
          <QuickActionsGrid />
          <SystemStatusCard />
        </div>
      </div>
    </div>
  )
}
