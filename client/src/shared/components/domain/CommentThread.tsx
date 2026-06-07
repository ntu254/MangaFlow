import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import { MFCard } from "@/shared/components/ui/MFCard"
import { commentStatusUI, type StatusUiConfig } from "@/shared/lib/status-ui"
import { cn } from "@/shared/lib/utils"
import { StatusBadge } from "./StatusBadge"

export interface CommentThreadAction {
  id?: string
  label: string
  onClick: () => void
  disabled?: boolean
}

export interface CommentThreadItem {
  id: string
  authorName: string
  authorRole?: string
  body: string
  status: string
  createdAt?: string
  targetLabel?: string
  isUnresolved?: boolean
  actions?: CommentThreadAction[]
}

interface CommentThreadProps {
  comments: CommentThreadItem[]
  title?: string
  description?: string
  statusMapping?: Record<string, StatusUiConfig>
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

export function CommentThread({
  comments,
  title = "Comments",
  description = "Track review issues and resolution progress.",
  statusMapping = commentStatusUI,
  emptyTitle = "No comments yet",
  emptyDescription = "Review comments and issue notes will appear here when they are created.",
  className,
}: CommentThreadProps) {
  const unresolvedCount = comments.filter((comment) => comment.isUnresolved).length

  if (comments.length === 0) {
    return (
      <MFCard className={className}>
        <div className="mb-lg flex flex-wrap items-start justify-between gap-md">
          <div className="min-w-0">
            <h2 className="text-title-lg text-on-surface">{title}</h2>
            <p className="mt-xs text-body-md text-on-surface-muted">{description}</p>
          </div>
          <MFBadge tone="neutral" size="md">
            No comments
          </MFBadge>
        </div>
        <MFEmptyState
          icon="forum"
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
        <MFBadge tone={unresolvedCount > 0 ? "warning" : "success"} size="md">
          {unresolvedCount > 0 ? `${unresolvedCount} unresolved` : "All resolved"}
        </MFBadge>
      </div>

      <ol className="mt-lg space-y-md">
        {comments.map((comment) => (
          <li
            key={comment.id}
            className={cn(
              "rounded-xl border bg-surface-lowest p-md",
              comment.isUnresolved
                ? "border-error-container shadow-ambient"
                : "border-outline-variant/30",
            )}
          >
            <div className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-sm">
                  <h3 className="text-label-md text-on-surface">{comment.authorName}</h3>
                  {comment.authorRole ? (
                    <span className="text-label-sm text-on-surface-muted">
                      {comment.authorRole}
                    </span>
                  ) : null}
                  {comment.isUnresolved ? (
                    <MFBadge tone="warning">Unresolved</MFBadge>
                  ) : null}
                </div>
                <div className="mt-xs flex flex-wrap items-center gap-sm text-label-sm text-on-surface-muted">
                  {comment.targetLabel ? <span>{comment.targetLabel}</span> : null}
                  {comment.createdAt ? <span>{comment.createdAt}</span> : null}
                </div>
              </div>
              <StatusBadge
                className="self-start sm:shrink-0"
                status={comment.status}
                mapping={statusMapping}
              />
            </div>

            <p className="mt-md whitespace-pre-wrap break-words text-body-md text-on-surface">
              {comment.body}
            </p>

            {comment.actions && comment.actions.length > 0 ? (
              <div className="mt-md flex flex-wrap gap-sm border-t border-outline-variant/30 pt-md">
                {comment.actions.map((action) => (
                  <MFButton
                    key={action.id ?? action.label}
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={action.disabled}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </MFButton>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </MFCard>
  )
}
