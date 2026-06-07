import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFPagePreviewCard } from "@/shared/components/ui/MFPagePreviewCard"

export interface ContextPageItem {
  id: string
  pageNumber: number
  thumbnailUrl?: string
  status?: string
  label?: string
}

interface ContextPageListProps {
  pages: ContextPageItem[]
  title?: string
  description?: string
  emptyTitle?: string
  emptyDescription?: string
}

export function ContextPageList({
  pages,
  title = "Context pages",
  description = "Optional pages supplied as read-only context for this task.",
  emptyTitle = "No context pages",
  emptyDescription = "This task does not include additional context pages.",
}: ContextPageListProps) {
  return (
    <MFCard>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div className="min-w-0">
          <h2 className="text-title-lg text-on-surface">{title}</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">{description}</p>
        </div>
        <MFBadge tone="neutral" size="md">
          READ ONLY
        </MFBadge>
      </div>

      {pages.length > 0 ? (
        <div className="mt-lg grid grid-cols-2 gap-md sm:grid-cols-3 lg:grid-cols-4">
          {pages.map((page) => (
            <div key={page.id} className="min-w-0">
              <MFPagePreviewCard
                pageNumber={page.pageNumber}
                thumbnailUrl={page.thumbnailUrl}
                status={page.status}
              />
              <div className="mt-sm flex flex-wrap items-center justify-between gap-xs">
                <span className="break-words text-label-sm text-on-surface-muted">
                  {page.label ?? `Page ${page.pageNumber}`}
                </span>
                <MFBadge tone="neutral">READ ONLY</MFBadge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-lg border-t border-outline-variant/30 pt-lg">
          <MFEmptyState
            icon="auto_stories"
            title={emptyTitle}
            description={emptyDescription}
          />
        </div>
      )}
    </MFCard>
  )
}
