import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import {
  ActionItemList,
  ChapterCreationGateCard,
  ChapterProgressCard,
  ManuscriptUploadPanel,
  SeriesSummaryCard,
  StatusBadge,
  type ActionItem,
} from "@/shared/components/domain"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard, MFPagePreviewCard, MFTable, type MFTableColumn } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { chapterStatusUI, pageStatusUI, taskStatusUI } from "@/shared/lib/status-ui"
import { getSeries } from "../api/series.api"
import type { Series } from "../api/series.types"

interface ChapterRow { id: string; title: string; status: string; progress: string; updatedAt: string }
interface PagePreview { id: string; pageNumber: number; status: string; label: string }

const CHAPTER_READY_STATUSES = new Set(["APPROVED", "ONGOING", "AT_RISK"])

const seriesDetailActions: ActionItem[] = [
  { id: "series-action-1", title: "Manuscript workflow pending", description: "Manuscript upload/review API is not connected in this story.", metadata: "Boundary documented", icon: "rate_review", status: "TODO" },
  { id: "series-action-2", title: "Chapter creation remains gated", description: "Backend Board approval remains the source of truth.", metadata: "No chapter mutation here", icon: "lock", status: "REVISION_REQUESTED" },
]

const chapterRows: ChapterRow[] = [
  { id: "chapter-placeholder", title: "No live chapters connected", status: "TODO", progress: "0 of 0 pages", updatedAt: "Pending API" },
]

const pagePreviews: PagePreview[] = [
  { id: "page-1", pageNumber: 1, status: "UPLOADED", label: "Placeholder" },
  { id: "page-2", pageNumber: 2, status: "IN_PROGRESS", label: "Placeholder" },
  { id: "page-3", pageNumber: 3, status: "APPROVED", label: "Placeholder" },
]

const chapterColumns: MFTableColumn<ChapterRow>[] = [
  { id: "chapter", header: "Chapter", cell: (chapter) => <div><p className="text-label-md text-on-surface">{chapter.title}</p><p className="mt-xs text-label-sm text-on-surface-muted">Chapter API not connected</p></div> },
  { id: "status", header: "Status", cell: (chapter) => <StatusBadge status={chapter.status} mapping={chapterStatusUI} /> },
  { id: "progress", header: "Progress", cell: (chapter) => chapter.progress },
  { id: "updated", header: "Updated", cell: (chapter) => chapter.updatedAt },
]

export function SeriesDetailPage() {
  const { id } = useParams()
  const [series, setSeries] = useState<Series | null>(null)
  const [selectedManuscripts, setSelectedManuscripts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  usePageTitle("Series Detail", "Review Series details loaded from the backend.")

  async function loadSeries() {
    if (!id) {
      setError("Missing Series id.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    try {
      const response = await getSeries(id)
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not load Series.")
        setSeries(null)
        return
      }
      setSeries(response.data)
    } catch {
      setError("Could not reach MangaFlow. Check the API server and try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSeries()
  }, [id])

  if (loading) {
    return <PageShell><MFCard><MFSkeleton className="h-56 w-full" /></MFCard></PageShell>
  }

  if (error) {
    return <PageShell><MFErrorState title="Could not load Series" description={error} onRetry={loadSeries} /></PageShell>
  }

  if (!series) {
    return <PageShell><MFEmptyState icon="auto_stories" title="Series not found" description="This Series is unavailable or outside your access scope." /></PageShell>
  }

  const canCreateChapter = CHAPTER_READY_STATUSES.has(series.status)

  return (
    <PageShell>
      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_22rem]">
        <MFCard padding="lg" className="rounded-3xl">
          <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-sm">
                <MFBadge tone="primary" size="md">Series Detail</MFBadge>
                <MFBadge tone="success" size="md">API connected</MFBadge>
              </div>
              <h1 className="mt-md break-words text-headline-lg text-on-surface">{series.title}</h1>
              <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">{series.synopsis}</p>
            </div>
          </div>
        </MFCard>

        <MFCard>
          <h2 className="text-title-lg text-on-surface">Route boundary</h2>
          <p className="mt-sm text-body-md text-on-surface-muted">Route id <span className="font-semibold text-on-surface">{id}</span> is fetched through backend authorization.</p>
        </MFCard>
      </section>

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-lg">
          <SeriesSummaryCard
            title={series.title}
            status={series.status}
            genre={series.genres.length > 0 ? series.genres.join(", ") : "Unclassified"}
            publicationType="Not supplied yet"
            description={series.synopsis}
            ownerLabel="Series owner"
            metadata={[`Slug: ${series.slug}`, `Updated: ${new Date(series.updatedAt).toLocaleDateString()}`]}
          />

          <ChapterCreationGateCard
            seriesTitle={series.title}
            canCreateChapter={canCreateChapter}
            reason="Chapter creation is allowed only after backend status is APPROVED, ONGOING, or AT_RISK."
          />

          <div>
            <h2 className="mb-md text-title-lg text-on-surface">Chapter progress</h2>
            <ChapterProgressCard title="Chapter API pending" status="TODO" completed={0} total={0} description="Live chapter rows will appear in a later story." />
          </div>
        </div>

        <div className="space-y-lg">
          <ManuscriptUploadPanel
            title="Manuscript upload boundary"
            description="Local file selection preview. No storage request, signed URL, or manuscript submission is sent."
            constraints={["Original file storage is backend-owned and not connected here.", "Signed URL access remains out of scope for this story.", "Selected filenames below are browser-local only."]}
            accept=".pdf,.zip,.jpg,.jpeg,.png"
            multiple
            onFilesSelected={(files) => setSelectedManuscripts(Array.from(files, (file) => file.name))}
          />

          {selectedManuscripts.length > 0 ? (
            <MFCard>
              <h2 className="text-title-lg text-on-surface">Selected locally</h2>
              <ul className="mt-lg list-disc space-y-xs pl-lg text-body-md text-on-surface-muted">
                {selectedManuscripts.map((fileName) => <li key={fileName} className="break-words">{fileName}</li>)}
              </ul>
            </MFCard>
          ) : null}

          <div>
            <h2 className="mb-md text-title-lg text-on-surface">Pending actions</h2>
            <ActionItemList items={seriesDetailActions} statusMapping={taskStatusUI} />
          </div>
        </div>
      </section>

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div>
          <h2 className="mb-md text-title-lg text-on-surface">Chapter list</h2>
          <MFTable caption="Series chapter list" rows={chapterRows} columns={chapterColumns} getRowKey={(chapter) => chapter.id} emptyTitle="No chapters for this Series" emptyDescription="Chapter rows will appear when backend chapter query is connected." />
        </div>

        <MFCard>
          <h2 className="text-title-lg text-on-surface">Page preview boundary</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">Preview cards are placeholders and do not fetch protected artwork.</p>
          <div className="mt-lg grid grid-cols-3 gap-md">
            {pagePreviews.map((page) => (
              <div key={page.id} className="min-w-0">
                <MFPagePreviewCard pageNumber={page.pageNumber} status={page.status} isSelected={page.pageNumber === 2} />
                <p className="mt-sm break-words text-center text-label-sm text-on-surface-muted">{page.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-md flex flex-wrap gap-sm">
            <StatusBadge status="UPLOADED" mapping={pageStatusUI} />
            <StatusBadge status="IN_PROGRESS" mapping={pageStatusUI} />
            <StatusBadge status="APPROVED" mapping={pageStatusUI} />
          </div>
        </MFCard>
      </section>
    </PageShell>
  )
}
