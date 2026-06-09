import {
  ActionItemList,
  CommentThread,
  ContextPageList,
  PublicationReadinessChecklist,
  ChapterProgressCard,
  StatusBadge,
  SubmissionVersionList,
  TaskScopeCard,
  type PublicationReadinessItem,
} from "@/shared/components/domain"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"
import { MFBadge, MFButton, MFCard, MFPagePreviewCard, MFTable, MFTabs } from "@/shared/components/ui"
import { chapterStatusUI, pageStatusUI, submissionStatusUI, taskStatusUI } from "@/shared/lib/status-ui"
import type { Task } from "@/features/task/api/task.api"
import type { Page } from "../api/chapter.api"
import {
  comments,
  contextPages,
  pageColumns,
  submissionVersions,
  taskScopeLabel,
  taskTypeLabel,
  type PageRow,
} from "../utils/chapter-detail.mappers"

export function ChapterDetailStatePreview() {
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
        <div className="rounded-3xl bg-surface-low p-lg" aria-label="Loading chapter detail preview">
          <MFSkeleton className="h-4 w-36" />
          <div className="mt-md space-y-sm"><MFSkeleton className="h-3 w-full" /><MFSkeleton className="h-3 w-2/3" /><MFSkeleton className="h-3 w-1/2" /></div>
          <p className="mt-md text-label-sm text-on-surface-muted">Loading preview</p>
        </div>
        <MFEmptyState icon="collections_bookmark" title="No pages yet" description="Page records will appear after a backend chapter query is connected." />
        <MFErrorState title="Could not load Chapter" description="Future query failures should stay recoverable and avoid raw stack traces." onRetry={() => undefined} />
        <div className="rounded-3xl bg-surface-low p-lg">
          <div className="flex flex-wrap gap-sm"><StatusBadge status="IN_PRODUCTION" mapping={chapterStatusUI} /><StatusBadge status="SUBMITTED" mapping={submissionStatusUI} /><StatusBadge status="APPROVED" mapping={pageStatusUI} /></div>
          <p className="mt-md text-body-md text-on-surface">Status labels stay visible in text and do not rely on color alone.</p>
        </div>
      </div>
    </MFCard>
  )
}

interface ChapterOverviewPanelProps {
  tasks: Task[]
  pagesCount: number
  featuredTask: Task | null
  tasksError: string
  tasksLoading: boolean
  currentChapterId: string
  loadTasks: () => Promise<void>
}

export function ChapterOverviewPanel({ tasks, pagesCount, featuredTask, tasksError, tasksLoading, loadTasks }: ChapterOverviewPanelProps) {
  const chapterActions = tasks.filter((task) => ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED"].includes(task.status)).slice(0, 3).map((task) => ({
    id: task.id ?? task._id ?? `${task.chapterId}-${task.title}`,
    title: task.title,
    description: task.description ?? "Live chapter task from backend metadata.",
    metadata: `${taskScopeLabel(task)} - due ${new Date(task.dueDate).toLocaleDateString()}`,
    icon: task.status === "SUBMITTED" ? "rate_review" : "task",
    status: task.status,
  }))

  return (
    <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-lg">
        <ChapterProgressCard title="Chapter 08 - Lantern Rain" status="IN_PRODUCTION" completed={tasks.filter((task) => task.status === "EDITOR_APPROVED").length} total={tasks.length || pagesCount} description="Page count and chapter task metadata come from backend endpoints. Completion uses task approval count when tasks are available." progressLabel={tasks.length ? "Tasks editor-approved" : "Pages loaded"} />
        <MFCard>
          <div className="flex flex-wrap items-start justify-between gap-md"><div><h2 className="text-title-lg text-on-surface">Chapter metadata</h2><p className="mt-xs text-body-md text-on-surface-muted">Parent Series and schedule labels are sample values only.</p></div><StatusBadge status="IN_PRODUCTION" mapping={chapterStatusUI} size="md" /></div>
          <dl className="mt-lg grid gap-md sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl bg-surface-low p-md"><dt className="text-label-sm text-on-surface-muted">Series</dt><dd className="mt-xs text-label-md text-on-surface">Moonlit Atelier</dd></div><div className="rounded-xl bg-surface-low p-md"><dt className="text-label-sm text-on-surface-muted">Chapter number</dt><dd className="mt-xs text-label-md text-on-surface">08</dd></div><div className="rounded-xl bg-surface-low p-md"><dt className="text-label-sm text-on-surface-muted">Draft schedule</dt><dd className="mt-xs text-label-md text-on-surface">June 24, 2026</dd></div><div className="rounded-xl bg-surface-low p-md"><dt className="text-label-sm text-on-surface-muted">Access boundary</dt><dd className="mt-xs text-label-md text-on-surface">Mangaka / Editor view</dd></div></dl>
        </MFCard>
      </div>
      <div className="space-y-lg">
        {featuredTask ? <TaskScopeCard title={featuredTask.title} status={featuredTask.status} scopeType={featuredTask.regionId ? "region" : "page"} scopeLabel={taskScopeLabel(featuredTask)} description={featuredTask.description ?? "Live chapter task from backend metadata."} dueDateLabel={new Date(featuredTask.dueDate).toLocaleDateString()} priority={featuredTask.priority} assignedToLabel={`Assistant ${String(featuredTask.assignedTo).slice(-6)}`} taskTypeLabel={taskTypeLabel(featuredTask)} /> : <MFEmptyState icon="task" title="No chapter tasks" description="Chapter tasks will appear after the backend returns task metadata for this chapter." />}
        <div><h2 className="mb-md text-title-lg text-on-surface">Pending actions</h2>{tasksError ? <MFErrorState title="Could not load chapter tasks" description={tasksError} onRetry={() => void loadTasks()} /> : <ActionItemList items={chapterActions.length ? chapterActions : [{ id: "chapter-task-empty-action", title: "No live chapter task actions", description: "Task actions will appear after the backend returns active chapter tasks.", metadata: "GET /api/tasks/chapter/:chapterId", icon: "task", status: "TODO" }]} statusMapping={taskStatusUI} />}{tasksLoading ? <p className="mt-sm text-label-sm text-on-surface-muted">Loading chapter tasks...</p> : null}</div>
      </div>
    </section>
  )
}

interface ChapterTabsCardProps { activeTab: string; setActiveTab: (tab: string) => void; pageCount: number; readinessCount: number }
export function ChapterTabsCard({ activeTab, setActiveTab, pageCount, readinessCount }: ChapterTabsCardProps) {
  return <MFCard><div className="flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-title-lg text-on-surface">Chapter sections</h2><p className="mt-xs text-body-md text-on-surface-muted">Tabs switch chapter panels; pages and readiness are API-backed metadata/actions.</p></div><MFTabs tabs={[{ id: "pages", label: "Pages", count: pageCount }, { id: "review", label: "Review", count: comments.length }, { id: "readiness", label: "Readiness", count: readinessCount }]} activeTab={activeTab} onTabChange={setActiveTab} /></div></MFCard>
}

interface ChapterPagesPanelProps { pagesError: string; pagesLoading: boolean; pageRows: PageRow[]; loadPages: () => Promise<void>; selectedPage: Page | null }
export function ChapterPagesPanel({ pagesError, pagesLoading, pageRows, loadPages, selectedPage }: ChapterPagesPanelProps) {
  return <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]"><div><div className="mb-md flex flex-wrap items-center justify-between gap-md"><h2 className="text-title-lg text-on-surface">Page list</h2><MFBadge tone="success" size="md">API connected</MFBadge></div>{pagesError ? <MFErrorState title="Could not load pages" description={pagesError} onRetry={() => void loadPages()} /> : <MFTable caption="Chapter page list" rows={pageRows} columns={pageColumns} getRowKey={(page) => page.id} loading={pagesLoading} emptyTitle="No pages in this chapter" emptyDescription="Pages will appear after backend page creation or upload metadata is available." />}</div><MFCard><h2 className="text-title-lg text-on-surface">Selected page metadata</h2><p className="mt-xs text-body-md text-on-surface-muted">This card uses live page number/status only. It does not fetch protected artwork or signed URLs.</p><div className="mt-lg">{selectedPage ? <MFPagePreviewCard pageNumber={selectedPage.pageNumber} status={selectedPage.status} isSelected /> : <MFEmptyState icon="image" title="No page selected" description="Live page metadata will appear here after pages exist." />}</div></MFCard></section>
}

export function ChapterReviewPanel() {
  return <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]"><div className="space-y-lg"><SubmissionVersionList versions={submissionVersions} description="Version history preview only. Review mutations are reserved for API-backed stories." /><CommentThread comments={comments} description="Comment lifecycle is displayed without mark-fixed, verify, or resolve actions." /></div><ContextPageList pages={contextPages} title="Read-only page context" description="Context pages are local display only and do not imply Assistant full-chapter access." /></section>
}

interface ChapterReadinessPanelProps { readinessLoading: boolean; readinessItems: PublicationReadinessItem[]; readinessMessage: string; readinessSummaryTone: "success" | "warning"; publicationActionLoading: boolean; publicationMessage: string; scheduleInput: string; setScheduleInput: (value: string) => void; handleCreatePublication: () => Promise<void>; handleSchedulePublication: () => Promise<void>; handlePublishPublication: () => Promise<void> }
export function ChapterReadinessPanel(props: ChapterReadinessPanelProps) {
  return <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]"><div className="space-y-lg">{props.readinessLoading ? <MFCard><div className="h-48 rounded-3xl bg-surface-low" /></MFCard> : <PublicationReadinessChecklist items={props.readinessItems} description={props.readinessMessage} />}<MFCard><div className="flex flex-wrap items-start justify-between gap-md"><div><h2 className="text-title-lg text-on-surface">Backend publication actions</h2><p className="mt-xs text-body-md text-on-surface-muted">Scheduling, readiness calculation, and publish calls now go to backend endpoints.</p></div><MFBadge tone={props.readinessSummaryTone} size="md">API-backed</MFBadge></div><div className="mt-lg space-y-md"><input className="w-full rounded-xl border border-outline-variant bg-surface-lowest px-md py-sm text-body-md" value={props.scheduleInput} onChange={(event) => props.setScheduleInput(event.target.value)} /><div className="flex flex-wrap gap-sm"><MFButton type="button" size="sm" loading={props.publicationActionLoading} onClick={() => void props.handleCreatePublication()}>Create publication</MFButton><MFButton type="button" variant="outline" size="sm" loading={props.publicationActionLoading} onClick={() => void props.handleSchedulePublication()}>Update schedule</MFButton><MFButton type="button" variant="outline" size="sm" loading={props.publicationActionLoading} onClick={() => void props.handlePublishPublication()}>Publish chapter</MFButton></div><p className="rounded-2xl bg-surface-low p-md text-body-md text-on-surface">{props.publicationMessage}</p></div></MFCard></div><MFCard><h2 className="text-title-lg text-on-surface">Publication boundary</h2><p className="mt-xs text-body-md text-on-surface-muted">Backend still owns readiness rules and publish permission checks. This UI only calls explicit endpoints and renders their result.</p><div className="mt-lg flex flex-wrap gap-sm"><MFBadge tone="warning" size="md">Needs real chapter id</MFBadge><MFBadge tone="neutral" size="md">No local readiness math</MFBadge></div></MFCard></section>
}
