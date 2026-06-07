import { MFTable, type MFTableColumn } from "@/shared/components/ui/MFTable"
import { rankingStatusUI, type StatusUiConfig } from "@/shared/lib/status-ui"
import { StatusBadge } from "./StatusBadge"

export interface RankingTableRow {
  id: string
  rank: number | string
  seriesTitle: string
  voteCount: number | string
  readerScore: number | string
  finalScore: number | string
  status: string
  periodLabel?: string
}

interface RankingTableProps {
  rows: RankingTableRow[]
  statusMapping?: Record<string, StatusUiConfig>
  caption?: string
  loading?: boolean
  className?: string
}

export function RankingTable({
  rows,
  statusMapping = rankingStatusUI,
  caption = "Board ranking table",
  loading = false,
  className,
}: RankingTableProps) {
  const columns: MFTableColumn<RankingTableRow>[] = [
    {
      id: "rank",
      header: "Rank",
      cell: (row) => <span className="text-label-md text-on-surface">#{row.rank}</span>,
      className: "w-24",
    },
    {
      id: "series",
      header: "Series",
      cell: (row) => (
        <div className="min-w-0">
          <span className="block break-words text-label-md text-on-surface">
            {row.seriesTitle}
          </span>
          {row.periodLabel ? (
            <span className="mt-xs block text-label-sm text-on-surface-muted">
              {row.periodLabel}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "vote-count",
      header: "Votes",
      cell: (row) => row.voteCount,
      align: "right",
    },
    {
      id: "reader-score",
      header: "Reader Score",
      cell: (row) => row.readerScore,
      align: "right",
    },
    {
      id: "final-score",
      header: "Final Score",
      cell: (row) => row.finalScore,
      align: "right",
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} mapping={statusMapping} />,
    },
  ]

  return (
    <MFTable
      className={className}
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      caption={caption}
      loading={loading}
      emptyTitle="No ranking rows"
      emptyDescription="Imported ranking rows will appear here after the Board workflow supplies them."
    />
  )
}
