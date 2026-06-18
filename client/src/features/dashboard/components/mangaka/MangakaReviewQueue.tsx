import { format } from "date-fns"
import { CheckCircle2, Clock, FileText } from "lucide-react"
import { Link } from "react-router-dom"
import { useMangakaReviewQueue } from "@/features/reviews/hooks/useMangakaReview"
import { DataTable, type DataTableColumn } from "@/shared/components/ui/data-table"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"

export function MangakaReviewQueue() {
  const { data: queueData, isLoading, isError } = useMangakaReviewQueue()
  const submissions = queueData ?? []

  const columns: DataTableColumn<any>[] = [
    {
      header: "Series & Page",
      cell: (item) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-[13px]">Series ID: {item.seriesId}</span>
          <span className="text-[12px] text-muted-foreground flex items-center gap-1">
            <FileText size={12} />
            Task ID: {item.taskId}
          </span>
        </div>
      ),
    },
    {
      header: "Assistant",
      cell: (item) => (
        <span className="text-[13px]">{item.submittedBy?.name || "Assistant"}</span>
      ),
    },
    {
      header: "Version",
      cell: (item) => (
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
          v{item.version}
        </Badge>
      ),
    },
    {
      header: "Submitted At",
      cell: (item) => (
        <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
          <Clock size={12} />
          {format(new Date(item.updatedAt), "MMM d, yyyy HH:mm")}
        </div>
      ),
    },
    {
      header: "Action",
      className: "text-right",
      cell: (item) => (
        <div className="flex justify-end">
          <Button asChild size="sm" variant="default" className="h-8">
            <Link to={`/app/mangaka/tasks/${item.taskId}/review`}>
              Review
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Submissions to Review</h2>
          <p className="text-[13px] text-muted-foreground">Approve or request revisions for pages submitted by your assistants.</p>
        </div>
        <Badge variant="outline" className="bg-white">
          {submissions.length} Pending
        </Badge>
      </div>

      <DataTable
        data={submissions}
        columns={columns}
        rowKey={(item) => item.id}
        loading={isLoading}
        error={isError}
        emptyState={
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500/50 mb-3" />
            <h3 className="font-medium text-gray-900">You're all caught up!</h3>
            <p className="text-[13px] text-muted-foreground mt-1">There are no pending submissions waiting for your review.</p>
          </div>
        }
      />
    </div>
  )
}
