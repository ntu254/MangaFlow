import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
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

interface ChapterRow { id: string; title: string; status: string; progress: string; updatedAt: string }
interface PagePreview { id: string; pageNumber: number; status: string; label: string }

const CHAPTER_READY_STATUSES = new Set(["APPROVED", "ONGOING", "AT_RISK"])

const seriesDetailActions: ActionItem[] = [
  { id: "series-action-1", title: "Manuscript workflow pending", description: "Upload and proposal review API remain future stories.", metadata: "No upload request", icon: "rate_review", status: "TODO" },
  { id: "series-action-2", title: "Chapter creation remains gated", description: "Backend Board approval is the source of truth.", metadata: "Gate display only", icon: "lock", status: "REVISION_REQUESTED" },
]

const chapterRows: ChapterRow[] = []
const pagePreviews: PagePreview[] = [
  { id: "page-11", pageNumber: 11, status: "UPLOADED", label: "Context sample" },
  { id: "page-12", pageNumber: 12, status: "IN_PROGRESS", label: "Assigned sample" },
  { id: "page-13", pageNumber: 13, status: "UPLOADED", label: "Context sample" },
]

const chapterColumns: MFTableColumn<ChapterRow>[] = [
  { id: "chapter", header: "Chapter", cell: (chapter) => <div className="min-w-0"><p className="break-words text-label-md text-on-surface">{chapter.title}</p><p className="mt-xs text-label-sm text-on-surface-muted">Backend chapter query pending</p></div> },
  { id: "status", header: "Status", cell: (chapter) => <StatusBadge status={chapter.status} mapping={chapterStatusUI} /> },
  { id: "progress", header: "Progress", cell: (chapter) => chapter.progress },
  { id: "updated", header: "Updated", cell: (chapter) => chapter.updatedAt },
]

function SeriesDetailStatePreview() {
  return (
    <MFCard>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <h2 className="text-title-lg text-on-surface">Series detail boundaries</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">Live Series loads, but manuscript, chapter, and page APIs remain separate stories.</p>
        </div>
        <MFBadge tone="warning" size="md">Partial API</MFBadge>
      </div>
      <div className="mt-lg grid gap-md xl:grid-cols-4">
        <div className="rounded-3xl bg-surface-low p-lg" aria-label="Loading series detail preview"><MFSkeleton className="h-4 w-36" /><div className="mt-md space-y-sm"><MFSkeleton className="h-3 w-full" /><MFSkeleton className="h-3 w-2/3" /><MFSkeleton className="h-3 w-1/2" /></div><p className="mt-md text-label-sm text-on-surface-muted">Loading state</p></div>
        <MFEmptyState icon="auto_stories" title="No chapters yet" description="Approved Series can remain empty until chapter workflow creates records." />
        <MFErrorState title="Could not load Series" description="Query failures show safe recoverable copy." onRetry={() => undefined} />
        <div className="rounded-3xl bg-surface-low p-lg"><div className="flex flex-wrap gap-sm"><StatusBadge status="UPLOADED" mapping={pageStatusUI} /><StatusBadge status="IN_PROGRESS" mapping={pageStatusUI} /><StatusBadge status="APPROVED" mapping={pageStatusUI} /></div><p className="mt-md text-body-md text-on-surface">Statuses remain text-visible and do not rely on color alone.</p></div>
      </div>
    </MFCard>
  )
}

export function SeriesDetailPage() {
  const { id } = useParams()
  const [selectedManuscripts, setSelectedManuscripts] = useState<string[]>([])
  const { data: series, isLoading, isError, refetch } = useQuery({
    queryKey: ["series", id],
    queryFn: async () => {
      const res = await getSeries(id ?? "")
      if (!res.success || !res.data) throw new Error(res.message ?? "Could not load Series")
      return res.data
    },
    enabled: Boolean(id),
  })

  usePageTitle("Series Detail", "Review live Series details and disconnected workflow surfaces.")

  if (isLoading) {
    return <PageShell><MFCard><MFSkeleton className="h-40 w-full" /></MFCard></PageShell>
  }

  if (isError || !series) {
    return <PageShell><MFErrorState title="Could not load Series" description="Check route id, API, or access permission." onRetry={() => void refetch()} /></PageShell>
  }

  const canCreateChapter = CHAPTER_READY_STATUSES.has(series.status)

  return (
    <PageShell>
      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_22rem]">
        <MFCard padding="lg" className="rounded-3xl">
          <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-sm"><MFBadge tone="primary" size="md">Series Detail</MFBadge><MFBadge tone="success" size="md">Live API</MFBadge></div>
              <h1 className="mt-md break-words text-headline-lg text-on-surface">{series.title}</h1>
              <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">Persisted Series detail loaded from backend. Chapter creation still requires backend Board approval gate.</p>
            </div>
            <MFBadge tone={canCreateChapter ? "success" : "warning"} size="md">{canCreateChapter ? "Chapter gate open" : "Chapter gate blocked"}</MFBadge>
          </div>
        </MFCard>
        <MFCard><h2 className="text-title-lg text-on-surface">Route boundary</h2><p className="mt-sm text-body-md text-on-surface-muted">Route id <span className="font-semibold text-on-surface">{id}</span> queries only Series detail. No protected artwork is fetched.</p></MFCard>
      </section>

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-lg">
          <SeriesSummaryCard title={series.title} status={series.status} genre={series.genres.length > 0 ? series.genres.join(", ") : "Unclassified"} publicationType="Not supplied yet" description={series.synopsis} ownerLabel="Series owner" metadata={[`Slug: ${series.slug}`, `Created: ${new Date(series.createdAt).toLocaleDateString()}`]} />
          <ChapterCreationGateCard seriesTitle={series.title} canCreateChapter={canCreateChapter} reason="Chapter creation is blocked unless backend reports APPROVED, ONGOING, or AT_RISK." />
          <div><h2 className="mb-md text-title-lg text-on-surface">Chapter progress</h2><div className="grid gap-lg lg:grid-cols-2"><ChapterProgressCard title="Chapter workflow pending" status="TODO" completed={0} total={0} description="Chapter rows will appear after chapter query integration." /></div></div>
        </div>

        <div className="space-y-lg">
          <ManuscriptUploadPanel title="Manuscript upload boundary" description="Local file selection preview. No storage request, signed URL, or manuscript submission is sent." constraints={["Original file storage is backend-owned and not connected here.", "Signed URL access remains out of scope for this story.", "Selected filenames below are browser-local only."]} accept=".pdf,.zip,.jpg,.jpeg,.png" multiple onFilesSelected={(files) => setSelectedManuscripts(Array.from(files, (file) => file.name))} />
          {selectedManuscripts.length > 0 ? <MFCard><h2 className="text-title-lg text-on-surface">Selected locally</h2><ul className="mt-lg list-disc space-y-xs pl-lg text-body-md text-on-surface-muted">{selectedManuscripts.map((fileName) => <li key={fileName} className="break-words">{fileName}</li>)}</ul></MFCard> : null}
          <div><h2 className="mb-md text-title-lg text-on-surface">Pending actions</h2><ActionItemList items={seriesDetailActions} statusMapping={taskStatusUI} /></div>
        </div>
      </section>

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div><h2 className="mb-md text-title-lg text-on-surface">Chapter list</h2><MFTable caption="Series chapter list" rows={chapterRows} columns={chapterColumns} getRowKey={(chapter) => chapter.id} emptyTitle="No chapters for this Series" emptyDescription="Chapter rows will appear when approved Series and backend chapter query are connected." /></div>
        <MFCard><h2 className="text-title-lg text-on-surface">Page preview sample</h2><p className="mt-xs text-body-md text-on-surface-muted">Preview cards are local placeholders and do not fetch protected artwork.</p><div className="mt-lg grid grid-cols-3 gap-md">{pagePreviews.map((page) => <div key={page.id} className="min-w-0"><MFPagePreviewCard pageNumber={page.pageNumber} status={page.status} isSelected={page.pageNumber === 12} /><p className="mt-sm break-words text-center text-label-sm text-on-surface-muted">{page.label}</p></div>)}</div></MFCard>
      </section>

      <SeriesDetailStatePreview />
    </PageShell>
  )
}
