import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import {
  ActionItemList,
  ChapterProgressCard,
  CommentThread,
  ContextPageList,
  PublicationReadinessChecklist,
  StatusBadge,
  SubmissionVersionList,
  TaskScopeCard,
  type ActionItem,
  type CommentThreadItem,
  type ContextPageItem,
  type PublicationReadinessItem,
  type SubmissionVersionItem,
} from "@/shared/components/domain"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"
import { PageShell } from "@/shared/components/layout/PageShell"
import {
  MFBadge,
  MFButton,
  MFCard,
  MFPagePreviewCard,
  MFTable,
  MFTabs,
  type MFTableColumn,
} from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import {
  chapterStatusUI,
  pageStatusUI,
  submissionStatusUI,
  taskStatusUI,
} from "@/shared/lib/status-ui"
import { getChapterReadiness, listPagesByChapter, type Page } from "../api/chapter.api"
import { createPublication, publishPublication, schedulePublication } from "../api/publication.api"

interface PageRow {
  id: string
  pageNumber: number
  status: string
  file: string
  regions: string
  updatedAt: string
}

const chapterActions: ActionItem[] = [
  {
    id: "chapter-action-1",
    title: "Page 12 task needs Mangaka review",
    description: "Assistant submission is still represented as local sample data.",
    metadata: "Submission/comment write flows remain separate stories",
    icon: "rate_review",
    status: "SUBMITTED",
  },
  {
    id: "chapter-action-2",
    title: "Readiness and publish flow are backend-owned",
    description: "This tab now calls readiness and publication APIs when a real chapter id is available.",
    metadata: "Page list and review list remain presentation-only",
    icon: "fact_check",
    status: "EDITOR_APPROVED",
  },
]

const contextPages: ContextPageItem[] = [
  { id: "context-11", pageNumber: 11, status: "APPROVED", label: "Previous page" },
  { id: "context-12", pageNumber: 12, status: "SUBMITTED", label: "Selected page" },
  { id: "context-13", pageNumber: 13, status: "IN_PROGRESS", label: "Next page" },
]

const comments: CommentThreadItem[] = [
  { id: "chapter-comment-1", authorName: "Rin Sato", authorRole: "Tantou Editor", body: "Keep the rain texture lighter near the speech bubble before final readiness.", status: "OPEN", createdAt: "Today 10:20", targetLabel: "Chapter 08 - Page 12", isUnresolved: true },
  { id: "chapter-comment-2", authorName: "Mika Tan", authorRole: "Mangaka", body: "Panel timing is approved for the opening sequence.", status: "RESOLVED_BY_EDITOR", createdAt: "Yesterday 17:30", targetLabel: "Chapter 08 - Page 11" },
]

const fallbackReadinessItems: PublicationReadinessItem[] = [
  { id: "all-pages-uploaded", label: "All pages uploaded", passed: true, description: "Fallback sample only when chapter readiness API is unavailable." },
  { id: "tasks-approved", label: "All tasks approved", passed: false, description: "Fallback sample says one task remains submitted." },
  { id: "comments-resolved", label: "Comments resolved by Editor", passed: false, description: "Fallback sample says one comment still blocks readiness." },
  { id: "publication-schedule", label: "Publication schedule selected", passed: true, description: "Fallback sample only." },
]

const submissionVersions: SubmissionVersionItem[] = [
  { id: "submission-v2", label: "Page 12 tone pass v2", submittedBy: "Assistant view", submittedAt: "Today 13:15", status: "SUBMITTED", summary: "Latest sample submission for review presentation.", fileName: "chapter-08-page-12-tone-v2.psd", isCurrent: true },
  { id: "submission-v1", label: "Page 12 tone pass v1", submittedBy: "Assistant view", submittedAt: "Yesterday 16:40", status: "REVISION_REQUESTED", summary: "Previous version retained to show non-overwrite history.", fileName: "chapter-08-page-12-tone-v1.psd" },
]

const pageColumns: MFTableColumn<PageRow>[] = [
  { id: "page", header: "Page", cell: (page) => <div className="min-w-0"><p className="text-label-md text-on-surface">Page {page.pageNumber}</p><p className="mt-xs text-label-sm text-on-surface-muted">Backend metadata</p></div> },
  { id: "page-status", header: "Page status", cell: (page) => <StatusBadge status={page.status} mapping={pageStatusUI} /> },
  { id: "file", header: "File", cell: (page) => page.file },
  { id: "regions", header: "Regions", cell: (page) => page.regions },
  { id: "updated", header: "Updated", cell: (page) => page.updatedAt },
]

function pageId(page: Page) {
  return page.id ?? page._id ?? `${page.chapterId}-${page.pageNumber}`
}

function toPageRows(pages: Page[]): PageRow[] {
  return pages.map((page) => ({
    id: pageId(page),
    pageNumber: page.pageNumber,
    status: page.status,
    file: page.originalFileAssetId ? "Uploaded file linked" : "No file linked",
    regions: `${page.regionIds?.length ?? 0} region(s)`,
    updatedAt: new Date(page.updatedAt).toLocaleDateString(),
  }))
}

function ChapterDetailStatePreview() {
  return (
    <MFCard>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <h2 className="text-title-lg text-on-surface">Chapter detail states</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">UI previews for loading, empty, error, submitted, blocked, and approved states.</p>
        </div>
        <MFBadge tone="success" size="md">Partial API</MFBadge>
      </div>
      <div className="mt-lg grid gap-md xl:grid-cols-4">
        <div className="rounded-3xl bg-surface-low p-lg" aria-label="Loading chapter detail preview"><MFSkeleton className="h-4 w-36" /><div className="mt-md space-y-sm"><MFSkeleton className="h-3 w-full" /><MFSkeleton className="h-3 w-2/3" /><MFSkeleton className="h-3 w-1/2" /></div><p className="mt-md text-label-sm text-on-surface-muted">Loading preview</p></div>
        <MFEmptyState icon="collections_bookmark" title="No pages yet" description="Page records will appear after a backend chapter query is connected." />
        <MFErrorState title="Could not load Chapter" description="Future query failures should stay recoverable and avoid raw stack traces." onRetry={() => undefined} />
        <div className="rounded-3xl bg-surface-low p-lg"><div className="flex flex-wrap gap-sm"><StatusBadge status="IN_PRODUCTION" mapping={chapterStatusUI} /><StatusBadge status="SUBMITTED" mapping={submissionStatusUI} /><StatusBadge status="APPROVED" mapping={pageStatusUI} /></div><p className="mt-md text-body-md text-on-surface">Status labels stay visible in text and do not rely on color alone.</p></div>
      </div>
    </MFCard>
  )
}

export function ChapterDetailPage() {
  const { id } = useParams()
  const chapterId = id ?? ""
  const [activeTab, setActiveTab] = useState("pages")
  const [pages, setPages] = useState<Page[]>([])
  const [pagesLoading, setPagesLoading] = useState(Boolean(chapterId))
  const [pagesError, setPagesError] = useState("")
  const [readinessItems, setReadinessItems] = useState<PublicationReadinessItem[]>(fallbackReadinessItems)
  const [readinessLoading, setReadinessLoading] = useState(false)
  const [readinessMessage, setReadinessMessage] = useState("Readiness will load from backend when a real chapter id is available.")
  const [publicationId, setPublicationId] = useState("")
  const [scheduleInput, setScheduleInput] = useState("2026-06-24T00:00:00.000Z")
  const [publicationMessage, setPublicationMessage] = useState("No publication API action run yet.")

  usePageTitle("Chapter Detail", "Review chapter production, page status, task context, and readiness presentation.")

  async function loadPages() {
    if (!chapterId) {
      setPagesLoading(false)
      return
    }

    setPagesLoading(true)
    setPagesError("")
    try {
      const response = await listPagesByChapter(chapterId)
      if (!response.success || !response.data) {
        setPagesError(response.message ?? "Could not load pages.")
        setPages([])
        return
      }
      setPages(response.data)
    } catch {
      setPagesError("Could not reach MangaFlow pages API.")
      setPages([])
    } finally {
      setPagesLoading(false)
    }
  }

  async function loadReadiness() {
    if (!chapterId) return
    setReadinessLoading(true)
    const response = await getChapterReadiness(chapterId)
    if (!response.success || !response.data) {
      setReadinessMessage(response.message ?? "Could not load readiness.")
      setReadinessItems(fallbackReadinessItems)
    } else {
      setReadinessItems(response.data.items.map((item) => ({ id: item.key, label: item.key, passed: item.passed, description: item.reason })))
      setReadinessMessage(response.data.ready ? "Backend says this chapter is ready for publication." : "Backend says this chapter is still blocked for publication.")
    }
    setReadinessLoading(false)
  }

  useEffect(() => {
    void loadPages()
  }, [chapterId])

  useEffect(() => {
    if (activeTab === "readiness") {
      void loadReadiness()
    }
  }, [activeTab, chapterId])

  async function handleCreatePublication() {
    if (!chapterId) return
    const response = await createPublication(chapterId, scheduleInput)
    if (!response.success || !response.data) {
      setPublicationMessage(response.message ?? "Could not create publication.")
      return
    }
    setPublicationId(response.data.id)
    setPublicationMessage("Publication record created via backend.")
    await loadReadiness()
  }

  async function handleSchedulePublication() {
    if (!publicationId) {
      setPublicationMessage("Create a publication record first.")
      return
    }
    const response = await schedulePublication(publicationId, scheduleInput)
    setPublicationMessage(response.success ? "Publication schedule updated via backend." : response.message ?? "Could not schedule publication.")
    await loadReadiness()
  }

  async function handlePublishPublication() {
    if (!publicationId) {
      setPublicationMessage("Create a publication record first.")
      return
    }
    const response = await publishPublication(publicationId)
    setPublicationMessage(response.success ? "Chapter published through backend publication flow." : response.message ?? "Could not publish chapter.")
    await loadReadiness()
  }

  const readinessSummaryTone = useMemo(() => readinessItems.every((item) => item.passed) ? "success" : "warning", [readinessItems])
  const pageRows = useMemo(() => toPageRows(pages), [pages])
  const selectedPage = pages[0] ?? null

  return (
    <PageShell>
      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_22rem]">
        <MFCard padding="lg" className="rounded-3xl">
          <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-sm"><MFBadge tone="primary" size="md">Chapter Detail</MFBadge><MFBadge tone="success" size="md">Page metadata API connected</MFBadge><MFBadge tone="success" size="md">Readiness API connected</MFBadge></div>
              <h1 className="mt-md break-words text-headline-lg text-on-surface">Chapter 08 - Lantern Rain</h1>
              <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">This route loads page metadata, readiness, and publication actions from backend APIs when a real chapter id is available. Task/review/context panels remain local samples.</p>
            </div>
            <MFButton type="button" disabled>Upload pages disabled</MFButton>
          </div>
        </MFCard>
        <MFCard><h2 className="text-title-lg text-on-surface">Route boundary</h2><p className="mt-sm text-body-md text-on-surface-muted">Route id <span className="font-semibold text-on-surface">{id ?? "sample"}</span> drives page metadata, readiness, and publication API calls. Protected artwork and signed file URLs are not fetched here.</p></MFCard>
      </section>

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-lg">
          <ChapterProgressCard title="Chapter 08 - Lantern Rain" status="IN_PRODUCTION" completed={pages.length} total={pages.length} description="Page count comes from backend metadata. Task progress remains local until task APIs are wired." progressLabel="Pages loaded" />
          <MFCard><div className="flex flex-wrap items-start justify-between gap-md"><div><h2 className="text-title-lg text-on-surface">Chapter metadata</h2><p className="mt-xs text-body-md text-on-surface-muted">Parent Series and schedule labels are sample values only.</p></div><StatusBadge status="IN_PRODUCTION" mapping={chapterStatusUI} size="md" /></div><dl className="mt-lg grid gap-md sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl bg-surface-low p-md"><dt className="text-label-sm text-on-surface-muted">Series</dt><dd className="mt-xs text-label-md text-on-surface">Moonlit Atelier</dd></div><div className="rounded-xl bg-surface-low p-md"><dt className="text-label-sm text-on-surface-muted">Chapter number</dt><dd className="mt-xs text-label-md text-on-surface">08</dd></div><div className="rounded-xl bg-surface-low p-md"><dt className="text-label-sm text-on-surface-muted">Draft schedule</dt><dd className="mt-xs text-label-md text-on-surface">June 24, 2026</dd></div><div className="rounded-xl bg-surface-low p-md"><dt className="text-label-sm text-on-surface-muted">Access boundary</dt><dd className="mt-xs text-label-md text-on-surface">Mangaka / Editor view</dd></div></dl></MFCard>
        </div>

        <div className="space-y-lg">
          <TaskScopeCard title="Featured page task" status="SUBMITTED" scopeType="page" scopeLabel="Chapter 08 - Page 12" description="Sample task scope. Assistant task workspace remains separate from full chapter access." dueDateLabel="June 14, 2026" priority="HIGH" assignedToLabel="Assistant view" taskTypeLabel="Tone cleanup" />
          <div><h2 className="mb-md text-title-lg text-on-surface">Pending actions</h2><ActionItemList items={chapterActions} statusMapping={taskStatusUI} /></div>
        </div>
      </section>

      <MFCard><div className="flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-title-lg text-on-surface">Chapter sections</h2><p className="mt-xs text-body-md text-on-surface-muted">Tabs switch chapter panels; pages and readiness are API-backed metadata/actions.</p></div><MFTabs tabs={[{ id: "pages", label: "Pages", count: pageRows.length }, { id: "review", label: "Review", count: comments.length }, { id: "readiness", label: "Readiness", count: readinessItems.length }]} activeTab={activeTab} onTabChange={setActiveTab} /></div></MFCard>

      {activeTab === "pages" ? <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]"><div><div className="mb-md flex flex-wrap items-center justify-between gap-md"><h2 className="text-title-lg text-on-surface">Page list</h2><MFBadge tone="success" size="md">API connected</MFBadge></div>{pagesError ? <MFErrorState title="Could not load pages" description={pagesError} onRetry={() => void loadPages()} /> : <MFTable caption="Chapter page list" rows={pageRows} columns={pageColumns} getRowKey={(page) => page.id} loading={pagesLoading} emptyTitle="No pages in this chapter" emptyDescription="Pages will appear after backend page creation or upload metadata is available." />}</div><MFCard><h2 className="text-title-lg text-on-surface">Selected page metadata</h2><p className="mt-xs text-body-md text-on-surface-muted">This card uses live page number/status only. It does not fetch protected artwork or signed URLs.</p><div className="mt-lg">{selectedPage ? <MFPagePreviewCard pageNumber={selectedPage.pageNumber} status={selectedPage.status} isSelected /> : <MFEmptyState icon="image" title="No page selected" description="Live page metadata will appear here after pages exist." />}</div></MFCard></section> : null}

      {activeTab === "review" ? <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]"><div className="space-y-lg"><SubmissionVersionList versions={submissionVersions} description="Version history preview only. Review mutations are reserved for API-backed stories." /><CommentThread comments={comments} description="Comment lifecycle is displayed without mark-fixed, verify, or resolve actions." /></div><ContextPageList pages={contextPages} title="Read-only page context" description="Context pages are local display only and do not imply Assistant full-chapter access." /></section> : null}

      {activeTab === "readiness" ? (
        <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-lg">
            {readinessLoading ? <MFCard><div className="h-48 rounded-3xl bg-surface-low" /></MFCard> : <PublicationReadinessChecklist items={readinessItems} description={readinessMessage} />}
            <MFCard><div className="flex flex-wrap items-start justify-between gap-md"><div><h2 className="text-title-lg text-on-surface">Backend publication actions</h2><p className="mt-xs text-body-md text-on-surface-muted">Scheduling, readiness calculation, and publish calls now go to backend endpoints.</p></div><MFBadge tone={readinessSummaryTone} size="md">API-backed</MFBadge></div><div className="mt-lg space-y-md"><input className="w-full rounded-xl border border-outline-variant bg-surface-lowest px-md py-sm text-body-md" value={scheduleInput} onChange={(event) => setScheduleInput(event.target.value)} /><div className="flex flex-wrap gap-sm"><MFButton type="button" size="sm" onClick={() => void handleCreatePublication()}>Create publication</MFButton><MFButton type="button" variant="outline" size="sm" onClick={() => void handleSchedulePublication()}>Update schedule</MFButton><MFButton type="button" variant="outline" size="sm" onClick={() => void handlePublishPublication()}>Publish chapter</MFButton></div><p className="rounded-2xl bg-surface-low p-md text-body-md text-on-surface">{publicationMessage}</p></div></MFCard>
          </div>
          <MFCard><h2 className="text-title-lg text-on-surface">Publication boundary</h2><p className="mt-xs text-body-md text-on-surface-muted">Backend still owns readiness rules and publish permission checks. This UI only calls explicit endpoints and renders their result.</p><div className="mt-lg flex flex-wrap gap-sm"><MFBadge tone="warning" size="md">Needs real chapter id</MFBadge><MFBadge tone="neutral" size="md">No local readiness math</MFBadge></div></MFCard>
        </section>
      ) : null}

      <ChapterDetailStatePreview />
    </PageShell>
  )
}
