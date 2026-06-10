import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { SeriesPage } from "@/features/series/pages/SeriesPage"

export function MangakaChaptersPage() {
  usePageTitle("My Chapters", "Browse and manage chapters across your active series.")
  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-wrap gap-sm">
          <MFBadge tone="primary" size="md">Mangaka</MFBadge>
          <MFBadge tone="success" size="md">Chapters view</MFBadge>
        </div>
        <h1 className="mt-md text-headline-lg text-on-surface">My chapters</h1>
        <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
          Browse your series and drill into chapter production. The chapter creation gate enforces backend rules: chapter creation is only allowed after series approval.
        </p>
      </MFCard>
      <SeriesPage />
    </PageShell>
  )
}