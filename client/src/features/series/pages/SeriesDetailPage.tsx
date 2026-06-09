import { MFBadge, MFCard } from "@/shared/components/ui"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"
import { PageShell } from "@/shared/components/layout/PageShell"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { ChapterListPanel, PagePreviewBoundaryPanel, SeriesOverviewPanel } from "../components/SeriesDetailPanels"
import { useSeriesDetail } from "../hooks/useSeriesDetail"

export function SeriesDetailPage() {
  const seriesDetail = useSeriesDetail()
  usePageTitle("Series Detail", "Review Series details loaded from the backend.")

  if (seriesDetail.loading) {
    return <PageShell><MFCard><MFSkeleton className="h-56 w-full" /></MFCard></PageShell>
  }

  if (seriesDetail.error) {
    return <PageShell><MFErrorState title="Could not load Series" description={seriesDetail.error} onRetry={seriesDetail.loadSeries} /></PageShell>
  }

  if (!seriesDetail.series) {
    return <PageShell><MFEmptyState icon="auto_stories" title="Series not found" description="This Series is unavailable or outside your access scope." /></PageShell>
  }

  return (
    <PageShell>
      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_22rem]">
        <MFCard padding="lg" className="rounded-3xl"><div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-sm"><MFBadge tone="primary" size="md">Series Detail</MFBadge><MFBadge tone="success" size="md">API connected</MFBadge></div><h1 className="mt-md break-words text-headline-lg text-on-surface">{seriesDetail.series.title}</h1><p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">{seriesDetail.series.synopsis}</p></div></div></MFCard>
        <MFCard><h2 className="text-title-lg text-on-surface">Route boundary</h2><p className="mt-sm text-body-md text-on-surface-muted">Route id <span className="font-semibold text-on-surface">{seriesDetail.id}</span> is fetched through backend authorization.</p></MFCard>
      </section>

      <SeriesOverviewPanel series={seriesDetail.series} canCreateChapter={seriesDetail.canCreateChapter} selectedManuscripts={seriesDetail.selectedManuscripts} setSelectedManuscripts={seriesDetail.setSelectedManuscripts} chaptersCount={seriesDetail.chapters.length} />

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ChapterListPanel chapterError={seriesDetail.chapterError} chapterLoading={seriesDetail.chapterLoading} chapterRows={seriesDetail.chapterRows} loadChapters={seriesDetail.loadChapters} />
        <PagePreviewBoundaryPanel />
      </section>
    </PageShell>
  )
}
