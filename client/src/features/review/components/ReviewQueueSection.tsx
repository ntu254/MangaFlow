import { ActionItemList } from "@/shared/components/domain"
import { taskStatusUI } from "@/shared/lib/status-ui"
import { ReviewQueuePanel } from "./ReviewQueuePanel"
import type { ReviewQueueRow } from "../utils/review-queue.mappers"
import type { ActionItem } from "@/shared/components/domain"

interface ReviewQueueSectionProps {
  actions: ActionItem[]
  rows: ReviewQueueRow[]
  loading: boolean
  error: string
  onRetry: () => void
}

export function ReviewQueueSection({ actions, rows, loading, error, onRetry }: ReviewQueueSectionProps) {
  return (
    <section className="grid gap-lg xl:grid-cols-[24rem_minmax(0,1fr)]">
      <div>
        <h2 className="mb-md text-title-lg text-on-surface">Pending review actions</h2>
        <ActionItemList items={actions} statusMapping={taskStatusUI} />
      </div>
      <div>
        <h2 className="mb-md text-title-lg text-on-surface">Review queue</h2>
        <ReviewQueuePanel rows={rows} loading={loading} error={error} onRetry={onRetry} />
      </div>
    </section>
  )
}
