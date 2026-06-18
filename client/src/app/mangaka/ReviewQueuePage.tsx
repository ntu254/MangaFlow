import { format } from "date-fns"
import { CheckCircle2, FileText, Image as ImageIcon, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { useMangakaReviewQueue } from "@/features/reviews/hooks/useMangakaReview"
import { MangakaReviewDetailPane } from "@/features/reviews/components/MangakaReviewDetailPane"
import { MasterDetailLayout } from "@/shared/components/layout/MasterDetailLayout"
import { usePageChrome } from "@/shared/components/layout/page-chrome"
import { cn } from "@/shared/lib/utils"

export default function MangakaReviewQueuePage() {
  const { data: queueData = [], isLoading, isError } = useMangakaReviewQueue()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  usePageChrome(
    {
      bleed: true,
      contextHeader: {
        title: "Review Queue",
        breadcrumb: "Mangaka",
        status: (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
            {queueData.length}
          </span>
        ),
      },
    },
    [queueData.length]
  )

  const list = (
    <div className="flex flex-col">
      {isLoading ? (
        <div className="p-6 text-sm text-muted-foreground">Loading queue...</div>
      ) : isError ? (
        <div className="p-6 text-sm text-rose-500">Failed to load review queue.</div>
      ) : queueData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <CheckCircle2 size={40} strokeWidth={1.5} className="mb-3 text-emerald-500/50" />
          <p className="text-sm font-medium text-slate-900">You're all caught up!</p>
          <p className="text-xs mt-1">There are no pending submissions waiting for your review.</p>
        </div>
      ) : (
        queueData.map((item: any) => {
          const active = selectedId === item.taskId
          return (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.taskId)}
              className={cn(
                "flex flex-col gap-2 border-b border-border px-4 py-4 text-left transition-colors hover:bg-secondary/50",
                active && "bg-violet-50 hover:bg-violet-50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn("truncate text-sm font-bold", active ? "text-violet-700" : "text-slate-900")}>
                  Task Review (v{item.version})
                </span>
                <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                  {format(new Date(item.updatedAt), "MMM d")}
                </span>
              </div>
              <span className="line-clamp-1 text-xs text-muted-foreground">
                Submitted by {item.submittedBy?.name || "Assistant"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <FileText size={12} /> Series: {item.seriesId}
                {item.fileAssetId && (
                  <>
                    <span className="mx-1 opacity-50">·</span>
                    <ImageIcon size={12} className="text-emerald-500" /> Attached
                  </>
                )}
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
      <MangakaReviewDetailPane taskId={selectedId} />
    </div>
  ) : (
    <div className="flex h-full flex-col items-center justify-center p-12 text-center text-muted-foreground bg-slate-50/30">
      <FileText size={48} strokeWidth={1} className="mb-4 text-slate-300" />
      <p className="text-base font-bold text-slate-900">Select a submission to review</p>
      <p className="text-[13px] mt-1 text-slate-500">Pick an item from the queue to see the assistant's work.</p>
    </div>
  )

  return <MasterDetailLayout list={list} detail={detail} listWidth="24rem" hasSelection={!!selectedId} />
}
