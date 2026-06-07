import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import { MFCard } from "@/shared/components/ui/MFCard"
import { submissionStatusUI, type StatusUiConfig } from "@/shared/lib/status-ui"
import { cn } from "@/shared/lib/utils"
import { StatusBadge } from "./StatusBadge"

export interface SubmissionVersionItem {
  id: string
  label: string
  submittedBy: string
  submittedAt: string
  status: string
  summary?: string
  fileName?: string
  isCurrent?: boolean
}

interface SubmissionVersionListProps {
  versions: SubmissionVersionItem[]
  title?: string
  description?: string
  selectedVersionId?: string
  onSelectVersion?: (version: SubmissionVersionItem) => void
  statusMapping?: Record<string, StatusUiConfig>
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

export function SubmissionVersionList({
  versions,
  title = "Submission versions",
  description = "Review submitted versions and their approval state.",
  selectedVersionId,
  onSelectVersion,
  statusMapping = submissionStatusUI,
  emptyTitle = "No submissions yet",
  emptyDescription = "Assistant submissions will appear here after work is sent for review.",
  className,
}: SubmissionVersionListProps) {
  if (versions.length === 0) {
    return (
      <MFCard className={className}>
        <div className="mb-lg flex flex-wrap items-start justify-between gap-md">
          <div className="min-w-0">
            <h2 className="text-title-lg text-on-surface">{title}</h2>
            <p className="mt-xs text-body-md text-on-surface-muted">{description}</p>
          </div>
          <MFBadge tone="neutral" size="md">
            No versions
          </MFBadge>
        </div>
        <MFEmptyState
          icon="history"
          title={emptyTitle}
          description={emptyDescription}
        />
      </MFCard>
    )
  }

  return (
    <MFCard className={className}>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div className="min-w-0">
          <h2 className="text-title-lg text-on-surface">{title}</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">{description}</p>
        </div>
        <MFBadge tone="primary" size="md">
          {versions.length} {versions.length === 1 ? "version" : "versions"}
        </MFBadge>
      </div>

      <ol className="mt-lg space-y-md">
        {versions.map((version) => {
          const selected = selectedVersionId === version.id
          const highlighted = selected || version.isCurrent

          return (
            <li
              key={version.id}
              className={cn(
                "rounded-xl border bg-surface-lowest p-md transition-colors",
                highlighted
                  ? "border-primary-container bg-primary-fixed/20 shadow-ambient"
                  : "border-outline-variant/30",
              )}
            >
              <div className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-sm">
                    <h3 className="break-words text-label-md text-on-surface">
                      {version.label}
                    </h3>
                    {version.isCurrent ? <MFBadge tone="primary">Current</MFBadge> : null}
                    {selected ? <MFBadge tone="secondary">Selected</MFBadge> : null}
                  </div>
                  <p className="mt-xs text-label-sm text-on-surface-muted">
                    Submitted by {version.submittedBy} - {version.submittedAt}
                  </p>
                </div>
                <StatusBadge
                  className="self-start sm:shrink-0"
                  status={version.status}
                  mapping={statusMapping}
                />
              </div>

              {version.summary ? (
                <p className="mt-md break-words text-body-md text-on-surface">
                  {version.summary}
                </p>
              ) : null}

              <div className="mt-md flex flex-col gap-sm border-t border-outline-variant/30 pt-md sm:flex-row sm:items-center sm:justify-between">
                <span className="break-words text-label-sm text-on-surface-muted">
                  {version.fileName ?? "No file label supplied"}
                </span>
                {onSelectVersion ? (
                  <MFButton
                    type="button"
                    size="sm"
                    variant={selected ? "secondary" : "outline"}
                    onClick={() => onSelectVersion(version)}
                  >
                    {selected ? "Viewing version" : "View version"}
                  </MFButton>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </MFCard>
  )
}
