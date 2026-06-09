import { ChapterCreationGateCard, SeriesSummaryCard } from "@/shared/components/domain"
import { MFButton } from "@/shared/components/ui"
import type { SeriesRow } from "../utils/series-page.mappers"

interface SeriesListPanelProps {
  rows: SeriesRow[]
  onOpenDetail: (seriesId: string) => void
}

export function SeriesListPanel({ rows, onOpenDetail }: SeriesListPanelProps) {
  return (
    <div className="space-y-lg">
      {rows.map((row) => (
        <div key={row.id} className="space-y-md">
          <SeriesSummaryCard
            title={row.title}
            status={row.status}
            genre={row.genre}
            publicationType={row.publicationType}
            description={row.description}
            ownerLabel={row.ownerLabel}
            metadata={row.metadata}
            action={<MFButton type="button" variant="outline" size="sm" onClick={() => onOpenDetail(row.id)}>Open detail</MFButton>}
          />
          <ChapterCreationGateCard
            seriesTitle={row.title}
            canCreateChapter={row.canCreateChapter}
            reason="Chapter creation stays disabled until backend Board approval reports APPROVED, ONGOING, or AT_RISK."
          />
        </div>
      ))}
    </div>
  )
}
