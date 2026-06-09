import { useState } from "react"
import { ReviewDecisionBar, type ReviewDecisionAction } from "@/shared/components/domain"
import { MFBadge, MFCard } from "@/shared/components/ui"
import {
  editorApproveSubmission,
  mangakaApproveSubmission,
  rejectSubmission,
  requestSubmissionRevision,
} from "../api/review.api"

interface ReviewDecisionPanelProps {
  onActionSuccess: () => Promise<void> | void
}

export function ReviewDecisionPanel({ onActionSuccess }: ReviewDecisionPanelProps) {
  const [decisionPreview, setDecisionPreview] = useState("No review API action run yet.")
  const [submissionId, setSubmissionId] = useState("")
  const [reviewerNote, setReviewerNote] = useState("Reviewed from MangaFlow review queue.")
  const [finalApprovalMode, setFinalApprovalMode] = useState(false)
  const [loadingAction, setLoadingAction] = useState<ReviewDecisionAction | null>(null)

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
      await onActionSuccess()
    } catch {
      setDecisionPreview("Could not reach MangaFlow submission review API.")
    } finally {
      setLoadingAction(null)
    }
  }

  return (
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
    </div>
  )
}
