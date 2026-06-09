import { StatusBadge } from "@/shared/components/domain"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { commentStatusUI, submissionStatusUI } from "@/shared/lib/status-ui"

export function ReviewStatePreview() {
  return (
    <MFCard>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <h2 className="text-title-lg text-on-surface">Review states</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">
            UI-only previews for loading, empty, error, resolved, submitted, and revision states.
          </p>
        </div>
        <MFBadge tone="success" size="md">Queue API connected</MFBadge>
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
        <MFEmptyState icon="rate_review" title="No reviews waiting" description="The live queue will stay empty until review APIs supply records." />
        <MFErrorState title="Could not load review queue" description="Future API failures should remain recoverable and avoid raw stack traces." onRetry={() => undefined} />
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
