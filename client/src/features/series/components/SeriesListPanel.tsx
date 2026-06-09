import { ChapterCreationGateCard, SeriesSummaryCard } from "@/shared/components/domain"
import { MFBadge, MFButton } from "@/shared/components/ui"
import type { SeriesRow } from "../utils/series-page.mappers"

type SeriesListMode = "detail" | "select" | "monitor"

interface SeriesListPanelProps {
  rows: SeriesRow[]
  mode?: SeriesListMode
  readOnly?: boolean
  actionLabel?: string
  showChapterGate?: boolean
  onOpenDetail?: (seriesId: string) => void
  onSelect?: (seriesId: string) => void
}

export function SeriesListPanel({
  rows,
  mode = "detail",
  readOnly = false,
  actionLabel,
  showChapterGate = !readOnly,
  onOpenDetail,
  onSelect,
}: SeriesListPanelProps) {
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
            action={renderSeriesAction({ row, mode, readOnly, actionLabel, onOpenDetail, onSelect })}
          />
          {showChapterGate ? (
            <ChapterCreationGateCard
              seriesTitle={row.title}
              canCreateChapter={row.canCreateChapter}
              reason="Chapter creation stays disabled until backend Board approval reports APPROVED, ONGOING, or AT_RISK."
            />
          ) : null}
        </div>
      ))}
    </div>
  )
}

interface RenderSeriesActionInput {
  row: SeriesRow
  mode: SeriesListMode
  readOnly: boolean
  actionLabel?: string
  onOpenDetail?: (seriesId: string) => void
  onSelect?: (seriesId: string) => void
}

function renderSeriesAction({ row, mode, readOnly, actionLabel, onOpenDetail, onSelect }: RenderSeriesActionInput) {
  if (readOnly) return <MFBadge tone="neutral" size="md">Read-only monitor</MFBadge>

  if (mode === "select" && onSelect) {
    return <MFButton type="button" variant="outline" size="sm" onClick={() => onSelect(row.id)}>{actionLabel ?? "Select series"}</MFButton>
  }

  if (onOpenDetail) {
    return <MFButton type="button" variant="outline" size="sm" onClick={() => onOpenDetail(row.id)}>{actionLabel ?? "Open detail"}</MFButton>
  }

  return null
}
