import { PublicationReadinessChecklist, SubmissionVersionList } from "@/shared/components/domain"
import { MFCard, MFPagePreviewCard } from "@/shared/components/ui"
import { ReviewDecisionPanel } from "./ReviewDecisionPanel"
import { reviewReadinessItems } from "../utils/review-static-content"
import type { SubmissionVersionItem } from "@/shared/components/domain"

interface ReviewDecisionSectionProps {
  versions: SubmissionVersionItem[]
  onActionSuccess: () => Promise<void> | void
}

export function ReviewDecisionSection({ versions, onActionSuccess }: ReviewDecisionSectionProps) {
  return (
    <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-lg">
        <ReviewDecisionPanel onActionSuccess={onActionSuccess} />
        <SubmissionVersionList
          versions={versions}
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
          items={reviewReadinessItems}
          description="Readiness blockers are shown as presentation data only."
        />
      </div>
    </section>
  )
}
