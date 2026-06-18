import { format } from "date-fns"
import { CheckCircle2, Clock, FileText } from "lucide-react"
import { Link } from "react-router-dom"
import { useEditorPageReviewQueue } from "@/features/reviews/hooks/useEditorFlow"
import { DataTable, type DataTableColumn } from "@/shared/components/ui/data-table"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"

export function EditorPageReviewQueue() {
  const { data: submissions = [], isLoading, isError } = useEditorPageReviewQueue()

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
        <div className="flex flex-col gap-1">
          <span className="text-[13px]">{item.submittedBy?.name || "Assistant"}</span>
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 w-fit text-[10px] h-4">
            Mangaka Approved
          </Badge>
        </div>
      ),
    },
    {
      header: "Version",
      cell: (item) => (
        <Badge variant="outline" className="text-gray-500">
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
        <div className="flex justify-end gap-2">
          <Button asChild size="sm" variant="default" className="h-8 bg-violet-600 hover:bg-violet-700">
            <Link to={`/app/editor/pages/${item.pageId}/studio`}> {/* Link to page studio */}
              Final Review
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
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Final Page Reviews</h2>
          <p className="text-[13px] text-muted-foreground">Approve pages that have been signed off by the Mangaka.</p>
        </div>
        <Badge variant="outline" className="bg-white text-violet-600 border-violet-200">
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
            <h3 className="font-medium text-gray-900">All caught up!</h3>
            <p className="text-[13px] text-muted-foreground mt-1">There are no Mangaka-approved pages waiting for your final review.</p>
          </div>
        }
      />
    </div>
  )
}
