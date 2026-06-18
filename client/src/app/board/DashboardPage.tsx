
import { useBoardQueue } from "@/features/reviews/hooks/useBoardFlow"
import { useAuthStore } from "@/features/auth/store/authStore"
import { PageHeader } from "@/shared/components/ui/page-header"
import { BoardDecisionCard } from "@/features/board/components/BoardDecisionCard"
import { EmptyState } from "@/shared/components/ui/empty-state"
import { CheckCircle2 } from "lucide-react"
import { BentoGrid, BentoCard } from "@/shared/components/layout/BentoGrid"

export default function BoardDashboardPage() {
  const { user } = useAuthStore()
  const { data: queueData, isLoading } = useBoardQueue()

  const pendingSeries = queueData?.filter(s => s.decisionStatus === "PENDING") ?? []
  const resolvedSeries = queueData?.filter(s => s.decisionStatus !== "PENDING") ?? []

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p>Loading board queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] w-full mx-auto pb-10 space-y-6">
      <PageHeader 
        title="Editorial Board"
        description={`Welcome back, ${user?.name}. Review and vote on series proposals.`}
      />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-bold tracking-tight text-slate-900">Pending Reviews</h2>
          <div className="bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-[12px] font-bold">
            {pendingSeries.length} Actions Required
          </div>
        </div>

        {pendingSeries.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Queue is empty"
            description="There are currently no series proposals awaiting board review."
          />
        ) : (
          <BentoGrid>
            {pendingSeries.map((series) => (
              <BentoCard bare colSpan={4} key={series.id} className="h-full">
                <div className="h-full">
                  <BoardDecisionCard series={series} linkTo={`/app/board/series/${series.id}/voting`} />
                </div>
              </BentoCard>
            ))}
          </BentoGrid>
        )}
      </section>

      {resolvedSeries.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[18px] font-bold tracking-tight text-slate-900">Recently Resolved</h2>
          </div>
          <BentoGrid>
            {resolvedSeries.map((series) => (
              <BentoCard bare colSpan={4} key={series.id} className="h-full">
                <div className="h-full">
                  <BoardDecisionCard series={series} linkTo={`/app/board/series/${series.id}/summary`} />
                </div>
              </BentoCard>
            ))}
          </BentoGrid>
        </section>
      )}
    </div>
  )
}
