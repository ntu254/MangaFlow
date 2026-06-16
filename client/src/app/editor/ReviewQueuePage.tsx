import { useEditorReviewQueue } from "@/features/reviews/hooks/useEditorFlow"
import { PageHeader } from "@/shared/components/ui/page-header"
import { ReviewQueueLayout } from "@/features/editor/components/ReviewQueueLayout"
import { ReviewCard } from "@/features/editor/components/ReviewCard"

export default function EditorReviewQueuePage() {
  const { data = [], isLoading, isError } = useEditorReviewQueue()

  return (
    <div className="max-w-[1400px] w-full mx-auto pb-10 space-y-6">
      <PageHeader 
        title="Review Queue"
        description="Series proposals waiting for Tantou Editor review."
      />

      {isLoading ? (
        <div className="p-12 text-center text-slate-500 font-medium bg-white rounded-2xl border border-slate-200">Loading review queue...</div>
      ) : isError ? (
        <div className="p-12 text-center text-red-500 font-medium bg-white rounded-2xl border border-slate-200">Failed to load review queue.</div>
      ) : (
        <ReviewQueueLayout isEmpty={data.length === 0}>
          {data.map((item) => (
            <ReviewCard key={item.series.id} item={item} />
          ))}
        </ReviewQueueLayout>
      )}
    </div>
  )
}
