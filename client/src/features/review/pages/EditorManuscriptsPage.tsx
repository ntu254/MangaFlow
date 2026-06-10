import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { ReviewPage } from "@/features/review/pages/ReviewPage"

export function EditorManuscriptsPage() {
  usePageTitle("Manuscript Review", "Review submitted manuscripts and decide on approval or revision.")
  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-wrap gap-sm">
          <MFBadge tone="primary" size="md">Editor</MFBadge>
          <MFBadge tone="success" size="md">Manuscripts view</MFBadge>
        </div>
        <h1 className="mt-md text-headline-lg text-on-surface">Manuscript review</h1>
        <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
          Review submitted manuscripts before Board approval. Editor proposal review is distinct from Editor production final approval. Approve, request revision, or reject through backend-enforced actions.
        </p>
      </MFCard>
      <ReviewPage />
    </PageShell>
  )
}