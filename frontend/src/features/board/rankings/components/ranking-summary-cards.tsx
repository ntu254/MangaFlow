import { BarChart3, TrendingDown, TrendingUp, TriangleAlert } from "lucide-react";
import { StatCard } from "@/shared/ui";
import type { RankingRow } from "@/entities/board/model/board-types";

export function RankingSummaryCards({ rows }: { rows: RankingRow[] }) {
  const top = rows[0];
  const down = rows.filter((row) => row.trend === "DOWN").length;
  const risk = rows.filter((row) => row.risk === "HIGH" || row.risk === "CRITICAL").length;
  const avgScore = rows.length ? rows.reduce((sum, row) => sum + row.score, 0) / rows.length : 0;

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
        icon={<TrendingDown className="size-4" />}
        tone="amber"
        label="Down Trend"
        value={down}
        hint="needs editorial watch"
      />
      <StatCard
        icon={<TriangleAlert className="size-4" />}
        tone="rose"
        label="At-risk"
        value={risk}
        hint="Board review required"
      />
      <StatCard
        icon={<BarChart3 className="size-4" />}
        tone="neutral"
        label="Average Score"
        value={avgScore.toFixed(1)}
        hint="reader score"
      />
      <StatCard
        icon={<TrendingUp className="size-4" />}
        tone="sky"
        label="Total Votes"
        value={rows.reduce((sum, row) => sum + row.votes, 0).toLocaleString()}
        hint="period votes"
      />
    </div>
  );
}
