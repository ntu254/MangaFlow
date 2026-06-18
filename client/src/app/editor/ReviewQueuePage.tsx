import { useState } from "react"
import { ArrowLeft, FileText, Inbox } from "lucide-react"
import { useEditorReviewQueue } from "@/features/reviews/hooks/useEditorFlow"
import { ReviewDetailPane } from "@/features/editor/components/ReviewDetailPane"
import { StatusBadge } from "@/shared/components/ui/status-badge"
import { seriesStatusUi } from "@/shared/lib/status-ui"
import { MasterDetailLayout } from "@/shared/components/layout/MasterDetailLayout"
import { usePageChrome } from "@/shared/components/layout/page-chrome"
import { cn } from "@/shared/lib/utils"

export default function EditorReviewQueuePage() {
  const { data = [], isLoading, isError } = useEditorReviewQueue()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  usePageChrome(
    {
      bleed: true,
      contextHeader: {
        title: "Review Queue",
        breadcrumb: "Editor",
        status: (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
            {data.length}
          </span>
        ),
      },
    },
    [data.length]
  )

  const list = (
    <div className="flex flex-col">
      {isLoading ? (
        <div className="p-6 text-sm text-muted-foreground">Loading queue...</div>
      ) : isError ? (
        <div className="p-6 text-sm text-rose-500">Failed to load review queue.</div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <Inbox size={40} strokeWidth={1.5} className="mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-900">Queue is empty</p>
        </div>
      ) : (
        data.map((item: any) => {
          const statusConfig = seriesStatusUi[item.series.status] || seriesStatusUi["DRAFT"]
          const active = selectedId === item.series.id
          return (
            <button
              key={item.series.id}
              onClick={() => setSelectedId(item.series.id)}
              className={cn(
                "flex flex-col gap-2 border-b border-border px-4 py-4 text-left transition-colors hover:bg-secondary/50",
                active && "bg-violet-50 hover:bg-violet-50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn("truncate text-sm font-bold", active ? "text-violet-700" : "text-slate-900")}>
                  {item.series.title}
                </span>
                <StatusBadge config={statusConfig} size="sm" />
              </div>
              <span className="line-clamp-1 text-xs text-muted-foreground">{item.series.synopsis || "No synopsis"}</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <FileText size={12} /> v{item.manuscript?.version ?? "-"} · {item.manuscript?.status ?? "NO_MANUSCRIPT"}
              </span>
            </button>
          )
        })
      )}
    </div>
  )

  const detail = selectedId ? (
    <div>
      <button
        onClick={() => setSelectedId(null)}
        className="flex items-center gap-2 px-6 py-3 text-[13px] font-bold text-slate-500 transition-colors hover:text-slate-900 md:hidden"
      >
        <ArrowLeft size={16} /> Back to queue
      </button>
      <ReviewDetailPane seriesId={selectedId} />
    </div>
  ) : (
    <div className="flex h-full flex-col items-center justify-center p-12 text-center text-muted-foreground">
      <FileText size={48} strokeWidth={1} className="mb-4 text-slate-300" />
      <p className="text-base font-medium text-slate-900">Select a series to review</p>
      <p className="text-sm">Pick an item from the queue to see manuscript details and decisions.</p>
    </div>
  )

  return <MasterDetailLayout list={list} detail={detail} listWidth="24rem" hasSelection={!!selectedId} />
}
