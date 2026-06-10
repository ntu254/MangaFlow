import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { ReviewPage } from "@/features/review/pages/ReviewPage"

export function EditorCommentsPage() {
  usePageTitle("Comments", "Review and resolve production comments as Editor.")
  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-wrap gap-sm">
          <MFBadge tone="primary" size="md">Editor</MFBadge>
          <MFBadge tone="success" size="md">Comments view</MFBadge>
        </div>
        <h1 className="mt-md text-headline-lg text-on-surface">Editor comments</h1>
        <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
          Review, create, and resolve production comments. All comments must reach RESOLVED_BY_EDITOR status before publication readiness is granted. Backend enforces comment lifecycle transitions.
        </p>
      </MFCard>
      <ReviewPage />
    </PageShell>
  )
}