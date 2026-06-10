import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { SeriesPage } from "@/features/series/pages/SeriesPage"

export function EditorChaptersPage() {
  usePageTitle("Chapters Overview", "Browse chapters across all series for editorial review.")
  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-wrap gap-sm">
          <MFBadge tone="primary" size="md">Editor</MFBadge>
          <MFBadge tone="success" size="md">Chapters view</MFBadge>
        </div>
        <h1 className="mt-md text-headline-lg text-on-surface">Chapter overview</h1>
        <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
          Browse all series chapters for editorial production review. Chapter readiness checks and publication scheduling are owned by backend services.
        </p>
      </MFCard>
      <SeriesPage />
    </PageShell>
  )
}