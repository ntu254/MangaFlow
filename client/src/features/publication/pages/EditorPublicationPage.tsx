import { useEffect, useMemo, useState } from "react"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFButton, MFCard, MFSelect } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { listSeries } from "@/features/series/api/series.api"
import type { Series } from "@/features/series/api/series.types"
import { getChapterReadiness, listChaptersBySeries, type Chapter, type ChapterReadinessResponse } from "@/features/chapter/api/chapter.api"
import { createPublication, publishPublication, type PublicationRecord } from "@/features/chapter/api/publication.api"

export function EditorPublicationPage() {
  const [series, setSeries] = useState<Series[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [seriesId, setSeriesId] = useState("")
  const [chapterId, setChapterId] = useState("")
  const [readiness, setReadiness] = useState<ChapterReadinessResponse | null>(null)
  const [publication, setPublication] = useState<PublicationRecord | null>(null)
  const [scheduledFor, setScheduledFor] = useState("")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  usePageTitle("Publication", "Schedule chapters and publish only after backend readiness passes.")

  async function loadSeries() {
    setLoading(true)
    setError(null)
    const res = await listSeries()
    if (!res.success) setError(res.message ?? "Could not load series")
    else {
      const items = res.data ?? []
      setSeries(items)
      setSeriesId((current) => current || String(items[0]?.id ?? ""))
    }
    setLoading(false)
  }

  useEffect(() => { void loadSeries() }, [])

  useEffect(() => {
    if (!seriesId) return
    void (async () => {
      setReadiness(null)
      setPublication(null)
      const res = await listChaptersBySeries(seriesId)
      if (res.success) {
        const items = res.data ?? []
        setChapters(items)
        setChapterId(String(items[0]?.id ?? ""))
      } else setError(res.message ?? "Could not load chapters")
    })()
  }, [seriesId])

  useEffect(() => {
    if (!chapterId) return
    void (async () => {
      const res = await getChapterReadiness(chapterId)
      if (res.success) setReadiness(res.data ?? null)
      else setError(res.message ?? "Could not load readiness")
    })()
  }, [chapterId])

  const chapterOptions = useMemo(() => chapters.map((chapter) => ({ value: String(chapter.id ?? chapter._id), label: `Chapter ${chapter.chapterNumber}: ${chapter.title}` })), [chapters])

  async function handleCreatePublication() {
    setMessage(null)
    const res = await createPublication(chapterId, scheduledFor || undefined)
    if (!res.success) setMessage(res.message ?? "Could not create publication")
    else {
      setPublication(res.data ?? null)
      setMessage("Publication schedule saved.")
      const fresh = await getChapterReadiness(chapterId)
      if (fresh.success) setReadiness(fresh.data ?? null)
    }
  }

  async function handlePublish() {
    if (!publication?.id) return
    const res = await publishPublication(publication.id)
    setMessage(res.success ? "Chapter published." : (res.message ?? "Could not publish"))
  }

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <MFBadge tone="primary">Editor</MFBadge>
        <h1 className="mt-md text-headline-lg text-on-surface">Publication control</h1>
        <p className="mt-sm text-body-md text-on-surface-muted">Backend owns readiness; UI schedules and triggers explicit publish actions.</p>
      </MFCard>

      {loading ? <MFCard><MFSkeleton className="h-40 w-full" /></MFCard> : null}
      {error ? <MFErrorState title="Publication data unavailable" description={error} onRetry={() => void loadSeries()} /> : null}
      {!loading && !error && series.length === 0 ? <MFEmptyState icon="event_busy" title="No series available" description="Publication starts after an approved production series has chapters." /> : null}

      {!loading && !error && series.length > 0 ? (
        <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
          <MFCard>
            <div className="grid gap-md md:grid-cols-2">
              <MFSelect label="Series" value={seriesId} onChange={(event) => setSeriesId(event.target.value)}>
                {series.map((item) => <option key={String(item.id)} value={String(item.id)}>{item.title}</option>)}
              </MFSelect>
              <MFSelect label="Chapter" value={chapterId} onChange={(event) => setChapterId(event.target.value)}>
                {chapterOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </MFSelect>
            </div>
            <label className="mt-md block text-label-md text-on-surface">Publication date</label>
            <input className="mt-xs w-full rounded-2xl border border-outline bg-surface px-md py-sm text-body-md" type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} />
            <div className="mt-md flex flex-wrap gap-sm">
              <MFButton type="button" onClick={handleCreatePublication} disabled={!chapterId}>Save schedule</MFButton>
              <MFButton type="button" variant="outline" onClick={handlePublish} disabled={!publication?.id || !readiness?.ready}>Publish</MFButton>
            </div>
            {message ? <p className="mt-md text-body-sm text-on-surface-muted">{message}</p> : null}
          </MFCard>

          <MFCard>
            <h2 className="text-title-lg text-on-surface">Readiness</h2>
            {readiness ? <MFBadge tone={readiness.ready ? "success" : "warning"}>{readiness.ready ? "Ready" : "Blocked"}</MFBadge> : null}
            <div className="mt-md grid gap-sm">
              {readiness?.items.map((item) => (
                <div key={item.key} className="rounded-2xl border border-outline bg-surface-container p-md">
                  <div className="flex items-center justify-between gap-sm"><span className="text-label-lg text-on-surface">{item.key}</span><MFBadge tone={item.passed ? "success" : "warning"}>{item.passed ? "Pass" : "Block"}</MFBadge></div>
                  <p className="mt-xs text-body-sm text-on-surface-muted">{item.reason}</p>
                </div>
              ))}
            </div>
          </MFCard>
        </section>
      ) : null}
    </PageShell>
  )
}