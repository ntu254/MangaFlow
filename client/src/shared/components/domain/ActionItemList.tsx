import type { ReactNode } from "react"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFIconCircle } from "@/shared/components/ui/MFIconCircle"
import type { StatusUiConfig } from "@/shared/lib/status-ui"
import { StatusBadge } from "./StatusBadge"

export interface ActionItem {
  id: string
  title: string
  description?: string
  metadata?: string
  icon?: string
  status?: string
  actionLabel?: string
  onAction?: () => void
}

interface ActionItemListProps {
  items: ActionItem[]
  statusMapping?: Record<string, StatusUiConfig>
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
}

export function ActionItemList({
  items,
  statusMapping,
  emptyTitle = "No pending actions",
  emptyDescription = "New workflow actions will appear here when they are available.",
  emptyAction,
}: ActionItemListProps) {
  if (items.length === 0) {
    return (
      <MFEmptyState
        icon="task_alt"
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  return (
    <MFCard padding="sm">
      <ul className="divide-y divide-outline-variant/30">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-md px-sm py-md sm:flex-row sm:items-center"
          >
            <MFIconCircle variant="surface" size="sm" className="shrink-0">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                {item.icon ?? "assignment"}
              </span>
            </MFIconCircle>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-sm">
                <h3 className="text-label-md text-on-surface">{item.title}</h3>
                {item.status ? (
                  <StatusBadge status={item.status} mapping={statusMapping ?? {}} />
                ) : null}
              </div>
              {item.description ? (
                <p className="mt-xs text-body-md text-on-surface-muted">{item.description}</p>
              ) : null}
              {item.metadata ? (
                <p className="mt-xs text-label-sm text-on-surface-muted">{item.metadata}</p>
              ) : null}
            </div>
            {item.actionLabel && item.onAction ? (
              <MFButton
                className="self-start focus-visible:shadow-focus sm:self-center"
                size="sm"
                variant="outline"
                onClick={item.onAction}
              >
                {item.actionLabel}
              </MFButton>
            ) : null}
          </li>
        ))}
      </ul>
    </MFCard>
  )
}
