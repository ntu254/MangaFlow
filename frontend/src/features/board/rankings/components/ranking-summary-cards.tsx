import { BarChart3, TrendingUp, TriangleAlert, Vote } from "lucide-react";
import { StatCard } from "@/shared/ui";
import type { RankingRow } from "@/entities/board/model/board-types";

export function RankingSummaryCards({ rows }: { rows: RankingRow[] }) {
  const top = rows[0];
  const risk = rows.filter((row) => row.risk === "HIGH" || row.risk === "CRITICAL").length;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={<BarChart3 className="size-4" />}
        tone="blue"
        label="Latest Period"
        value={rows.length}
        hint="ranked series"
      />
      <StatCard
        icon={<TrendingUp className="size-4" />}
        tone="emerald"
        label="Top Series"
        value={top?.seriesTitle ?? "—"}
        hint={top ? `Score ${top.score}` : "No rows"}
      />
      <StatCard
        icon={<TriangleAlert className="size-4" />}
        tone="rose"
        label="At-risk"
        value={risk}
        hint="Board review required"
      />
      <StatCard
        icon={<Vote className="size-4" />}
        tone="sky"
        label="Total Votes"
        value={rows.reduce((sum, row) => sum + row.votes, 0).toLocaleString()}
        hint="period votes"
      />
    </div>
  );
}
