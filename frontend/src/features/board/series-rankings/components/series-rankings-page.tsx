import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Notice, PageHeader, QueueTabs, type QueueTab } from "@/shared/ui";
import { RankingSummaryCards } from "../../rankings/components/ranking-summary-cards";
import { RankingTable } from "../../rankings/components/ranking-table";
import { RankingImportPanel } from "../../rankings";
import { useRankingsListQuery } from "@/entities/series";
import type { RankingPeriod, RankingRow } from "@/entities/board/model/board-types";
import { ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";

export function SeriesRankingsPage() {
  const { data: rankings = [] } = useRankingsListQuery();
  const periods = useMemo<RankingPeriod[]>(() => {
    return Array.from(new Set(rankings.map((row) => row.period))).map((period) => ({
      id: period,
      label: period,
      issue: "Live API",
      status: "IMPORTED",
    }));
  }, [rankings]);
  const [selected, setSelected] = useState<string>("");
  const [tab, setTab] = useState<"rankings" | "import">("rankings");
  const selectedPeriod = selected || periods[0]?.id || "";
  const rows = useMemo<RankingRow[]>(() => {
    return rankings
      .filter((row) => row.period === selectedPeriod)
      .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))
      .map((row, index, list) => ({
        id: row.id,
        periodId: row.period,
        rank: index + 1,
        previousRank: index + 1,
        seriesId: row.seriesId,
        seriesTitle: row.seriesTitle,
        score: row.finalScore ?? row.readerScore ?? 0,
        votes: row.voteCount ?? 0,
        views: 0,
        completionRate: 0,
        trend: index < list.length / 3 ? "UP" : row.atRisk ? "DOWN" : "FLAT",
        risk: row.atRisk ? "HIGH" : "LOW",
        source: "live-api",
        performanceSnapshot: `Reader score ${row.readerScore ?? "—"} with ${row.voteCount ?? 0} votes.`,
        sourceBreakdown: "Backend ranking read model.",
        trendRiskEvidence: row.atRisk
          ? "Backend marks this series as at-risk."
          : "No at-risk signal.",
        editorNote: row.status ?? "—",
      }));
  }, [rankings, selectedPeriod]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Series rankings"
        description="Reader score, votes, views, completion, trend, and risk signals."
      />
      <Notice icon={<ShieldAlert className="size-5" />} title="Governance notice">
        Rankings only generate risk signals and do not automatically cancel a series. All status
        changes must be carried out manually by the board.
      </Notice>

      <QueueTabs
        tabs={
          [
            { key: "rankings", label: "Rankings" },
            { key: "import", label: "Import CSV" },
          ] satisfies QueueTab[]
        }
        active={tab}
        onChange={(key) => setTab(key as "rankings" | "import")}
      />

      {tab === "rankings" ? (
        <>
          <Select value={selectedPeriod} onValueChange={setSelected}>
            <SelectTrigger className="h-10 w-64 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px]">
              <SelectValue placeholder="Select ranking period" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.label} · {period.issue}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RankingSummaryCards rows={rows} />
          <RankingTable rows={rows} />
        </>
      ) : (
        <RankingImportPanel />
      )}
    </div>
  );
}
