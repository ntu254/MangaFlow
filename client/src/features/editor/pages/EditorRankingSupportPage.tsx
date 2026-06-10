import { useCallback, useEffect, useState } from "react"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { RankingTable } from "@/shared/components/domain"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { toRankingRows } from "@/features/board/utils/board-page.mappers"
import { listMangakaRankings, type RankingRecord } from "@/features/ranking/api/ranking.api"

export function EditorRankingSupportPage() {
  const [rankings, setRankings] = useState<RankingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await listMangakaRankings()
    if (!res.success) {
      setError(res.message ?? "Could not load ranking data")
      setRankings([])
    } else {
      setRankings(res.data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  usePageTitle(
    "Ranking Support",
    "View ranking records and provide editorial context for Board import workflows.",
  )

  const rows = toRankingRows(rankings)

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-wrap gap-sm">
          <MFBadge tone="primary" size="md">Editor only</MFBadge>
          <MFBadge tone="success" size="md">Backend enforced</MFBadge>
        </div>
        <h1 className="mt-md text-headline-lg text-on-surface">Ranking support</h1>
        <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
          View current ranking records from the Board import workflow. Editor provides editorial context; final ranking import and finalization is Board-owned.
        </p>
      </MFCard>

      {error ? (
        <MFErrorState title="Could not load ranking data" description={error} onRetry={() => void load()} />
      ) : (
        <RankingTable
          rows={rows}
          loading={loading}
          caption="Editor ranking support records"
        />
      )}

      <MFCard>
        <h2 className="text-title-lg text-on-surface">Editorial boundary</h2>
        <div className="mt-md rounded-2xl bg-surface-container-low p-lg">
          <p className="text-body-md text-on-surface">
            Editor views ranking records for context but cannot import, finalize, or modify ranking data.
            Ranking import and finalization are Board-only actions. Final scores are backend-calculated from
            reader votes and engagement metrics.
          </p>
        </div>
      </MFCard>
    </PageShell>
  )
}