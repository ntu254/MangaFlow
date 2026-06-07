import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFProgress } from "@/shared/components/ui/MFProgress"

export interface PublicationReadinessItem {
  id: string
  label: string
  passed: boolean
  description?: string
}

interface PublicationReadinessChecklistProps {
  items: PublicationReadinessItem[]
  title?: string
  description?: string
}

export function PublicationReadinessChecklist({
  items,
  title = "Publication readiness",
  description = "Review the supplied checks before scheduling publication.",
}: PublicationReadinessChecklistProps) {
  const passedCount = items.reduce((count, item) => count + Number(item.passed), 0)
  const hasChecks = items.length > 0
  const isReady = hasChecks && passedCount === items.length
  const summaryLabel = hasChecks ? (isReady ? "Ready" : "Blocked") : "Not evaluated"
  const summaryTone = hasChecks ? (isReady ? "success" : "warning") : "neutral"

  return (
    <MFCard>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div className="min-w-0">
          <h2 className="text-title-lg text-on-surface">{title}</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">{description}</p>
        </div>
        <MFBadge tone={summaryTone} size="md">
          {summaryLabel}
        </MFBadge>
      </div>

      {hasChecks ? (
        <>
          <div className="mt-lg">
            <MFProgress
              value={passedCount}
              max={items.length}
              label={`${passedCount} of ${items.length} checks passed`}
              tone={isReady ? "success" : "warning"}
            />
          </div>

          <ul className="mt-lg divide-y divide-outline-variant/30 border-t border-outline-variant/30">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-sm py-md sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 gap-sm">
                  <span
                    className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-on-surface-muted"
                    aria-hidden="true"
                  >
                    {item.passed ? "check_circle" : "error"}
                  </span>
                  <div className="min-w-0">
                    <h3 className="break-words text-label-md text-on-surface">{item.label}</h3>
                    {item.description ? (
                      <p className="mt-xs text-body-md text-on-surface-muted">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <MFBadge
                  className="ml-7 self-start sm:ml-0 sm:shrink-0"
                  tone={item.passed ? "success" : "danger"}
                >
                  {item.passed ? "Passed" : "Blocking"}
                </MFBadge>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-lg border-t border-outline-variant/30 pt-lg">
          <MFEmptyState
            icon="fact_check"
            title="Readiness not evaluated"
            description="Checks will appear after the review workflow supplies a readiness result."
          />
        </div>
      )}
    </MFCard>
  )
}
