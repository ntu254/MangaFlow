import { MFButton } from "@/shared/components/ui/MFButton"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import { MFCard } from "@/shared/components/ui/MFCard"

export interface ChapterCreationGateCardProps {
  seriesTitle: string
  canCreateChapter: boolean
  reason?: string
  onCreateChapter?: () => void
  loading?: boolean
  actionLabel?: string
}

export function ChapterCreationGateCard({
  seriesTitle,
  canCreateChapter,
  reason,
  onCreateChapter,
  loading = false,
  actionLabel = "Create chapter",
}: ChapterCreationGateCardProps) {
  const actionDisabled = !canCreateChapter || !onCreateChapter || loading

  return (
    <MFCard>
      <div className="flex flex-col gap-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-sm">
            <h2 className="break-words text-title-lg text-on-surface">
              Chapter creation
            </h2>
            <MFBadge tone={canCreateChapter ? "success" : "warning"} size="md">
              {canCreateChapter ? "Available" : "Blocked"}
            </MFBadge>
          </div>
          <p className="mt-xs break-words text-body-md text-on-surface-muted">
            {canCreateChapter
              ? `New chapters can be created for ${seriesTitle}.`
              : reason ?? "Chapter creation is disabled for this series."}
          </p>
        </div>
        <MFButton
          type="button"
          disabled={actionDisabled}
          loading={loading}
          onClick={onCreateChapter}
        >
          {actionLabel}
        </MFButton>
      </div>
    </MFCard>
  )
}
