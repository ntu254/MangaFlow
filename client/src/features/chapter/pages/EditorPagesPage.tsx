import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { SeriesPage } from "@/features/series/pages/SeriesPage"

export function EditorPagesPage() {
  usePageTitle("Pages Review", "Browse chapter pages for editorial production review.")
  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-wrap gap-sm">
          <MFBadge tone="primary" size="md">Editor</MFBadge>
          <MFBadge tone="success" size="md">Pages view</MFBadge>
        </div>
        <h1 className="mt-md text-headline-lg text-on-surface">Pages review</h1>
        <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
          Browse chapter pages for editorial production review. Page status, region assignments, and task progress are backend-verified.
        </p>
      </MFCard>
      <SeriesPage />
    </PageShell>
  )
}