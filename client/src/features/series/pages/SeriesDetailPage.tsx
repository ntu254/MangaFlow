import { useState } from "react"
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
import {
  MFBadge,
  MFButton,
  MFCard,
  MFPagePreviewCard,
  MFTable,
  type MFTableColumn,
} from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { chapterStatusUI, pageStatusUI, taskStatusUI } from "@/shared/lib/status-ui"

interface ChapterRow {
  id: string
  title: string
  status: string
  progress: string
  updatedAt: string
}

interface PagePreview {
  id: string
  pageNumber: number
  status: string
  label: string
}

const seriesDetailActions: ActionItem[] = [
  {
    id: "series-action-1",
    title: "Manuscript review is waiting",
    description: "Initial draft v3 is represented as a local sample review item.",
    metadata: "Editor review queue - no API request",
    icon: "rate_review",
    status: "SUBMITTED",
  },
  {
    id: "series-action-2",
    title: "Chapter creation remains gated",
    description: "This screen displays the gate state but does not enforce approval.",
    metadata: "Backend Board approval is the source of truth",
    icon: "lock",
    status: "REVISION_REQUESTED",
  },
]

const chapterRows: ChapterRow[] = [
  {
    id: "chapter-08",
    title: "Chapter 08 - Lantern Rain",
    status: "IN_PRODUCTION",
    progress: "18 of 24 pages",
    updatedAt: "Today",
  },
  {
    id: "chapter-07",
    title: "Chapter 07 - Paper Moon",
    status: "READY_FOR_PUBLICATION",
    progress: "24 of 24 pages",
    updatedAt: "Yesterday",
  },
  {
    id: "chapter-06",
    title: "Chapter 06 - Soft Static",
    status: "PUBLISHED",
    progress: "22 of 22 pages",
    updatedAt: "Last week",
  },
]

const pagePreviews: PagePreview[] = [
  { id: "page-11", pageNumber: 11, status: "APPROVED", label: "Previous page" },
  { id: "page-12", pageNumber: 12, status: "IN_PROGRESS", label: "Assigned sample" },
  { id: "page-13", pageNumber: 13, status: "UPLOADED", label: "Next page" },
]

const chapterColumns: MFTableColumn<ChapterRow>[] = [
  {
    id: "chapter",
    header: "Chapter",
    cell: (chapter) => (
      <div className="min-w-0">
        <p className="break-words text-label-md text-on-surface">{chapter.title}</p>
        <p className="mt-xs text-label-sm text-on-surface-muted">
          Local sample row
        </p>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (chapter) => <StatusBadge status={chapter.status} mapping={chapterStatusUI} />,
  },
  {
    id: "progress",
    header: "Progress",
    cell: (chapter) => chapter.progress,
  },
  {
    id: "updated",
    header: "Updated",
    cell: (chapter) => chapter.updatedAt,
  },
]

function SeriesDetailStatePreview() {
  return (
    <MFCard>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <h2 className="text-title-lg text-on-surface">Series detail states</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">
            UI-only previews for loading, empty, error, gated, and page status states.
          </p>
        </div>
        <MFBadge tone="warning" size="md">
          API not connected
        </MFBadge>
      </div>
      <div className="mt-lg grid gap-md xl:grid-cols-4">
        <div className="rounded-3xl bg-surface-low p-lg" aria-label="Loading series detail preview">
          <MFSkeleton className="h-4 w-36" />
          <div className="mt-md space-y-sm">
            <MFSkeleton className="h-3 w-full" />
            <MFSkeleton className="h-3 w-2/3" />
            <MFSkeleton className="h-3 w-1/2" />
          </div>
          <p className="mt-md text-label-sm text-on-surface-muted">Loading preview</p>
        </div>
        <MFEmptyState
          icon="auto_stories"
          title="No chapters yet"
          description="A live Series can remain empty until the approved chapter workflow creates records."
        />
        <MFErrorState
          title="Could not load Series"
          description="Future query failures should be recoverable and avoid raw stack traces."
          onRetry={() => undefined}
        />
        <div className="rounded-3xl bg-surface-low p-lg">
          <div className="flex flex-wrap gap-sm">
            <StatusBadge status="UPLOADED" mapping={pageStatusUI} />
            <StatusBadge status="IN_PROGRESS" mapping={pageStatusUI} />
            <StatusBadge status="APPROVED" mapping={pageStatusUI} />
          </div>
          <p className="mt-md text-body-md text-on-surface">
            Page and chapter statuses remain text-visible and do not rely on color alone.
          </p>
        </div>
      </div>
    </MFCard>
  )
}

export function SeriesDetailPage() {
  const { id } = useParams()
  const [selectedManuscripts, setSelectedManuscripts] = useState<string[]>([])

  usePageTitle(
    "Series Detail",
    "Review local Series detail presentation, chapter progress, and disconnected workflow surfaces.",
  )

  return (
    <PageShell>
      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_22rem]">
        <MFCard padding="lg" className="rounded-3xl">
          <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-sm">
                <MFBadge tone="primary" size="md">
                  Series Detail
                </MFBadge>
                <MFBadge tone="warning" size="md">
                  Presentation only
                </MFBadge>
              </div>
              <h1 className="mt-md break-words text-headline-lg text-on-surface">
                Moonlit Atelier
              </h1>
              <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
                This route now composes shared Series and Chapter components with local
                sample data. It does not fetch persisted Series records, upload files,
                create chapters, enforce permissions, or decide Board approval.
              </p>
            </div>
            <MFButton type="button" disabled>
              Create chapter disabled
            </MFButton>
          </div>
        </MFCard>

        <MFCard>
          <h2 className="text-title-lg text-on-surface">Route boundary</h2>
          <p className="mt-sm text-body-md text-on-surface-muted">
            Route id <span className="font-semibold text-on-surface">{id ?? "sample"}</span>{" "}
            is displayed only for orientation. No Series query has been connected.
          </p>
        </MFCard>
      </section>

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-lg">
          <SeriesSummaryCard
            title="Moonlit Atelier"
            status="BOARD_REVIEW"
            genre="Slice of life, supernatural"
            publicationType="Monthly serial"
            description="A quiet studio drama sample used to prove the Series Detail composition without live product data."
            ownerLabel="Mika Tan"
            metadata={[
              "Sample Series",
              "Board approval display only",
              "API disconnected",
            ]}
            action={
              <MFBadge tone="neutral" size="md">
                Local record
              </MFBadge>
            }
          />

          <ChapterCreationGateCard
            seriesTitle="Moonlit Atelier"
            canCreateChapter={false}
            reason="Chapter creation is shown as blocked because sample approval is not finalized. Backend Board approval remains the source of truth."
          />

          <div>
            <h2 className="mb-md text-title-lg text-on-surface">Chapter progress</h2>
            <div className="grid gap-lg lg:grid-cols-2">
              <ChapterProgressCard
                title="Chapter 08 - Lantern Rain"
                status="IN_PRODUCTION"
                completed={18}
                total={24}
                description="Production progress sample for the active chapter."
              />
              <ChapterProgressCard
                title="Chapter 07 - Paper Moon"
                status="READY_FOR_PUBLICATION"
                completed={24}
                total={24}
                description="Readiness sample only; publication workflow is not triggered."
              />
            </div>
          </div>
        </div>

        <div className="space-y-lg">
          <ManuscriptUploadPanel
            title="Manuscript upload boundary"
            description="Local file selection preview. No storage request, signed URL, or manuscript submission is sent."
            constraints={[
              "Original file storage is backend-owned and not connected here.",
              "Signed URL access remains out of scope for this presentation story.",
              "Selected filenames below are browser-local only.",
            ]}
            accept=".pdf,.zip,.jpg,.jpeg,.png"
            multiple
            onFilesSelected={(files) =>
              setSelectedManuscripts(Array.from(files, (file) => file.name))
            }
          />

          {selectedManuscripts.length > 0 ? (
            <MFCard>
              <div className="flex flex-wrap items-start justify-between gap-md">
                <div>
                  <h2 className="text-title-lg text-on-surface">Selected locally</h2>
                  <p className="mt-xs text-body-md text-on-surface-muted">
                    Filenames are retained in component state only.
                  </p>
                </div>
                <MFBadge tone="neutral" size="md">
                  No upload
                </MFBadge>
              </div>
              <ul className="mt-lg list-disc space-y-xs pl-lg text-body-md text-on-surface-muted">
                {selectedManuscripts.map((fileName) => (
                  <li key={fileName} className="break-words">
                    {fileName}
                  </li>
                ))}
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
          <MFTable
            caption="Series chapter list"
            rows={chapterRows}
            columns={chapterColumns}
            getRowKey={(chapter) => chapter.id}
            emptyTitle="No chapters for this Series"
            emptyDescription="Chapter rows will appear when an approved Series and backend chapter query are connected."
          />
        </div>

        <MFCard>
          <h2 className="text-title-lg text-on-surface">Page preview sample</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">
            Preview cards are local placeholders and do not fetch protected artwork.
          </p>
          <div className="mt-lg grid grid-cols-3 gap-md">
            {pagePreviews.map((page) => (
              <div key={page.id} className="min-w-0">
                <MFPagePreviewCard
                  pageNumber={page.pageNumber}
                  status={page.status}
                  isSelected={page.pageNumber === 12}
                />
                <p className="mt-sm break-words text-center text-label-sm text-on-surface-muted">
                  {page.label}
                </p>
              </div>
            ))}
          </div>
        </MFCard>
      </section>

      <SeriesDetailStatePreview />
    </PageShell>
  )
}
