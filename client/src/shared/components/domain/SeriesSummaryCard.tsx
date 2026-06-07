import type { ReactNode } from "react"
import { MFCard } from "@/shared/components/ui/MFCard"
import { seriesStatusUI, type StatusUiConfig } from "@/shared/lib/status-ui"
import { StatusBadge } from "./StatusBadge"

export interface SeriesSummaryCardProps {
  title: string
  status: string
  genre: string
  publicationType: string
  description?: string
  ownerLabel?: string
  metadata?: string[]
  action?: ReactNode
  statusMapping?: Record<string, StatusUiConfig>
}

export function SeriesSummaryCard({
  title,
  status,
  genre,
  publicationType,
  description,
  ownerLabel,
  metadata = [],
  action,
  statusMapping = seriesStatusUI,
}: SeriesSummaryCardProps) {
  return (
    <MFCard>
      <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-sm">
            <h2 className="break-words text-title-lg text-on-surface">{title}</h2>
            <StatusBadge status={status} mapping={statusMapping} size="md" />
          </div>
          {description ? (
            <p className="mt-sm break-words text-body-md text-on-surface-muted">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <dl className="mt-lg grid gap-md sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-surface-low p-md">
          <dt className="text-label-sm text-on-surface-muted">Genre</dt>
          <dd className="mt-xs break-words text-label-md text-on-surface">{genre}</dd>
        </div>
        <div className="rounded-xl bg-surface-low p-md">
          <dt className="text-label-sm text-on-surface-muted">Publication type</dt>
          <dd className="mt-xs break-words text-label-md text-on-surface">
            {publicationType}
          </dd>
        </div>
        {ownerLabel ? (
          <div className="rounded-xl bg-surface-low p-md">
            <dt className="text-label-sm text-on-surface-muted">Owner</dt>
            <dd className="mt-xs break-words text-label-md text-on-surface">
              {ownerLabel}
            </dd>
          </div>
        ) : null}
      </dl>

      {metadata.length > 0 ? (
        <div className="mt-lg flex flex-wrap gap-sm border-t border-outline-variant/30 pt-md">
          {metadata.map((item) => (
            <span
              key={item}
              className="rounded-full bg-surface-container px-md py-xs text-label-sm text-on-surface-muted"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </MFCard>
  )
}
