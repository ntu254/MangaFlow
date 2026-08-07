import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Notice, PageHeader } from "@/shared/ui";
import { RankingSummaryCards } from "../../rankings/components/ranking-summary-cards";
import { RankingTable } from "../../rankings/components/ranking-table";
import { useRankingsListQuery } from "@/entities/series";
import type { RankingPeriod, RankingRow } from "@/entities/board/model/board-types";
import { AlertTriangle, ShieldAlert, Upload } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export function SeriesRankingsPage() {
  const { data: rankings = [] } = useRankingsListQuery();
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const periods = useMemo<RankingPeriod[]>(
    () =>
      Array.from(new Set(rankings.map((row) => row.period))).map((period) => ({
        id: period,
        label: period,
        issue: "Live API",
        status: "IMPORTED",
      })),
    [rankings],
  );
  const period = selectedPeriod || periods[0]?.id || "";
  const rows = useMemo<RankingRow[]>(
    () =>
      rankings
        .filter((row) => row.period === period)
        .sort((left, right) => (right.finalScore ?? 0) - (left.finalScore ?? 0) || (right.voteCount ?? 0) - (left.voteCount ?? 0))
        .map((row, index) => ({
          id: row.id,
          periodId: row.period,
          rank: index + 1,
          previousRank: index + 1,
          seriesId: row.seriesId,
          seriesTitle: row.seriesTitle,
          score: row.finalScore ?? row.readerScore ?? 0,
          readerScore: row.readerScore,
          votes: row.voteCount ?? 0,
          views: 0,
          completionRate: 0,
          trend: row.atRisk ? "DOWN" : "FLAT",
          risk: row.atRisk ? "HIGH" : "LOW",
          source: row.source,
          performanceSnapshot: `Reader score ${row.readerScore ?? "—"} with ${(row.voteCount ?? 0).toLocaleString()} votes.`,
          sourceBreakdown: "Imported ranking read model.",
          trendRiskEvidence: row.atRisk ? "This period is marked at-risk." : "No at-risk signal for this period.",
          editorNote: row.status ?? "—",
        })),
    [period, rankings],
  );
  const atRiskCount = rows.filter((row) => row.risk === "HIGH").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Series rankings"
        description="Review the latest ranking period and route at-risk series to a documented Board decision."
        actions={
          <Link
            to="/app/board/rankings/import"
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3.5 py-2 text-[13px] font-semibold text-[var(--admin-ink)] hover:bg-[var(--admin-hover)]"
          >
            <Upload className="size-4" /> Import rankings
          </Link>
        }
      />

      <Notice icon={<ShieldAlert className="size-5" />} title="Governance notice">
        Rankings are signals, not decisions. Review an at-risk series in the Board queue before changing its status.
      </Notice>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-faint)]">Ranking period</p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--admin-ink)]">{period || "No import yet"}</p>
        </div>
        <Select value={period} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="h-9 w-56 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px]">
            <SelectValue placeholder="Select ranking period" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {atRiskCount > 0 ? (
        <Link
          to="/app/board/at-risk"
          className="flex items-center justify-between gap-3 rounded-[8px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950 hover:bg-rose-100"
        >
          <span className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4" /> {atRiskCount} series require Board review
          </span>
          <span className="text-xs font-semibold">Open at-risk reviews</span>
        </Link>
      ) : null}

      <RankingSummaryCards rows={rows} />
      <RankingTable rows={rows} />
    </div>
  );
}
