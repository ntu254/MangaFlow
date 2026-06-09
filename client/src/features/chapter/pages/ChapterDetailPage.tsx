import { MFBadge, MFButton, MFCard } from "@/shared/components/ui"
import { PageShell } from "@/shared/components/layout/PageShell"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import {
  ChapterDetailStatePreview,
  ChapterOverviewPanel,
  ChapterPagesPanel,
  ChapterReadinessPanel,
  ChapterReviewPanel,
  ChapterTabsCard,
} from "../components/ChapterDetailPanels"
import { useChapterDetail } from "../hooks/useChapterDetail"

export function ChapterDetailPage() {
  const chapter = useChapterDetail()

  usePageTitle("Chapter Detail", "Review chapter production, page status, task context, and readiness presentation.")

  return (
    <PageShell>
      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_22rem]">
        <MFCard padding="lg" className="rounded-3xl">
          <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-sm">
                <MFBadge tone="primary" size="md">Chapter Detail</MFBadge>
                <MFBadge tone="success" size="md">Page metadata API connected</MFBadge>
                <MFBadge tone="success" size="md">Readiness API connected</MFBadge>
                <MFBadge tone="success" size="md">Task metadata API connected</MFBadge>
              </div>
              <h1 className="mt-md break-words text-headline-lg text-on-surface">Chapter 08 - Lantern Rain</h1>
              <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
                This route loads page metadata, chapter task metadata, readiness, and publication actions from backend APIs when a real chapter id is available. Submission/comment/context panels remain bounded until their read APIs are selected.
              </p>
            </div>
            <MFButton type="button" disabled>Upload pages disabled</MFButton>
          </div>
        </MFCard>
        <MFCard>
          <h2 className="text-title-lg text-on-surface">Route boundary</h2>
          <p className="mt-sm text-body-md text-on-surface-muted">
            Route id <span className="font-semibold text-on-surface">{chapter.id ?? "sample"}</span> drives page metadata, readiness, and publication API calls. Protected artwork and signed file URLs are not fetched here.
          </p>
        </MFCard>
      </section>

      <ChapterOverviewPanel
        tasks={chapter.tasks}
        pagesCount={chapter.pageRows.length}
        featuredTask={chapter.featuredTask}
        tasksError={chapter.tasksError}
        tasksLoading={chapter.tasksLoading}
        currentChapterId={chapter.chapterId}
        loadTasks={chapter.loadTasks}
      />

      <ChapterTabsCard
        activeTab={chapter.activeTab}
        setActiveTab={chapter.setActiveTab}
        pageCount={chapter.pageRows.length}
        readinessCount={chapter.readinessItems.length}
      />

      {chapter.activeTab === "pages" ? (
        <ChapterPagesPanel
          pagesError={chapter.pagesError}
          pagesLoading={chapter.pagesLoading}
          pageRows={chapter.pageRows}
          loadPages={chapter.loadPages}
          selectedPage={chapter.selectedPage}
        />
      ) : null}

      {chapter.activeTab === "review" ? <ChapterReviewPanel /> : null}

      {chapter.activeTab === "readiness" ? (
        <ChapterReadinessPanel
          readinessLoading={chapter.readinessLoading}
          readinessItems={chapter.readinessItems}
          readinessMessage={chapter.readinessMessage}
          readinessSummaryTone={chapter.readinessSummaryTone}
          publicationActionLoading={chapter.publicationActionLoading}
          publicationMessage={chapter.publicationMessage}
          scheduleInput={chapter.scheduleInput}
          setScheduleInput={chapter.setScheduleInput}
          handleCreatePublication={chapter.handleCreatePublication}
          handleSchedulePublication={chapter.handleSchedulePublication}
          handlePublishPublication={chapter.handlePublishPublication}
        />
      ) : null}

      <ChapterDetailStatePreview />
    </PageShell>
  )
}
