import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/shared/components/auth/AuthProvider"
import { ChapterCreationGateCard, ManuscriptUploadPanel, SeriesSummaryCard } from "@/shared/components/domain"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFIconCircle } from "@/shared/components/ui/MFIconCircle"
import { PageShell } from "@/shared/components/layout/PageShell"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { listSeries } from "../api/series.api"
import type { Series } from "../api/series.types"
import { CreateSeriesDialog } from "../components/CreateSeriesDialog"

const CHAPTER_READY_STATUSES = new Set(["APPROVED", "ONGOING", "AT_RISK"])

function SeriesCard({ series }: { series: Series }) {
  return (
    <SeriesSummaryCard
      title={series.title}
      status={series.status}
      genre={series.genres.length > 0 ? series.genres.join(", ") : "Unclassified"}
      publicationType="Not supplied yet"
      description={series.synopsis}
      ownerLabel="Series owner"
      metadata={[`Slug: ${series.slug}`, `Updated: ${new Date(series.updatedAt).toLocaleDateString()}`]}
      action={
        <Link to={`/app/series/${series.id}`}>
          <MFButton variant="outline" size="sm">View detail</MFButton>
        </Link>
      }
      statusMapping={undefined}
    />
  )
}

export function SeriesPage() {
  const { user } = useAuth()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedManuscripts, setSelectedManuscripts] = useState<string[]>([])
  const canCreate = user?.role === "MANGAKA"

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["series"],
    queryFn: async () => {
      const res = await listSeries()
      if (!res.success || !res.data) throw new Error(res.message ?? "Could not load Series")
      return res.data
    },
    enabled: Boolean(user),
  })

  usePageTitle("Series", "Create and manage internal manga production proposals.")

  const series = data ?? []
  const firstSeries = series[0]

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-lg sm:flex-row sm:items-center">
          <MFIconCircle variant="primary" size="lg">
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">auto_stories</span>
          </MFIconCircle>
          <div className="min-w-0 flex-1">
            <h2 className="text-headline-md text-on-surface">Series proposals</h2>
            <p className="mt-sm max-w-2xl text-body-md text-on-surface-muted">
              Live Series records from the backend. Assistant Series access stays task-scoped only.
            </p>
          </div>
          {canCreate ? (
            <MFButton className="self-start focus-visible:shadow-focus sm:self-center" onClick={() => setIsCreateOpen(true)}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
              Create Series
            </MFButton>
          ) : null}
        </div>
      </MFCard>

      {isLoading ? (
        <MFCard><MFSkeleton className="h-28 w-full" /></MFCard>
      ) : isError ? (
        <MFErrorState title="Could not load Series" description="Check API/server auth, then retry." onRetry={() => void refetch()} />
      ) : series.length > 0 ? (
        <div className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          <div className="space-y-lg">
            {series.map((item) => <SeriesCard key={item.id} series={item} />)}
            {firstSeries ? (
              <ChapterCreationGateCard
                seriesTitle={firstSeries.title}
                canCreateChapter={CHAPTER_READY_STATUSES.has(firstSeries.status)}
                reason="Chapter creation remains backend-gated by approved, ongoing, or at-risk Series status."
              />
            ) : null}
          </div>

          <div className="space-y-lg">
            <ManuscriptUploadPanel
              constraints={[
                "Upload/storage API is not connected in this screen yet.",
                "Submit still requires the backend manuscript workflow.",
                "Original files must be stored unchanged with private access.",
              ]}
              accept=".pdf,.zip,.jpg,.jpeg,.png"
              multiple
              onFilesSelected={(files) => setSelectedManuscripts(Array.from(files, (file) => file.name))}
            />
            {selectedManuscripts.length > 0 ? (
              <MFCard>
                <h3 className="text-title-lg text-on-surface">Selected locally</h3>
                <ul className="mt-md list-disc space-y-xs pl-lg text-body-md text-on-surface-muted">
                  {selectedManuscripts.map((fileName) => <li key={fileName} className="break-words">{fileName}</li>)}
                </ul>
                <p className="mt-md text-label-sm text-on-surface-muted">These filenames are local preview only; no upload request has been sent.</p>
              </MFCard>
            ) : null}
          </div>
        </div>
      ) : (
        <MFEmptyState
          icon="library_add"
          title={canCreate ? "No Series yet" : "No permitted Series"}
          description={canCreate ? "Create a draft proposal to begin." : "Permitted Series records will appear here when available."}
          action={canCreate ? <MFButton variant="outline" onClick={() => setIsCreateOpen(true)}>Create draft</MFButton> : undefined}
        />
      )}

      <CreateSeriesDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={() => void refetch()} />
    </PageShell>
  )
}
