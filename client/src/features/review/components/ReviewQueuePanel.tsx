import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFTable, type MFTableColumn } from "@/shared/components/ui"
import { StatusBadge } from "@/shared/components/domain"
import { submissionStatusUI } from "@/shared/lib/status-ui"
import type { ReviewQueueRow } from "../utils/review-queue.mappers"

const reviewColumns: MFTableColumn<ReviewQueueRow>[] = [
  {
    id: "target",
    header: "Review target",
    cell: (row) => (
      <div className="min-w-0">
        <p className="break-words text-label-md text-on-surface">{row.target}</p>
        <p className="mt-xs break-words text-label-sm text-on-surface-muted">
          {row.series}
        </p>
      </div>
    ),
  },
  {
    id: "type",
    header: "Type",
    cell: (row) => row.type,
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} mapping={submissionStatusUI} />,
  },
  {
    id: "owner",
    header: "Owner",
    cell: (row) => row.owner,
  },
  {
    id: "age",
    header: "Age",
    cell: (row) => row.age,
  },
]

interface ReviewQueuePanelProps {
  rows: ReviewQueueRow[]
  loading: boolean
  error: string
  onRetry: () => void
}

export function ReviewQueuePanel({ rows, loading, error, onRetry }: ReviewQueuePanelProps) {
  if (error) {
    return <MFErrorState title="Could not load review queue" description={error} onRetry={onRetry} />
  }

  return (
    <MFTable
      caption="Review queue"
      rows={rows}
      columns={reviewColumns}
      getRowKey={(row) => row.id}
      loading={loading}
      emptyTitle="No review items"
      emptyDescription="Review records will appear here when backend returns submissions for your role."
    />
  )
}
