import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import type { RankingRow } from "@/entities/board/model/board-types";
import { useMySeriesQuery } from "@/entities/series";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DataTable, Notice } from "@/shared/ui";
import {
  formatRankingMetric,
  getRankingSourceLabel,
  getRankingSourceTone,
} from "../model/ranking-source-utils";
import { ExternalLink, Minus, ShieldAlert, TrendingDown, TrendingUp, X } from "lucide-react";

const RISK_CLASS: Record<RankingRow["risk"], string> = {
  LOW: "bg-emerald-100 text-emerald-900 border-emerald-300",
  MEDIUM: "bg-amber-100 text-amber-900 border-amber-300",
  HIGH: "bg-rose-100 text-rose-900 border-rose-300",
  CRITICAL: "bg-rose-200 text-rose-950 border-rose-400",
};

export function RankingTable({ rows }: { rows: RankingRow[] }) {
  const [selectedRow, setSelectedRow] = useState<RankingRow | null>(null);
  const { data: seriesList = [] } = useMySeriesQuery();

  const seriesSlugMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of seriesList) {
      map.set(s.id, s.slug);
    }
    return map;
  }, [seriesList]);

  if (rows.length === 0) {
    return (
      <DataTable
        isEmpty
        emptyTitle="No ranking data"
        emptyDescription="Select another ranking period or import new data."
      />
    );
  }

  return (
    <>
      <DataTable>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left font-serif text-[13px] text-[var(--admin-ink)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Rank</th>
                <th className="px-3 py-3 font-semibold">Prev</th>
                <th className="px-3 py-3 font-semibold">Series</th>
                <th className="px-3 py-3 font-semibold">Score</th>
                <th className="px-3 py-3 font-semibold">Votes</th>
                <th className="px-3 py-3 font-semibold">Views</th>
                <th className="px-3 py-3 font-semibold">Completion</th>
                <th className="px-3 py-3 font-semibold">Source</th>
                <th className="px-3 py-3 font-semibold">Trend</th>
                <th className="px-4 py-3 font-semibold">Risk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedRow(row)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedRow(row);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer border-t border-[var(--admin-border)] transition-colors hover:bg-[var(--admin-hover)]"
                >
                  <td className="px-4 py-3 font-mono font-semibold">{row.rank}</td>
                  <td className="px-3 py-3 text-[var(--admin-muted)]">{row.previousRank}</td>
                  <td className="px-3 py-3 font-medium text-[var(--admin-ink)]">
                    {row.seriesTitle}
                  </td>
                  <td className="px-3 py-3 tabular-nums">{formatRankingMetric(row.score)}</td>
                  <td className="px-3 py-3 tabular-nums">{formatRankingMetric(row.votes)}</td>
                  <td className="px-3 py-3 tabular-nums">{formatRankingMetric(row.views)}</td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatRankingMetric(row.completionRate)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getRankingSourceTone(row.source)}`}
                    >
                      {getRankingSourceLabel(row.source)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[var(--admin-muted)]">
                    {row.trend === "UP" ? (
                      <TrendingUp className="size-4 text-emerald-700" />
                    ) : row.trend === "DOWN" ? (
                      <TrendingDown className="size-4 text-rose-700" />
                    ) : (
                      <Minus className="size-4" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded border px-2 py-0.5 text-[10px] font-bold ${RISK_CLASS[row.risk]}`}
                    >
                      {row.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTable>

      <Sheet open={!!selectedRow} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <SheetContent className="w-full max-w-md overflow-y-auto p-0 sm:max-w-md">
          {selectedRow && (
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Rank #{selectedRow.rank} · Prev #{selectedRow.previousRank}
                    </p>
                    <SheetTitle className="mt-1 font-serif text-xl leading-tight">
                      {selectedRow.seriesTitle}
                    </SheetTitle>
                  </div>
                  <button
                    onClick={() => setSelectedRow(null)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </SheetHeader>

              <div className="flex-1 space-y-5 p-4">
                {/* Warning Business Copy */}
                <Notice icon={<ShieldAlert className="size-4" />} title="Governance notice">
                  Rankings only create risk signals and do not automatically cancel works. All
                  status changes must be handled manually.
                </Notice>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                    Performance Snapshot
                  </h4>
                  <p className="text-xs leading-relaxed text-foreground bg-muted/40 rounded p-2.5 border border-border/50">
                    {selectedRow.performanceSnapshot ?? "No performance description."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Ranking source
                    </h4>
                    <span
                      className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getRankingSourceTone(selectedRow.source)}`}
                    >
                      {getRankingSourceLabel(selectedRow.source)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Risk level
                    </h4>
                    <span
                      className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${RISK_CLASS[selectedRow.risk]}`}
                    >
                      {selectedRow.risk}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                    Source Breakdown
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {selectedRow.sourceBreakdown ?? "—"}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                    Trend & Risk Evidence
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {selectedRow.trendRiskEvidence ?? "—"}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                    Editor note
                  </h4>
                  <p className="text-xs italic text-muted-foreground border-l-2 border-border pl-2.5 py-0.5">
                    {selectedRow.editorNote ?? "No editor note."}
                  </p>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Safe actions
                  </h4>
                  <Link
                    to="/app/series/$slug/$tab"
                    params={{
                      slug: seriesSlugMap.get(selectedRow.seriesId) ?? "",
                      tab: "overview",
                    }}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded bg-foreground px-3 py-2 text-xs font-semibold text-background hover:opacity-90"
                    onClick={() => setSelectedRow(null)}
                  >
                    <ExternalLink className="size-3.5" /> View series details
                  </Link>
                  <p className="text-[10px] text-center text-muted-foreground mt-2">
                    Requests to discuss or cancel a work must go through the At-risk Reviews page so
                    the full audit trail is recorded.
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
