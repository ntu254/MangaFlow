import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, FileText, TrendingUp } from "lucide-react";
import { useEditorRankingRisk } from "@/shared/queries/useEditorReview";
import {
  EditorEmpty,
  EditorInlineLoading,
  EditorMetric,
  EditorPanel,
  EditorPill,
  EditorShell,
} from "@/features/editor/components/EditorWorkspace";

export const Route = createFileRoute("/app/editor/ranking-risk")({
  component: RankingRiskPage,
});

function RankingRiskPage() {
  const { data = [], isLoading } = useEditorRankingRisk();
  const high = data.filter((item) => item.riskLevel === "HIGH").length;
  const watch = data.filter((item) => item.riskLevel === "WATCH").length;
  const stable = data.filter((item) => item.riskLevel === "STABLE").length;

  return (
    <EditorShell
      title="Ranking & Risk"
      description="Read-only ranking, vote trend, score movement, and Board decision status for managed series. Board ranking actions stay hidden."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <EditorMetric label="High risk" value={String(high)} tone="danger" />
        <EditorMetric label="Watch" value={String(watch)} tone="warn" />
        <EditorMetric label="Stable" value={String(stable)} tone="success" />
      </section>

      <EditorPanel
        title="My series ranking"
        description="Latest reader signal, risk badge, rank movement, vote trend, score trend, and Board decision status."
      >
        {isLoading ? (
          <EditorInlineLoading label="Loading ranking risk..." />
        ) : data.length === 0 ? (
          <EditorEmpty
            title="No ranking data"
            hint="Managed series ranking signals will appear after Board imports reader data."
          />
        ) : (
          <div className="divide-y divide-border">
            {data.map((item) => (
              <article key={item.series.id} className="px-4 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold">{item.series.title}</h2>
                      {item.riskLevel === "HIGH" && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.latestRanking
                        ? `${item.latestRanking.period} · final score ${item.latestRanking.finalScore}`
                        : "No ranking imported yet"}
                    </p>
                  </div>
                  <EditorPill
                    tone={
                      item.riskLevel === "HIGH"
                        ? "danger"
                        : item.riskLevel === "WATCH"
                          ? "warn"
                          : "success"
                    }
                  >
                    {item.riskLevel}
                  </EditorPill>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-6">
                  {item.trend.slice(0, 6).map((rank) => (
                    <div
                      key={rank.id}
                      className="rounded-md border border-border bg-background p-3"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span>{rank.period}</span>
                        <TrendingUp className="h-3.5 w-3.5" />
                      </div>
                      <div className="mt-2 font-mono text-lg font-semibold">{rank.finalScore}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {rank.voteCount} votes
                      </div>
                    </div>
                  ))}
                </div>
                {item.latestDecision && (
                  <div className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                    Latest Board risk decision: {item.latestDecision.decision}
                    {item.latestDecision.note ? ` - ${item.latestDecision.note}` : ""}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to="/app/series/$id"
                    params={{ id: item.series.id }}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium transition hover:bg-foreground/5"
                  >
                    View detail
                  </Link>
                  <Link
                    to="/app/editor/board-reports"
                    className="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-foreground px-3 text-xs font-medium text-background transition hover:opacity-90"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Prepare defense note
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </EditorPanel>
    </EditorShell>
  );
}
