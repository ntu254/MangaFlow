import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/shared/components/auth/AuthProvider"
import { ManuscriptUploadPanel } from "@/shared/components/domain"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFButton, MFCard, MFIconCircle, MFSelect } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { CreateSeriesDialog } from "../components/CreateSeriesDialog"
import { SeriesListPanel } from "../components/SeriesListPanel"
import { useSeriesPage } from "../hooks/useSeriesPage"

export function SeriesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const canCreate = user?.role === "MANGAKA"
  const page = useSeriesPage(user?.id)

  usePageTitle("Series", "Create and manage internal manga production proposals.")

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-lg sm:flex-row sm:items-center">
          <MFIconCircle variant="primary" size="lg">
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">auto_stories</span>
          </MFIconCircle>
          <div className="min-w-0 flex-1">
            <h2 className="text-headline-md text-on-surface">Series proposals</h2>
            <p className="mt-sm max-w-2xl text-body-md text-on-surface-muted">Real Series records are loaded from the backend with role-based access.</p>
          </div>
          {canCreate ? <MFButton className="self-start focus-visible:shadow-focus sm:self-center" onClick={() => setIsCreateOpen(true)}><span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>Create Series</MFButton> : null}
        </div>
      </MFCard>

      {page.loading ? (
        <MFCard><MFSkeleton className="h-40 w-full" /></MFCard>
      ) : page.error ? (
        <MFErrorState title="Could not load Series" description={page.error} onRetry={page.loadSeries} />
      ) : page.seriesList.length > 0 ? (
        <div className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          <SeriesListPanel rows={page.seriesRows} onOpenDetail={(seriesId) => navigate(`/app/series/${seriesId}`)} />
          <div className="space-y-lg">
            <MFCard><MFSelect label="Manuscript target Series" value={page.uploadSeriesId} onChange={(event) => page.setUploadSeriesId(event.target.value)}>{page.uploadOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</MFSelect></MFCard>
            <ManuscriptUploadPanel constraints={["Backend returns a private signed upload URL; no base64 is stored.", "New manuscript versions create new Manuscript/FileAsset records.", "Only the owning Mangaka can request initial manuscript upload URLs."]} accept=".pdf,.zip,.jpg,.jpeg,.png" onFilesSelected={(files) => void page.handleManuscriptFiles(files)} />
            {page.uploadMessage ? <MFBadge tone="neutral" size="md">{page.uploadMessage}</MFBadge> : null}
            {page.selectedManuscripts.length > 0 ? <MFCard><h3 className="text-title-lg text-on-surface">Selected locally</h3><ul className="mt-md list-disc space-y-xs pl-lg text-body-md text-on-surface-muted">{page.selectedManuscripts.map((fileName) => <li key={fileName} className="break-words">{fileName}</li>)}</ul><p className="mt-md text-label-sm text-on-surface-muted">These filenames are local preview only; no upload request has been sent.</p></MFCard> : null}
          </div>
        </div>
      ) : (
        <MFEmptyState icon="library_add" title={canCreate ? "No Series proposals yet" : "No permitted Series"} description={canCreate ? "Create a draft proposal to begin." : "Series appear only when backend access rules permit them."} action={canCreate ? <MFButton variant="outline" onClick={() => setIsCreateOpen(true)}>Create draft</MFButton> : undefined} />
      )}

      <CreateSeriesDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={page.handleCreated} />
    </PageShell>
  )
}
