import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { ReviewPage } from "@/features/review/pages/ReviewPage"

export function MangakaSubmissionsPage() {
  usePageTitle("Submissions Review", "Review assistant submissions for your series tasks.")
  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-wrap gap-sm">
          <MFBadge tone="primary" size="md">Mangaka</MFBadge>
          <MFBadge tone="success" size="md">Submissions view</MFBadge>
        </div>
        <h1 className="mt-md text-headline-lg text-on-surface">Review submissions</h1>
        <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
          Review assistant submissions on your series tasks. Approve internally before Editor final approval. Backend enforces the review chain: Assistant ? Mangaka ? Editor.
        </p>
      </MFCard>
      <ReviewPage />
    </PageShell>
  )
}