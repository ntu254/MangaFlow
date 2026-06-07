import type { ReactNode } from "react"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFProgress } from "@/shared/components/ui/MFProgress"
import { chapterStatusUI } from "@/shared/lib/status-ui"
import { StatusBadge } from "./StatusBadge"

interface ChapterProgressCardProps {
  title: string
  status: string
  completed: number
  total: number
  description?: string
  progressLabel?: string
  action?: ReactNode
}

export function ChapterProgressCard({
  title,
  status,
  completed,
  total,
  description,
  progressLabel = "Production progress",
  action,
}: ChapterProgressCardProps) {
  const safeTotal = Number.isFinite(total) ? Math.max(0, total) : 0
  const safeCompleted = Number.isFinite(completed)
    ? Math.min(Math.max(0, completed), safeTotal)
    : 0

  return (
    <MFCard className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div className="min-w-0">
          <h3 className="break-words text-title-lg text-on-surface">{title}</h3>
          {description ? (
            <p className="mt-sm text-body-md text-on-surface-muted">{description}</p>
          ) : null}
        </div>
        <StatusBadge status={status} mapping={chapterStatusUI} />
      </div>

      <div className="mt-lg">
        <div className="mb-sm flex flex-wrap items-center justify-between gap-sm">
          <span className="text-label-sm text-on-surface-muted">{progressLabel}</span>
          <span className="text-label-sm text-on-surface">
            {safeCompleted} of {safeTotal}
          </span>
        </div>
        <MFProgress value={safeCompleted} max={safeTotal} tone="primary" />
      </div>

      {action ? (
        <div className="mt-lg flex border-t border-outline-variant/30 pt-md">{action}</div>
      ) : null}
    </MFCard>
  )
}
