import { useEffect, useMemo, useState } from "react"
import {
  ActionItemList,
  CommentThread,
  PublicationReadinessChecklist,
  ReviewDecisionBar,
  StatusBadge,
  SubmissionVersionList,
  type ActionItem,
  type CommentThreadItem,
  type PublicationReadinessItem,
  type SubmissionVersionItem,
} from "@/shared/components/domain"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { PageShell } from "@/shared/components/layout/PageShell"
import {
  MFBadge,
  MFCard,
  MFPagePreviewCard,
  MFTable,
  type MFTableColumn,
} from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import {
  commentStatusUI,
  submissionStatusUI,
  taskStatusUI,
} from "@/shared/lib/status-ui"
import {
  editorApproveSubmission,
  listReviewQueueSubmissions,
  mangakaApproveSubmission,
  rejectSubmission,
  requestSubmissionRevision,
  type SubmissionReviewResult,
} from "../api/review.api"
import type { ReviewDecisionAction } from "@/shared/components/domain"

interface ReviewQueueRow {
  id: string
  target: string
  series: string
  type: string
  status: string
  owner: string
  age: string
}

const comments: CommentThreadItem[] = [
  {
    id: "comment-1",
    authorName: "Mika Tan",
    authorRole: "Mangaka",
    body: "Please soften the texture around the speech bubble before final approval.",
    status: "OPEN",
    createdAt: "Today 09:20",
    targetLabel: "Page 12 - upper panel",
    isUnresolved: true,
  },
  {
    id: "comment-2",
    authorName: "Rin Sato",
    authorRole: "Tantou Editor",
    body: "Panel rhythm is approved. Keep light direction consistent with the previous page.",
    status: "RESOLVED_BY_EDITOR",
    createdAt: "Yesterday 16:45",
    targetLabel: "Page 12 - full page",
  },
]

const readinessItems: PublicationReadinessItem[] = [
  {
    id: "pages-uploaded",
    label: "All pages uploaded",
    passed: true,
    description: "Local readiness sample only.",
  },
  {
    id: "tasks-approved",
    label: "All tasks approved",
    passed: false,
    description: "The selected review still has a submitted task awaiting approval.",
  },
  {
    id: "comments-resolved",
    label: "All comments resolved",
    passed: false,
    description: "Unresolved comments must be resolved by Editor before publication.",
  },
  {
    id: "publication-date",
    label: "Publication date exists",
    passed: true,
    description: "Sample schedule has a draft date.",
  },
]

const reviewColumns: MFTableColumn<ReviewQueueRow>[] = [
  {
    id: "target",
    header: "Review target",
    cell: (row) => (
      <div className="min-w-0">
        <p className="break-words text-label-md text-on-surface">{row.target}</p>
        <p className="mt-xs break-words text-label-sm text-on-surface-muted">
          {row.series}
        </p>
      </div>
    ),
  },
  {
    id: "type",
    header: "Type",
    cell: (row) => row.type,
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} mapping={submissionStatusUI} />,
  },
  {
    id: "owner",
    header: "Owner",
    cell: (row) => row.owner,
  },
  {
    id: "age",
    header: "Age",
    cell: (row) => row.age,
  },
]

function ReviewStatePreview() {
  return (
    <MFCard>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <h2 className="text-title-lg text-on-surface">Review states</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">
            UI-only previews for loading, empty, error, resolved, submitted, and revision states.
          </p>
        </div>
        <MFBadge tone="success" size="md">
          Queue API connected
        </MFBadge>
      </div>
      <div className="mt-lg grid gap-md xl:grid-cols-4">
        <div className="rounded-3xl bg-surface-low p-lg" aria-label="Loading review preview">
          <div className="h-4 w-32 rounded-full bg-surface-container" />
          <div className="mt-md space-y-sm">
            <div className="h-3 rounded-full bg-surface-container" />
            <div className="h-3 w-2/3 rounded-full bg-surface-container" />
            <div className="h-3 w-1/2 rounded-full bg-surface-container" />
          </div>
          <p className="mt-md text-label-sm text-on-surface-muted">Loading preview</p>
        </div>
        <MFEmptyState
          icon="rate_review"
          title="No reviews waiting"
          description="The live queue will stay empty until review APIs supply records."
        />
        <MFErrorState
          title="Could not load review queue"
          description="Future API failures should remain recoverable and avoid raw stack traces."
          onRetry={() => undefined}
        />
        <div className="rounded-3xl bg-surface-low p-lg">
          <div className="flex flex-wrap gap-sm">
            <StatusBadge status="SUBMITTED" mapping={submissionStatusUI} />
            <StatusBadge status="OPEN" mapping={commentStatusUI} />
            <StatusBadge status="RESOLVED_BY_EDITOR" mapping={commentStatusUI} />
          </div>
          <p className="mt-md text-body-md text-on-surface">
            Review, comment, and revision states stay text-visible and do not rely on color alone.
          </p>
        </div>
      </div>
    </MFCard>
  )
}

function submissionId(submission: SubmissionReviewResult) {
  return submission.id ?? submission._id ?? `${submission.taskId}-${submission.version}`
}

function submittedByLabel(submission: SubmissionReviewResult) {
  return typeof submission.submittedBy === "string"
    ? `Assistant ${String(submission.submittedBy).slice(-6)}`
    : submission.submittedBy.name ?? "Assistant"
}

function fileLabel(submission: SubmissionReviewResult) {
  if (!submission.fileAssetId) return undefined
  return typeof submission.fileAssetId === "string" ? "File linked" : submission.fileAssetId.originalName
}

function toReviewRows(submissions: SubmissionReviewResult[]): ReviewQueueRow[] {
  return submissions.map((submission) => ({
    id: submissionId(submission),
    target: `Submission v${submission.version}`,
    series: `Series ${String(submission.seriesId).slice(-6)}`,
    type: submission.status === "MANGAKA_APPROVED" ? "Editor final approval" : "Mangaka review",
    status: submission.status,
    owner: submission.status === "MANGAKA_APPROVED" ? "Editor final review" : "Mangaka review",
    age: new Date(submission.updatedAt ?? submission.createdAt).toLocaleDateString(),
  }))
}

function toReviewActions(submissions: SubmissionReviewResult[]): ActionItem[] {
  if (submissions.length === 0) {
    return [{
      id: "review-empty-action",
      title: "No live review actions",
      description: "Review items will appear after backend returns submissions for your role.",
      metadata: "GET /api/submissions/review-queue",
      icon: "rate_review",
      status: "SUBMITTED",
    }]
  }
  return submissions.slice(0, 3).map((submission) => ({
    id: submissionId(submission),
    title: `Review submission v${submission.version}`,
    description: submission.resultText ?? "Submission is waiting for review.",
    metadata: `${submission.status} - task ${String(submission.taskId).slice(-6)}`,
    icon: "rate_review",
    status: submission.status,
  }))
}

function toSubmissionVersions(submissions: SubmissionReviewResult[]): SubmissionVersionItem[] {
  return submissions.slice(0, 3).map((submission, index) => ({
    id: submissionId(submission),
    label: `Version ${submission.version}`,
    submittedBy: submittedByLabel(submission),
    submittedAt: new Date(submission.createdAt).toLocaleDateString(),
    status: submission.status,
    summary: submission.resultText,
    fileName: fileLabel(submission),
    isCurrent: index === 0,
  }))
}

export function ReviewPage() {
  const [queue, setQueue] = useState<SubmissionReviewResult[]>([])
  const [queueLoading, setQueueLoading] = useState(true)
  const [queueError, setQueueError] = useState("")
  const [decisionPreview, setDecisionPreview] = useState("No review API action run yet.")
  const [submissionId, setSubmissionId] = useState("")
  const [reviewerNote, setReviewerNote] = useState("Reviewed from MangaFlow review queue.")
  const [finalApprovalMode, setFinalApprovalMode] = useState(false)
  const [loadingAction, setLoadingAction] = useState<ReviewDecisionAction | null>(null)

  usePageTitle(
    "Review Queue",
    "Review submissions, send explicit review actions, and inspect readiness blockers.",
  )

  async function loadReviewQueue() {
    setQueueLoading(true)
    setQueueError("")
    try {
      const response = await listReviewQueueSubmissions()
      if (!response.success || !response.data) {
        setQueue([])
        setQueueError(response.message ?? "Could not load review queue.")
        return
      }
      setQueue(response.data)
    } catch {
      setQueue([])
      setQueueError("Could not reach MangaFlow review queue API.")
    } finally {
      setQueueLoading(false)
    }
  }

  useEffect(() => {
    void loadReviewQueue()
  }, [])

  async function runReviewAction(action: ReviewDecisionAction) {
    if (!submissionId.trim()) {
      setDecisionPreview("Enter a real submission id before sending a backend review action.")
      return
    }

    setLoadingAction(action)
    try {
      const input = { submissionId: submissionId.trim(), reviewerNote }
      const response = action === "approve"
        ? finalApprovalMode
          ? await editorApproveSubmission(input)
          : await mangakaApproveSubmission(input)
        : action === "request-revision"
          ? await requestSubmissionRevision(input)
          : await rejectSubmission(input)

      if (!response.success || !response.data) {
        setDecisionPreview(response.message ?? "Review action was rejected by the backend.")
        return
      }

      setDecisionPreview(`Backend accepted ${action}; submission status is ${response.data.status}.`)
      await loadReviewQueue()
    } catch {
      setDecisionPreview("Could not reach MangaFlow submission review API.")
    } finally {
      setLoadingAction(null)
    }
  }

  const reviewRows = useMemo(() => toReviewRows(queue), [queue])
  const reviewActions = useMemo(() => toReviewActions(queue), [queue])
  const submissionVersions = useMemo(() => toSubmissionVersions(queue), [queue])

  return (
    <PageShell>
      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_22rem]">
        <MFCard padding="lg" className="rounded-3xl">
          <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-sm">
                <MFBadge tone="primary" size="md">
                  Review
                </MFBadge>
                <MFBadge tone="success" size="md">
                  Review API actions connected
                </MFBadge>
                <MFBadge tone="success" size="md">
                  Queue API connected
                </MFBadge>
              </div>
              <h1 className="mt-md text-headline-lg text-on-surface">
                Review queue
              </h1>
              <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
                This page loads backend review queue submissions for the current role and sends
                explicit backend submission action endpoints when a real submission id is provided.
                Comment lifecycle, readiness updates, payroll triggers, and file access remain backend-owned.
              </p>
            </div>
          </div>
        </MFCard>

        <MFCard>
          <h2 className="text-title-lg text-on-surface">Workflow boundary</h2>
          <p className="mt-sm text-body-md text-on-surface-muted">
            Decision buttons call backend review endpoints only after you provide a submission id.
            The backend still enforces Mangaka-before-Editor review and payroll trigger rules.
          </p>
        </MFCard>
      </section>

      <section className="grid gap-lg xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div>
          <h2 className="mb-md text-title-lg text-on-surface">Pending review actions</h2>
          <ActionItemList items={reviewActions} statusMapping={taskStatusUI} />
        </div>
        <div>
          <h2 className="mb-md text-title-lg text-on-surface">Review queue</h2>
          {queueError ? <MFErrorState title="Could not load review queue" description={queueError} onRetry={() => void loadReviewQueue()} /> : <MFTable caption="Review queue" rows={reviewRows} columns={reviewColumns} getRowKey={(row) => row.id} loading={queueLoading} emptyTitle="No review items" emptyDescription="Review records will appear here when backend returns submissions for your role." />}
        </div>
      </section>

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-lg">
          <ReviewDecisionBar
            title="Submission review decision"
            description="Send a review action for the entered submission id. Toggle final approval only for Editor production final approval."
            approveLabel={finalApprovalMode ? "Editor final approve" : "Mangaka approve"}
            requestRevisionLabel="Request revision"
            rejectLabel="Reject"
            rejectConfirmationTitle="Preview rejection?"
            rejectConfirmationDescription="This sends a reject action to the backend for the entered submission id."
            disabled={!submissionId.trim()}
            loadingAction={loadingAction}
            onApprove={() => void runReviewAction("approve")}
            onRequestRevision={() => void runReviewAction("request-revision")}
            onReject={() => void runReviewAction("reject")}
          />
          <MFCard>
            <div className="flex flex-wrap items-start justify-between gap-md">
              <div>
                <h2 className="text-title-lg text-on-surface">Backend review action</h2>
                <p className="mt-xs text-body-md text-on-surface-muted">
                  Provide a real submission id from `GET /api/tasks/:taskId/submissions` before sending workflow actions.
                </p>
              </div>
              <MFBadge tone="success" size="md">
                API-backed actions
              </MFBadge>
            </div>
            <div className="mt-lg grid gap-md md:grid-cols-2">
              <label className="text-label-sm text-on-surface-muted">
                Submission id
                <input className="mt-xs w-full rounded-xl border border-outline-variant bg-surface-lowest px-md py-sm text-body-md text-on-surface" value={submissionId} onChange={(event) => setSubmissionId(event.target.value)} placeholder="submission ObjectId" />
              </label>
              <label className="text-label-sm text-on-surface-muted">
                Reviewer note
                <input className="mt-xs w-full rounded-xl border border-outline-variant bg-surface-lowest px-md py-sm text-body-md text-on-surface" value={reviewerNote} onChange={(event) => setReviewerNote(event.target.value)} />
              </label>
            </div>
            <label className="mt-md flex items-center gap-sm text-label-md text-on-surface">
              <input type="checkbox" checked={finalApprovalMode} onChange={(event) => setFinalApprovalMode(event.target.checked)} />
              Use Editor final approval endpoint instead of Mangaka internal approval
            </label>
            <p className="mt-lg rounded-2xl bg-surface-low p-lg text-body-md text-on-surface">
              {decisionPreview}
            </p>
          </MFCard>
          <SubmissionVersionList
            versions={submissionVersions}
            description="Recent backend review queue submissions. Use the submission id above to send a review action."
          />
        </div>

        <div className="space-y-lg">
          <MFCard>
            <h2 className="text-title-lg text-on-surface">Review target</h2>
            <p className="mt-xs text-body-md text-on-surface-muted">
              The selected target preview is local and does not fetch signed files.
            </p>
            <div className="mt-lg">
              <MFPagePreviewCard pageNumber={12} status="SUBMITTED" isSelected />
            </div>
          </MFCard>
          <PublicationReadinessChecklist
            items={readinessItems}
            description="Readiness blockers are shown as presentation data only."
          />
        </div>
      </section>

      <CommentThread
        comments={comments}
        description="Comment lifecycle is displayed without mark-fixed, verify, or resolve actions."
      />

      <ReviewStatePreview />
    </PageShell>
  )
}
