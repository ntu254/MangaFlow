import { useState } from "react"
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

interface PageRow {
  id: string
  pageNumber: number
  status: string
  taskStatus: string
  owner: string
  updatedAt: string
}

const chapterActions: ActionItem[] = [
  {
    id: "chapter-action-1",
    title: "Page 12 task needs Mangaka review",
    description: "Assistant submission is represented as local sample data only.",
    metadata: "No submission review API call is connected",
    icon: "rate_review",
    status: "SUBMITTED",
  },
  {
    id: "chapter-action-2",
    title: "Publication readiness is blocked",
    description: "One open comment keeps the sample readiness checklist blocked.",
    metadata: "Editor-owned readiness remains backend-controlled",
    icon: "fact_check",
    status: "REVISION_REQUESTED",
  },
]

const contextPages: ContextPageItem[] = [
  { id: "context-11", pageNumber: 11, status: "APPROVED", label: "Previous page" },
  { id: "context-12", pageNumber: 12, status: "SUBMITTED", label: "Selected page" },
  { id: "context-13", pageNumber: 13, status: "IN_PROGRESS", label: "Next page" },
]

const pageRows: PageRow[] = [
  {
    id: "page-11",
    pageNumber: 11,
    status: "APPROVED",
    taskStatus: "EDITOR_APPROVED",
    owner: "Editor final review",
    updatedAt: "Yesterday",
  },
  {
    id: "page-12",
    pageNumber: 12,
    status: "SUBMITTED",
    taskStatus: "SUBMITTED",
    owner: "Mangaka review",
    updatedAt: "Today",
  },
  {
    id: "page-13",
    pageNumber: 13,
    status: "IN_PROGRESS",
    taskStatus: "IN_PROGRESS",
    owner: "Assistant view",
    updatedAt: "Today",
  },
  {
    id: "page-14",
    pageNumber: 14,
    status: "UPLOADED",
    taskStatus: "TODO",
    owner: "Unassigned sample",
    updatedAt: "2 days",
  },
]

const comments: CommentThreadItem[] = [
  {
    id: "chapter-comment-1",
    authorName: "Rin Sato",
    authorRole: "Tantou Editor",
    body: "Keep the rain texture lighter near the speech bubble before final readiness.",
    status: "OPEN",
    createdAt: "Today 10:20",
    targetLabel: "Chapter 08 - Page 12",
    isUnresolved: true,
  },
  {
    id: "chapter-comment-2",
    authorName: "Mika Tan",
    authorRole: "Mangaka",
    body: "Panel timing is approved for the opening sequence.",
    status: "RESOLVED_BY_EDITOR",
    createdAt: "Yesterday 17:30",
    targetLabel: "Chapter 08 - Page 11",
  },
]

const readinessItems: PublicationReadinessItem[] = [
  {
    id: "all-pages-uploaded",
    label: "All pages uploaded",
    passed: true,
    description: "Local sample says every page has an upload placeholder.",
  },
  {
    id: "tasks-approved",
    label: "All tasks approved",
    passed: false,
    description: "Page 12 still has a submitted task in local sample state.",
  },
  {
    id: "comments-resolved",
    label: "Comments resolved by Editor",
    passed: false,
    description: "The open comment above blocks readiness.",
  },
  {
    id: "publication-schedule",
    label: "Publication schedule selected",
    passed: true,
    description: "Draft schedule is displayed only; no publication is scheduled.",
  },
]

const submissionVersions: SubmissionVersionItem[] = [
  {
    id: "submission-v2",
    label: "Page 12 tone pass v2",
    submittedBy: "Assistant view",
    submittedAt: "Today 13:15",
    status: "SUBMITTED",
    summary: "Latest sample submission for review presentation.",
    fileName: "chapter-08-page-12-tone-v2.psd",
    isCurrent: true,
  },
  {
    id: "submission-v1",
    label: "Page 12 tone pass v1",
    submittedBy: "Assistant view",
    submittedAt: "Yesterday 16:40",
    status: "REVISION_REQUESTED",
    summary: "Previous version retained to show non-overwrite history.",
    fileName: "chapter-08-page-12-tone-v1.psd",
  },
]

const pageColumns: MFTableColumn<PageRow>[] = [
  {
    id: "page",
    header: "Page",
    cell: (page) => (
      <div className="min-w-0">
        <p className="text-label-md text-on-surface">Page {page.pageNumber}</p>
        <p className="mt-xs text-label-sm text-on-surface-muted">
          Local chapter sample
        </p>
      </div>
    ),
  },
  {
    id: "page-status",
    header: "Page status",
    cell: (page) => <StatusBadge status={page.status} mapping={pageStatusUI} />,
  },
  {
    id: "task-status",
    header: "Task status",
    cell: (page) => <StatusBadge status={page.taskStatus} mapping={taskStatusUI} />,
  },
  {
    id: "owner",
    header: "Owner",
    cell: (page) => page.owner,
  },
  {
    id: "updated",
    header: "Updated",
    cell: (page) => page.updatedAt,
  },
]

function ChapterDetailStatePreview() {
  return (
    <MFCard>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <h2 className="text-title-lg text-on-surface">Chapter detail states</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">
            UI-only previews for loading, empty, error, submitted, blocked, and approved states.
          </p>
        </div>
        <MFBadge tone="warning" size="md">
          API not connected
        </MFBadge>
      </div>
      <div className="mt-lg grid gap-md xl:grid-cols-4">
        <div className="rounded-3xl bg-surface-low p-lg" aria-label="Loading chapter detail preview">
          <MFSkeleton className="h-4 w-36" />
          <div className="mt-md space-y-sm">
            <MFSkeleton className="h-3 w-full" />
            <MFSkeleton className="h-3 w-2/3" />
            <MFSkeleton className="h-3 w-1/2" />
          </div>
          <p className="mt-md text-label-sm text-on-surface-muted">Loading preview</p>
        </div>
        <MFEmptyState
          icon="collections_bookmark"
          title="No pages yet"
          description="Page records will appear after a backend chapter query is connected."
        />
        <MFErrorState
          title="Could not load Chapter"
          description="Future query failures should stay recoverable and avoid raw stack traces."
          onRetry={() => undefined}
        />
        <div className="rounded-3xl bg-surface-low p-lg">
          <div className="flex flex-wrap gap-sm">
            <StatusBadge status="IN_PRODUCTION" mapping={chapterStatusUI} />
            <StatusBadge status="SUBMITTED" mapping={submissionStatusUI} />
            <StatusBadge status="APPROVED" mapping={pageStatusUI} />
          </div>
          <p className="mt-md text-body-md text-on-surface">
            Status labels stay visible in text and do not rely on color alone.
          </p>
        </div>
      </div>
    </MFCard>
  )
}

export function ChapterDetailPage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState("pages")

  usePageTitle(
    "Chapter Detail",
    "Review chapter production, page status, task context, and readiness presentation.",
  )

  return (
    <PageShell>
      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_22rem]">
        <MFCard padding="lg" className="rounded-3xl">
          <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-sm">
                <MFBadge tone="primary" size="md">
                  Chapter Detail
                </MFBadge>
                <MFBadge tone="warning" size="md">
                  Presentation only
                </MFBadge>
              </div>
              <h1 className="mt-md break-words text-headline-lg text-on-surface">
                Chapter 08 - Lantern Rain
              </h1>
              <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
                This route composes shared Chapter, page, task, review, and readiness
                components with local sample data. It does not upload pages, assign
                tasks, resolve comments, schedule publication, or grant Assistant
                full-chapter access.
              </p>
            </div>
            <MFButton type="button" disabled>
              Upload pages disabled
            </MFButton>
          </div>
        </MFCard>

        <MFCard>
          <h2 className="text-title-lg text-on-surface">Route boundary</h2>
          <p className="mt-sm text-body-md text-on-surface-muted">
            Route id <span className="font-semibold text-on-surface">{id ?? "sample"}</span>{" "}
            is displayed only for orientation. No Chapter query has been connected.
          </p>
        </MFCard>
      </section>

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-lg">
          <ChapterProgressCard
            title="Chapter 08 - Lantern Rain"
            status="IN_PRODUCTION"
            completed={18}
            total={24}
            description="Local chapter progress sample. Real page counts and readiness belong to backend queries."
            progressLabel="Pages through production"
          />

          <MFCard>
            <div className="flex flex-wrap items-start justify-between gap-md">
              <div>
                <h2 className="text-title-lg text-on-surface">Chapter metadata</h2>
                <p className="mt-xs text-body-md text-on-surface-muted">
                  Parent Series and schedule labels are sample values only.
                </p>
              </div>
              <StatusBadge status="IN_PRODUCTION" mapping={chapterStatusUI} size="md" />
            </div>
            <dl className="mt-lg grid gap-md sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-surface-low p-md">
                <dt className="text-label-sm text-on-surface-muted">Series</dt>
                <dd className="mt-xs text-label-md text-on-surface">Moonlit Atelier</dd>
              </div>
              <div className="rounded-xl bg-surface-low p-md">
                <dt className="text-label-sm text-on-surface-muted">Chapter number</dt>
                <dd className="mt-xs text-label-md text-on-surface">08</dd>
              </div>
              <div className="rounded-xl bg-surface-low p-md">
                <dt className="text-label-sm text-on-surface-muted">Draft schedule</dt>
                <dd className="mt-xs text-label-md text-on-surface">June 24, 2026</dd>
              </div>
              <div className="rounded-xl bg-surface-low p-md">
                <dt className="text-label-sm text-on-surface-muted">Access boundary</dt>
                <dd className="mt-xs text-label-md text-on-surface">Mangaka / Editor view</dd>
              </div>
            </dl>
          </MFCard>
        </div>

        <div className="space-y-lg">
          <TaskScopeCard
            title="Featured page task"
            status="SUBMITTED"
            scopeType="page"
            scopeLabel="Chapter 08 - Page 12"
            description="Sample task scope. Assistant task workspace remains separate from full chapter access."
            dueDateLabel="June 14, 2026"
            priority="HIGH"
            assignedToLabel="Assistant view"
            taskTypeLabel="Tone cleanup"
          />

          <div>
            <h2 className="mb-md text-title-lg text-on-surface">Pending actions</h2>
            <ActionItemList items={chapterActions} statusMapping={taskStatusUI} />
          </div>
        </div>
      </section>

      <MFCard>
        <div className="flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-title-lg text-on-surface">Chapter sections</h2>
            <p className="mt-xs text-body-md text-on-surface-muted">
              Tabs switch local presentation panels only.
            </p>
          </div>
          <MFTabs
            tabs={[
              { id: "pages", label: "Pages", count: pageRows.length },
              { id: "review", label: "Review", count: comments.length },
              { id: "readiness", label: "Readiness", count: readinessItems.length },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </MFCard>

      {activeTab === "pages" ? (
        <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div>
            <h2 className="mb-md text-title-lg text-on-surface">Page list</h2>
            <MFTable
              caption="Chapter page list"
              rows={pageRows}
              columns={pageColumns}
              getRowKey={(page) => page.id}
              emptyTitle="No pages in this chapter"
              emptyDescription="Pages will appear when a backend page query is connected."
            />
          </div>
          <MFCard>
            <h2 className="text-title-lg text-on-surface">Selected page preview</h2>
            <p className="mt-xs text-body-md text-on-surface-muted">
              Page previews do not fetch protected artwork or signed URLs.
            </p>
            <div className="mt-lg">
              <MFPagePreviewCard pageNumber={12} status="SUBMITTED" isSelected />
            </div>
          </MFCard>
        </section>
      ) : null}

      {activeTab === "review" ? (
        <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-lg">
            <SubmissionVersionList
              versions={submissionVersions}
              description="Version history preview only. Review mutations are reserved for API-backed stories."
            />
            <CommentThread
              comments={comments}
              description="Comment lifecycle is displayed without mark-fixed, verify, or resolve actions."
            />
          </div>
          <ContextPageList
            pages={contextPages}
            title="Read-only page context"
            description="Context pages are local display only and do not imply Assistant full-chapter access."
          />
        </section>
      ) : null}

      {activeTab === "readiness" ? (
        <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
          <PublicationReadinessChecklist
            items={readinessItems}
            description="Readiness blockers are shown as presentation data only. No publication schedule is created."
          />
          <MFCard>
            <h2 className="text-title-lg text-on-surface">Publication boundary</h2>
            <p className="mt-xs text-body-md text-on-surface-muted">
              Scheduling, readiness calculation, and final approval remain backend-owned.
            </p>
            <div className="mt-lg flex flex-wrap gap-sm">
              <MFBadge tone="warning" size="md">
                Blocked sample
              </MFBadge>
              <MFBadge tone="neutral" size="md">
                No publish action
              </MFBadge>
            </div>
          </MFCard>
        </section>
      ) : null}

      <ChapterDetailStatePreview />
    </PageShell>
  )
}
