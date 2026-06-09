import { useMemo } from "react"
import { CommentThread } from "@/shared/components/domain"
import { PageShell } from "@/shared/components/layout/PageShell"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { ReviewDecisionSection } from "../components/ReviewDecisionSection"
import { ReviewHeroPanel } from "../components/ReviewHeroPanel"
import { ReviewQueueSection } from "../components/ReviewQueueSection"
import { ReviewStatePreview } from "../components/ReviewStatePreview"
import { useReviewQueue } from "../hooks/useReviewQueue"
import { reviewComments } from "../utils/review-static-content"
import { toReviewActions, toReviewRows, toSubmissionVersions } from "../utils/review-queue.mappers"

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
      <ReviewHeroPanel />
      <ReviewQueueSection
        actions={reviewActions}
        rows={reviewRows}
        loading={queueLoading}
        error={queueError}
        onRetry={() => void refresh()}
      />
      <ReviewDecisionSection versions={submissionVersions} onActionSuccess={refresh} />
      <CommentThread
        comments={reviewComments}
        description="Comment lifecycle is displayed without mark-fixed, verify, or resolve actions."
      />
      <ReviewStatePreview />
    </PageShell>
  )
}
