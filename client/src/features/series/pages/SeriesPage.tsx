import { useState } from "react"
import { useAuth } from "@/shared/components/auth/AuthProvider"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { StatusBadge } from "@/shared/components/domain/StatusBadge"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFIconCircle } from "@/shared/components/ui/MFIconCircle"
import { PageShell } from "@/shared/components/layout/PageShell"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { seriesStatusUI } from "@/shared/lib/status-ui"
import type { Series } from "../api/series.types"
import { CreateSeriesDialog } from "../components/CreateSeriesDialog"

export function SeriesPage() {
  const { user } = useAuth()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createdSeries, setCreatedSeries] = useState<Series | null>(null)
  const canCreate = user?.role === "MANGAKA"

  usePageTitle("Series", "Create and manage internal manga production proposals.")

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-lg sm:flex-row sm:items-center">
          <MFIconCircle variant="primary" size="lg">
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
              auto_stories
            </span>
          </MFIconCircle>
          <div className="min-w-0 flex-1">
            <h2 className="text-headline-md text-on-surface">Series proposals</h2>
            <p className="mt-sm max-w-2xl text-body-md text-on-surface-muted">
              Create the internal Series profile that begins MangaFlow's editorial workflow.
            </p>
          </div>
          {canCreate ? (
            <MFButton
              className="self-start focus-visible:shadow-focus sm:self-center"
              onClick={() => setIsCreateOpen(true)}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                add
              </span>
              Create Series
            </MFButton>
          ) : null}
        </div>
      </MFCard>

      {createdSeries ? (
        <MFCard className="rounded-3xl">
          <div className="flex flex-wrap items-start justify-between gap-md">
            <div className="min-w-0">
              <p className="text-label-sm text-on-surface-muted">Created this session</p>
              <h3 className="mt-sm break-words text-title-lg text-on-surface">
                {createdSeries.title}
              </h3>
            </div>
            <StatusBadge status={createdSeries.status} mapping={seriesStatusUI} />
          </div>
          <p className="mt-md text-body-md text-on-surface-muted">{createdSeries.synopsis}</p>
          {createdSeries.genres.length > 0 ? (
            <div className="mt-md flex flex-wrap gap-sm">
              {createdSeries.genres.map((genre) => (
                <MFBadge key={genre} tone="secondary">
                  {genre}
                </MFBadge>
              ))}
            </div>
          ) : null}
          <div className="mt-lg rounded-xl bg-surface-low px-md py-sm text-label-sm text-on-surface-muted">
            This draft is shown from the create response. A persisted Series list requires the
            future query endpoint.
          </div>
        </MFCard>
      ) : (
        <MFEmptyState
          icon="library_add"
          title={canCreate ? "No Series created in this session" : "Series list is not connected yet"}
          description={
            canCreate
              ? "Create a draft proposal to begin. Existing Series will appear when the query endpoint is available."
              : "This workspace will display permitted Series when the query endpoint is available."
          }
          action={
            canCreate ? (
              <MFButton variant="outline" onClick={() => setIsCreateOpen(true)}>
                Create draft
              </MFButton>
            ) : undefined
          }
        />
      )}

      <CreateSeriesDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={setCreatedSeries}
      />
    </PageShell>
  )
}
