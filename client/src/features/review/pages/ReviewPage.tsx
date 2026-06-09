import { useMemo } from "react"
import {
  ActionItemList,
  CommentThread,
  PublicationReadinessChecklist,
  StatusBadge,
  SubmissionVersionList,
  type CommentThreadItem,
  type PublicationReadinessItem,
} from "@/shared/components/domain"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard, MFPagePreviewCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import {
  commentStatusUI,
  submissionStatusUI,
  taskStatusUI,
} from "@/shared/lib/status-ui"
import { ReviewDecisionPanel } from "../components/ReviewDecisionPanel"
import { ReviewQueuePanel } from "../components/ReviewQueuePanel"
import { useReviewQueue } from "../hooks/useReviewQueue"
import {
  toReviewActions,
  toReviewRows,
  toSubmissionVersions,
} from "../utils/review-queue.mappers"

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

export function ReviewPage() {
  const { queue, queueLoading, queueError, refresh } = useReviewQueue()

  usePageTitle(
    "Review Queue",
    "Review submissions, send explicit review actions, and inspect readiness blockers.",
  )

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
          <ReviewQueuePanel
            rows={reviewRows}
            loading={queueLoading}
            error={queueError}
            onRetry={() => void refresh()}
          />
        </div>
      </section>

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-lg">
          <ReviewDecisionPanel onActionSuccess={refresh} />
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
