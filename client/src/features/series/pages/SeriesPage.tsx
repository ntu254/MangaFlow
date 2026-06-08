import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/shared/components/auth/AuthProvider"
import {
  ChapterCreationGateCard,
  ManuscriptUploadPanel,
  SeriesSummaryCard,
} from "@/shared/components/domain"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFButton, MFCard, MFIconCircle, MFSelect } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { createManuscriptUpload, listSeries } from "../api/series.api"
import type { Series } from "../api/series.types"
import { CreateSeriesDialog } from "../components/CreateSeriesDialog"

const CHAPTER_READY_STATUSES = new Set(["APPROVED", "ONGOING", "AT_RISK"])

export function SeriesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [selectedManuscripts, setSelectedManuscripts] = useState<string[]>([])
  const [uploadSeriesId, setUploadSeriesId] = useState("")
  const [uploadMessage, setUploadMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const canCreate = user?.role === "MANGAKA"

  usePageTitle("Series", "Create and manage internal manga production proposals.")

  async function loadSeries() {
    setLoading(true)
    setError("")
    try {
      const response = await listSeries()
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not load Series.")
        setSeriesList([])
        return
      }
      setSeriesList(response.data)
      setUploadSeriesId((current) => current || response.data?.[0]?.id || "")
    } catch {
      setError("Could not reach MangaFlow. Check the API server and try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSeries()
  }, [])

  function handleCreated(series: Series) {
    setSeriesList((current) => [series, ...current])
    setUploadSeriesId(series.id)
  }

  async function handleManuscriptFiles(files: FileList) {
    const file = files.item(0)
    if (!file) return

    setSelectedManuscripts([file.name])
    setUploadMessage("")

    if (!uploadSeriesId) {
      setUploadMessage("Select a Series before requesting a manuscript upload URL.")
      return
    }

    const response = await createManuscriptUpload(uploadSeriesId, {
      originalName: file.name,
      contentType: file.type,
      size: file.size,
    })

    if (!response.success || !response.data) {
      setUploadMessage(response.message ?? "Could not create manuscript upload URL.")
      return
    }

    setUploadMessage("Signed upload URL created. Direct file PUT is still manual/out of UI scope for this story.")
  }

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
              Real Series records are loaded from the backend with role-based access.
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

      {loading ? (
        <MFCard><MFSkeleton className="h-40 w-full" /></MFCard>
      ) : error ? (
        <MFErrorState title="Could not load Series" description={error} onRetry={loadSeries} />
      ) : seriesList.length > 0 ? (
        <div className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          <div className="space-y-lg">
            {seriesList.map((series) => {
              const canCreateChapter = CHAPTER_READY_STATUSES.has(series.status)
              return (
                <div key={series.id} className="space-y-md">
                  <SeriesSummaryCard
                    title={series.title}
                    status={series.status}
                    genre={series.genres.length > 0 ? series.genres.join(", ") : "Unclassified"}
                    publicationType="Not supplied yet"
                    description={series.synopsis}
                    ownerLabel={series.ownerId === user?.id ? "Current Mangaka" : "Series owner"}
                    metadata={[`Slug: ${series.slug}`, `Updated: ${new Date(series.updatedAt).toLocaleDateString()}`]}
                    action={<MFButton type="button" variant="outline" size="sm" onClick={() => navigate(`/app/series/${series.id}`)}>Open detail</MFButton>}
                  />
                  <ChapterCreationGateCard
                    seriesTitle={series.title}
                    canCreateChapter={canCreateChapter}
                    reason="Chapter creation stays disabled until backend Board approval reports APPROVED, ONGOING, or AT_RISK."
                  />
                </div>
              )
            })}
          </div>

          <div className="space-y-lg">
            <MFCard>
              <MFSelect
                label="Manuscript target Series"
                value={uploadSeriesId}
                onChange={(event) => setUploadSeriesId(event.target.value)}
                disabled={seriesList.length === 0}
              >
                {seriesList.map((series) => (
                  <option key={series.id} value={series.id}>{series.title}</option>
                ))}
              </MFSelect>
            </MFCard>
            <ManuscriptUploadPanel
              constraints={[
                "Backend returns a private signed upload URL; no base64 is stored.",
                "New manuscript versions create new Manuscript/FileAsset records.",
                "Only the owning Mangaka can request initial manuscript upload URLs.",
              ]}
              accept=".pdf,.zip,.jpg,.jpeg,.png"
              onFilesSelected={(files) => void handleManuscriptFiles(files)}
            />
            {uploadMessage ? <MFBadge tone="neutral" size="md">{uploadMessage}</MFBadge> : null}
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
          title={canCreate ? "No Series proposals yet" : "No permitted Series"}
          description={canCreate ? "Create a draft proposal to begin." : "Series appear only when backend access rules permit them."}
          action={canCreate ? <MFButton variant="outline" onClick={() => setIsCreateOpen(true)}>Create draft</MFButton> : undefined}
        />
      )}

      <CreateSeriesDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={handleCreated} />
    </PageShell>
  )
}

