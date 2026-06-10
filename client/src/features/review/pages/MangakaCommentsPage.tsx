import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { ReviewPage } from "@/features/review/pages/ReviewPage"

export function MangakaCommentsPage() {
  usePageTitle("Comments", "Review and manage production comments on your series.")
  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-wrap gap-sm">
          <MFBadge tone="primary" size="md">Mangaka</MFBadge>
          <MFBadge tone="success" size="md">Comments view</MFBadge>
        </div>
        <h1 className="mt-md text-headline-lg text-on-surface">Production comments</h1>
        <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
          View and manage threaded production comments on your series. Comments must be resolved by Editor before publication readiness is granted.
        </p>
      </MFCard>
      <ReviewPage />
    </PageShell>
  )
}