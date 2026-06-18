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
import { MangakaReviewQueue } from '@/features/dashboard/components/mangaka/MangakaReviewQueue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { BentoGrid, BentoCard } from '@/shared/components/layout/BentoGrid'
import { usePageChrome } from '@/shared/components/layout/page-chrome'

export default function MangakaDashboardPage() {
  usePageChrome({
    contextHeader: {
      title: 'Home',
      breadcrumb: 'Production Hub',
      actions: (
        <div className="flex items-center gap-2 rounded-lg border border-violet-100 bg-violet-50 px-4 py-2 text-[13px] font-semibold text-violet-700 shadow-sm">
          <Calendar size={16} />
          Today
        </div>
      ),
    },
  })

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-10">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="review-queue">Review Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 space-y-6">
          <NextActionsRow />

          <BentoGrid>
            <BentoCard bare colSpan={8} className="flex flex-col gap-6">
              <ActiveSeriesPipeline />
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <DueSoonList />
                <RecentActivityTimeline />
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <RankingSnapshot />
                <PayrollSnapshot />
              </div>
            </BentoCard>

            <BentoCard bare colSpan={4} className="flex flex-col gap-6">
              <CurrentChapterProgress />
              <ActionInbox />
              <QuickActionsGrid />
            </BentoCard>
          </BentoGrid>
        </TabsContent>

        <TabsContent value="review-queue" className="mt-0">
          <MangakaReviewQueue />
        </TabsContent>
      </Tabs>
    </div>
  )
}
