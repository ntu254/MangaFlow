import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { RankingTable } from "@/shared/components/domain"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { toRankingRows } from "@/features/board/utils/board-page.mappers"
import { useMangakaRanking } from "../hooks/useMangakaRanking"

export function MangakaRankingPage() {
  const { rankings, loading, error, retry } = useMangakaRanking()
  const rows = toRankingRows(rankings)

  usePageTitle(
    "My Rankings",
    "View ranking records for your Series. Scores are backend-calculated from reader votes.",
  )

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-sm">
              <MFBadge tone="primary" size="md">Mangaka only</MFBadge>
              <MFBadge tone="success" size="md">Backend enforced</MFBadge>
            </div>
            <h1 className="mt-md text-headline-lg text-on-surface">My Rankings</h1>
            <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
              Track how your Series perform in reader rankings. Final scores are backend-calculated using vote counts and reader engagement.
            </p>
          </div>
        </div>
      </MFCard>

      {error ? (
        <MFErrorState title="Could not load rankings" description={error} onRetry={retry} />
      ) : (
        <RankingTable rows={rows} loading={loading} caption="Mangaka ranking records" />
      )}
    </PageShell>
  )
}