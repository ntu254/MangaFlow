import { Calendar } from 'lucide-react'
import { NextActionsRow } from '@/features/dashboard/components/mangaka/NextActionsRow'
import { ActiveSeriesPipeline } from '@/features/dashboard/components/mangaka/ActiveSeriesPipeline'
import { DueSoonList } from '@/features/dashboard/components/mangaka/DueSoonList'
import { RecentActivityTimeline } from '@/features/dashboard/components/mangaka/RecentActivityTimeline'
import { RankingSnapshot } from '@/features/dashboard/components/mangaka/RankingSnapshot'
import { PayrollSnapshot } from '@/features/dashboard/components/mangaka/PayrollSnapshot'
import { CurrentChapterProgress } from '@/features/dashboard/components/mangaka/CurrentChapterProgress'
import { ActionInbox } from '@/features/dashboard/components/mangaka/ActionInbox'
import { QuickActionsGrid } from '@/features/dashboard/components/mangaka/QuickActionsGrid'

export default function MangakaDashboardPage() {
  return (
    <div className='max-w-[1400px] w-full mx-auto pb-10 space-y-6'>
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Home</h1>
          <p className="text-[13px] text-muted-foreground">Your manga production command center. Track today's work across all series.</p>
        </div>
        <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg text-[13px] font-semibold border border-purple-100 shadow-sm">
          <Calendar size={16} />
          Today - May 27, 2025 (Tue)
        </div>
      </div>

      <div className="w-full mb-6">
        <NextActionsRow />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - 70% */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <ActiveSeriesPipeline />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DueSoonList />
            <RecentActivityTimeline />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RankingSnapshot />
            <PayrollSnapshot />
          </div>
        </div>

        {/* Right Column - 30% */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <CurrentChapterProgress />
          <ActionInbox />
          <QuickActionsGrid />
        </div>
      </div>
    </div>
  )
}
