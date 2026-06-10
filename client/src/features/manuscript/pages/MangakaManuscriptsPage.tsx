import { useEffect, useMemo, useState } from "react"
import { ManuscriptUploadPanel } from "@/shared/components/domain"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFButton, MFCard, MFSelect } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { createManuscriptUpload, listSeries, submitSeries } from "@/features/series/api/series.api"
import type { Series } from "@/features/series/api/series.types"

function statusTone(status: string) {
  if (["APPROVED", "ONGOING"].includes(status)) return "success" as const
  if (["REVISION_REQUESTED", "EDITOR_REVIEW", "BOARD_REVIEW"].includes(status)) return "warning" as const
  if (["REJECTED", "CANCELLED"].includes(status)) return "danger" as const
  return "neutral" as const
}

export function MangakaManuscriptsPage() {
  const [series, setSeries] = useState<Series[]>([])
  const [seriesId, setSeriesId] = useState("")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [manuscriptId, setManuscriptId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  usePageTitle("Manuscripts", "Upload initial manuscripts and submit series into editor review.")

  async function load() {
    setLoading(true)
    setError(null)
    const res = await listSeries()
    if (!res.success) setError(res.message ?? "Could not load series")
    else {
      const rows = res.data ?? []
      setSeries(rows)
      setSeriesId((current) => current || rows[0]?.id || "")
    }
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const activeSeries = useMemo(() => series.find((item) => item.id === seriesId), [series, seriesId])
  const canSubmit = activeSeries?.status === "DRAFT" || activeSeries?.status === "REVISION_REQUESTED"

  async function handleFiles(files: FileList) {
    const file = files.item(0)
    if (!file || !seriesId) return
    setUploading(true)
    setError(null)
    setMessage(null)
    setSelectedFile(file.name)

    const signed = await createManuscriptUpload(seriesId, {
      originalName: file.name,
      contentType: file.type || "application/pdf",
      size: file.size,
    })
    if (!signed.success || !signed.data) {
      setMessage(signed.message ?? "Could not create signed upload URL")
      setUploading(false)
      return
    }

    const uploadRes = await fetch(signed.data.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/pdf" },
      body: file,
    })
    if (!uploadRes.ok) {
      setMessage("Signed upload URL was created, but direct file upload failed.")
      setUploading(false)
      return
    }

    setManuscriptId(signed.data.manuscriptId)
    setMessage("Manuscript uploaded. Submit the series when ready for Editor review.")
    setUploading(false)
  }

  async function handleSubmit() {
    if (!seriesId) return
    setMessage(null)
    const res = await submitSeries(seriesId)
    if (!res.success) setMessage(res.message ?? "Could not submit series")
    else {
      setMessage("Series submitted for Editor review.")
      await load()
    }
  }

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <MFBadge tone="primary">Mangaka</MFBadge>
        <h1 className="mt-md text-headline-lg text-on-surface">Manuscript intake</h1>
        <p className="mt-sm text-body-md text-on-surface-muted">Upload manuscripts through private signed URLs. Backend owns submission gates.</p>
      </MFCard>

      {loading ? <MFCard><MFSkeleton className="h-40 w-full" /></MFCard> : null}
      {error ? <MFErrorState title="Could not load manuscripts" description={error} onRetry={() => void load()} /> : null}
      {!loading && !error && series.length === 0 ? <MFEmptyState icon="description" title="No series yet" description="Create a series draft before uploading a manuscript." /> : null}

      {!loading && !error && series.length > 0 ? (
        <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-lg">
            <MFCard>
              <MFSelect label="Target series" value={seriesId} onChange={(event) => setSeriesId(event.target.value)}>
                {series.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </MFSelect>
              {activeSeries ? (
                <div className="mt-md flex flex-wrap items-center gap-sm">
                  <MFBadge tone={statusTone(activeSeries.status)}>{activeSeries.status}</MFBadge>
                  <span className="text-body-sm text-on-surface-muted">{activeSeries.synopsis}</span>
                </div>
              ) : null}
            </MFCard>
            <ManuscriptUploadPanel
              title="Upload manuscript file"
              description="Request a backend signed URL, then upload the selected file directly to private storage."
              accept=".pdf,.zip,.jpg,.jpeg,.png,.webp"
              disabled={uploading || !seriesId}
              constraints={[
                "Backend creates Manuscript and FileAsset records before the direct upload.",
                "Files go to private storage by signed URL; no base64 is stored in the DB.",
                "Only the owning Mangaka can request manuscript upload URLs.",
              ]}
              onFilesSelected={(files) => void handleFiles(files)}
            />
          </div>

          <MFCard>
            <h2 className="text-title-lg text-on-surface">Submit workflow</h2>
            <div className="mt-md grid gap-sm text-body-md text-on-surface-muted">
              <p>Selected file: {selectedFile ?? "None"}</p>
              <p>Manuscript id: {manuscriptId ?? "Pending upload"}</p>
              <p>Submit allowed while Series is DRAFT or REVISION_REQUESTED.</p>
            </div>
            <MFButton className="mt-lg w-full" type="button" onClick={handleSubmit} disabled={!canSubmit || uploading}>Submit for Editor review</MFButton>
            {message ? <p className="mt-md text-body-sm text-on-surface-muted">{message}</p> : null}
          </MFCard>
        </section>
      ) : null}
    </PageShell>
  )
}