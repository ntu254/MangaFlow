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
import { MFBadge, MFButton, MFCard, MFTable, type MFTableColumn } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { chapterStatusUI, taskStatusUI } from "@/shared/lib/status-ui"
import { listChaptersBySeries, type Chapter } from "@/features/chapter/api/chapter.api"
import { getSeries } from "../api/series.api"
import type { Series } from "../api/series.types"

interface ChapterRow {
  id: string
  title: string
  number: string
  status: string
  schedule: string
  updatedAt: string
}

const CHAPTER_READY_STATUSES = new Set(["APPROVED", "ONGOING", "AT_RISK"])

const seriesDetailActions: ActionItem[] = [
  { id: "series-action-1", title: "Chapter list connected", description: "Series Detail now loads live chapter rows from the backend.", metadata: "GET /api/chapters/series/:seriesId", icon: "menu_book", status: "IN_PROGRESS" },
  { id: "series-action-2", title: "Chapter creation remains gated", description: "Backend Board approval remains the source of truth.", metadata: "No chapter mutation here", icon: "lock", status: "REVISION_REQUESTED" },
]

const chapterColumns: MFTableColumn<ChapterRow>[] = [
  { id: "chapter", header: "Chapter", cell: (chapter) => <div><p className="break-words text-label-md text-on-surface">{chapter.title}</p><p className="mt-xs text-label-sm text-on-surface-muted">{chapter.number}</p></div> },
  { id: "status", header: "Status", cell: (chapter) => <StatusBadge status={chapter.status} mapping={chapterStatusUI} /> },
  { id: "schedule", header: "Schedule", cell: (chapter) => chapter.schedule },
  { id: "updated", header: "Updated", cell: (chapter) => chapter.updatedAt },
]

function chapterId(chapter: Chapter) {
  return chapter.id ?? chapter._id ?? `${chapter.seriesId}-${chapter.chapterNumber}`
}

function toChapterRows(chapters: Chapter[]): ChapterRow[] {
  return chapters.map((chapter) => ({
    id: chapterId(chapter),
    title: chapter.title,
    number: `Chapter ${chapter.chapterNumber}`,
    status: chapter.status,
    schedule: chapter.draftSchedule ? new Date(chapter.draftSchedule).toLocaleDateString() : "Not scheduled",
    updatedAt: new Date(chapter.updatedAt).toLocaleDateString(),
  }))
}

export function SeriesDetailPage() {
  const { id } = useParams()
  const [series, setSeries] = useState<Series | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedManuscripts, setSelectedManuscripts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [chapterLoading, setChapterLoading] = useState(true)
  const [chapterError, setChapterError] = useState("")
  const [error, setError] = useState("")

  usePageTitle("Series Detail", "Review Series details loaded from the backend.")

  async function loadSeries() {
    if (!id) {
      setError("Missing Series id.")
      setLoading(false)
      setChapterLoading(false)
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

  async function loadChapters() {
    if (!id) {
      setChapterLoading(false)
      return
    }

    setChapterLoading(true)
    setChapterError("")
    try {
      const response = await listChaptersBySeries(id)
      if (!response.success || !response.data) {
        setChapterError(response.message ?? "Could not load chapters.")
        setChapters([])
        return
      }
      setChapters(response.data)
    } catch {
      setChapterError("Could not reach MangaFlow chapters API.")
      setChapters([])
    } finally {
      setChapterLoading(false)
    }
  }

  useEffect(() => {
    void loadSeries()
    void loadChapters()
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
  const chapterRows = toChapterRows(chapters)

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
            actionLabel={canCreateChapter ? "Backend gate ready" : "Create chapter blocked"}
          />

          <div>
            <h2 className="mb-md text-title-lg text-on-surface">Chapter progress</h2>
            <ChapterProgressCard
              title="Live chapters"
              status={chapters.length > 0 ? "IN_PRODUCTION" : "DRAFT"}
              completed={chapters.length}
              total={chapters.length}
              progressLabel="Chapters loaded"
              description="Chapter records are loaded from the backend. Page-level progress remains a later page API slice."
            />
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
          <div className="mb-md flex flex-wrap items-center justify-between gap-md">
            <h2 className="text-title-lg text-on-surface">Chapter list</h2>
            <MFBadge tone="success" size="md">API connected</MFBadge>
          </div>
          {chapterError ? (
            <MFErrorState
              title="Could not load chapters"
              description={chapterError}
              onRetry={() => void loadChapters()}
            />
          ) : (
            <MFTable
              caption="Series chapter list"
              rows={chapterRows}
              columns={chapterColumns}
              getRowKey={(chapter) => chapter.id}
              loading={chapterLoading}
              emptyTitle="No chapters for this Series"
              emptyDescription="Chapters appear here after backend chapter creation succeeds for an approved, ongoing, or at-risk Series."
            />
          )}
        </div>

        <MFCard>
          <h2 className="text-title-lg text-on-surface">Page preview boundary</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">This slice reads chapter metadata only. Protected page artwork still requires page APIs and signed file access.</p>
          <div className="mt-lg rounded-3xl bg-surface-low p-lg">
            <MFEmptyState
              icon="image"
              title="Page previews not connected"
              description="Page thumbnails will appear only after the protected page workspace and signed URL flow are wired."
            />
          </div>
          <div className="mt-md">
            <MFButton type="button" variant="outline" size="sm" disabled>
              Page API pending
            </MFButton>
          </div>
        </MFCard>
      </section>
    </PageShell>
  )
}
