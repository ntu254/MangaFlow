import { useState } from "react"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFDialog } from "@/shared/components/ui/MFDialog"

export type ReviewDecisionAction = "approve" | "request-revision" | "reject"

interface ReviewDecisionBarProps {
  onApprove: () => void
  onRequestRevision: () => void
  onReject: () => void
  title?: string
  description?: string
  approveLabel?: string
  requestRevisionLabel?: string
  rejectLabel?: string
  rejectConfirmationTitle?: string
  rejectConfirmationDescription?: string
  disabled?: boolean
  loadingAction?: ReviewDecisionAction | null
}

export function ReviewDecisionBar({
  onApprove,
  onRequestRevision,
  onReject,
  title = "Review decision",
  description = "Choose the next step for this review.",
  approveLabel = "Approve",
  requestRevisionLabel = "Request revision",
  rejectLabel = "Reject",
  rejectConfirmationTitle = "Reject this submission?",
  rejectConfirmationDescription = "This action is destructive and should only be used when the submission cannot continue through revision.",
  disabled = false,
  loadingAction = null,
}: ReviewDecisionBarProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const actionPending = loadingAction !== null
  const actionsDisabled = disabled || actionPending

  function handleRejectConfirm() {
    setRejectDialogOpen(false)
    onReject()
  }

  return (
    <>
      <MFCard aria-busy={actionPending}>
        <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-title-lg text-on-surface">{title}</h2>
            <p className="mt-xs text-body-md text-on-surface-muted">{description}</p>
          </div>

          <div className="flex flex-col gap-sm sm:flex-row sm:flex-wrap lg:justify-end">
            <MFButton
              type="button"
              variant="outline"
              disabled={actionsDisabled}
              loading={loadingAction === "request-revision"}
              onClick={onRequestRevision}
            >
              {requestRevisionLabel}
            </MFButton>
            <MFButton
              type="button"
              variant="danger"
              disabled={actionsDisabled}
              loading={loadingAction === "reject"}
              onClick={() => setRejectDialogOpen(true)}
            >
              {rejectLabel}
            </MFButton>
            <MFButton
              type="button"
              disabled={actionsDisabled}
              loading={loadingAction === "approve"}
              onClick={onApprove}
            >
              {approveLabel}
            </MFButton>
          </div>
        </div>
      </MFCard>

      <MFDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        title={rejectConfirmationTitle}
        description={rejectConfirmationDescription}
        footer={
          <>
            <MFButton
              type="button"
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </MFButton>
            <MFButton type="button" variant="danger" onClick={handleRejectConfirm}>
              Confirm rejection
            </MFButton>
          </>
        }
      >
        <div className="rounded-xl bg-error-container p-md text-body-md text-on-error-container">
          Confirming will send the reject decision to the current review handler.
        </div>
      </MFDialog>
    </>
  )
}
