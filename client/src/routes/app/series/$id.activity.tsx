import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/layouts/AppShell";
import { AuditTimeline } from "@/shared/ui/site/AuditTimeline";
import {
  TrendingUp,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  PenTool,
  BookOpen,
} from "lucide-react";
import { useSeriesSummary } from "@/shared/queries/useSeries";

export const Route = createFileRoute("/app/series/$id/activity")({
  loader: ({ params }) => {
    return { id: params.id };
  },
  component: ActivityPage,
});

function ActivityPage() {
  const { id } = Route.useLoaderData();
  const { data: summary, isLoading } = useSeriesSummary(id);

  if (isLoading)
    return <div className="p-8 text-sm text-foreground/55 animate-pulse">Loading activity...</div>;
  if (!summary) return <div className="p-8 text-sm text-foreground/55">Series not found.</div>;

  const { series, members } = summary;

  // Sort history newest first, assuming period format like "2026-W25"
  const history = [...(series.rankingHistory || [])].reverse();
  const mangakaMember = members?.find((m: any) => m.role === "MANGAKA" || m.role === "mangaka");
  const editorMember = members?.find((m: any) => m.role === "EDITOR" || m.role === "editor");

  const mangaka = mangakaMember?.user;
  const editor = editorMember?.user;

  return (
    <div className="mx-auto max-w-7xl pb-12">
      <PageHeader
        title={`${series.title} · Activity`}
        jp="アクティビティ"
        description={
          <Link
            to="/app/series/$id"
            params={{ id: series.id }}
            className="underline-offset-2 hover:underline"
          >
            ← Back to series
          </Link>
        }
      />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_320px] mt-8">
        {/* LEFT COLUMN: Audit Log */}
        <div className="rounded-xl border border-[#E5DFD3] bg-card p-6 shadow-sm dark:border-border">
          <AuditTimeline entity="series" entityId={series.id} title="Audit log" />
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Key Personnel */}
          <div className="rounded-xl border border-[#E5DFD3] bg-card p-5 shadow-sm dark:border-border">
            <h3 className="mb-4 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
              Key Personnel
            </h3>
            <div className="flex flex-col gap-4">
              {mangaka && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[13px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                    {mangaka.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{mangaka.name}</div>
                    <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                      <PenTool className="h-3 w-3" />
                      Mangaka
                    </div>
                  </div>
                </div>
              )}
              {editor && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[13px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                    {editor.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{editor.name}</div>
                    <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      Editor
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-[#E5DFD3] bg-card shadow-sm overflow-hidden dark:border-border">
            {/* Header */}
            <div className="border-b border-[#E5DFD3] p-5 dark:border-border">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Ranking History</h3>
                  <p className="text-[12px] text-muted-foreground">Weekly Shonen Jump</p>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="p-2">
              {history.length > 0 ? (
                <div className="flex flex-col">
                  {history.map((record, index) => {
                    const prevRecord = history[index + 1];
                    let trend = "flat";
                    if (prevRecord) {
                      if (record.rank < prevRecord.rank)
                        trend = "up"; // smaller number is better
                      else if (record.rank > prevRecord.rank) trend = "down";
                    }

                    // Gold/Silver/Bronze logic
                    const isTop1 = record.rank === 1;
                    const isTop2 = record.rank === 2;
                    const isTop3 = record.rank === 3;
                    const isTop3Any = isTop1 || isTop2 || isTop3;

                    return (
                      <div
                        key={record.period}
                        className="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-[#F5EFE6] dark:hover:bg-muted/50"
                      >
                        <div>
                          <div className="text-[13px] font-medium text-foreground">
                            {record.period.replace("-W", " Week ")}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium">
                            {trend === "up" && (
                              <span className="flex items-center text-emerald-600">
                                <ArrowUpRight className="h-3 w-3 mr-0.5" /> +
                                {prevRecord.rank - record.rank}
                              </span>
                            )}
                            {trend === "down" && (
                              <span className="flex items-center text-red-600">
                                <ArrowDownRight className="h-3 w-3 mr-0.5" /> -
                                {record.rank - prevRecord.rank}
                              </span>
                            )}
                            {trend === "flat" && prevRecord && (
                              <span className="flex items-center text-muted-foreground">
                                <Minus className="h-3 w-3 mr-0.5" /> flat
                              </span>
                            )}
                            {trend === "flat" && !prevRecord && (
                              <span className="text-muted-foreground">No prior data</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isTop3Any && (
                            <Trophy
                              className={`h-4 w-4 ${isTop1 ? "text-amber-500" : isTop2 ? "text-slate-400" : "text-amber-700"}`}
                            />
                          )}
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-[14px] shadow-sm
                            ${
                              isTop1
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : isTop2
                                  ? "bg-slate-100 text-slate-700 border border-slate-200"
                                  : isTop3
                                    ? "bg-amber-50 text-amber-900 border border-amber-200/50"
                                    : "bg-background border border-border text-foreground"
                            }`}
                          >
                            {record.rank}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <p className="text-[13px] font-medium text-foreground">No data available</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Ranking history will appear here once published.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
