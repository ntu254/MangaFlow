import { MFButton } from "@/shared/components/ui/MFButton"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import { MFCard } from "@/shared/components/ui/MFCard"
import { cn } from "@/shared/lib/utils"

export interface VoteCardOption {
  id: string
  label: string
  description?: string
  countLabel?: string
  icon?: string
  onVote?: () => void
}

interface VoteCardProps {
  title: string
  description?: string
  options: VoteCardOption[]
  resultLabel?: string
  totalVotesLabel?: string
  tieBreakRequired?: boolean
  tieBreakLabel?: string
  boardChairNote?: string
  disabled?: boolean
  loadingOptionId?: string | null
  className?: string
}

export function VoteCard({
  title,
  description,
  options,
  resultLabel,
  totalVotesLabel,
  tieBreakRequired = false,
  tieBreakLabel = "Board Chair tie-break required",
  boardChairNote = "Tie-break status is supplied by the Board workflow.",
  disabled = false,
  loadingOptionId = null,
  className,
}: VoteCardProps) {
  const actionPending = loadingOptionId !== null

  return (
    <MFCard className={className} aria-busy={actionPending}>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div className="min-w-0">
          <h2 className="text-title-lg text-on-surface">{title}</h2>
          {description ? (
            <p className="mt-xs text-body-md text-on-surface-muted">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-sm">
          {totalVotesLabel ? (
            <MFBadge tone="neutral" size="md">
              {totalVotesLabel}
            </MFBadge>
          ) : null}
          {resultLabel ? (
            <MFBadge tone="primary" size="md">
              {resultLabel}
            </MFBadge>
          ) : null}
        </div>
      </div>

      {tieBreakRequired ? (
        <div className="mt-lg rounded-xl border border-yellow/60 bg-yellow/20 p-md">
          <div className="flex flex-wrap items-center gap-sm">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              balance
            </span>
            <h3 className="text-label-md text-on-surface">{tieBreakLabel}</h3>
          </div>
          <p className="mt-xs text-body-md text-on-surface-muted">{boardChairNote}</p>
        </div>
      ) : null}

      <div className="mt-lg grid gap-md md:grid-cols-3">
        {options.map((option) => {
          const loading = loadingOptionId === option.id
          const canVote = Boolean(option.onVote)

          return (
            <div
              key={option.id}
              className={cn(
                "flex h-full flex-col rounded-xl border border-outline-variant/30 bg-surface-lowest p-md",
                "transition-colors hover:bg-primary-fixed/20",
              )}
            >
              <div className="flex items-start gap-sm">
                <span
                  className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-on-surface-muted"
                  aria-hidden="true"
                >
                  {option.icon ?? "how_to_vote"}
                </span>
                <div className="min-w-0">
                  <h3 className="break-words text-label-md text-on-surface">
                    {option.label}
                  </h3>
                  {option.description ? (
                    <p className="mt-xs text-body-md text-on-surface-muted">
                      {option.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-md flex flex-1 items-end justify-between gap-sm">
                {option.countLabel ? (
                  <MFBadge tone="secondary">{option.countLabel}</MFBadge>
                ) : (
                  <span className="text-label-sm text-on-surface-muted">Count not supplied</span>
                )}
                {canVote ? (
                  <MFButton
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={disabled || actionPending}
                    loading={loading}
                    onClick={option.onVote}
                  >
                    Vote
                  </MFButton>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </MFCard>
  )
}
