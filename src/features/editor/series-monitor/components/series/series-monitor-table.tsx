import { Link } from "@tanstack/react-router";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import { getDeadlineRisk } from "../../../model/editor-access";
import { ReviewStatusPill } from "@/entities/submission";
import { DeadlineRiskPill } from "@/entities/submission";
import { formatDate } from "@/shared/lib/format-date";

export function SeriesMonitorTable({
  series,
  chapters,
  pendingReviewBySeries,
}: {
  series: ProductionSeries[];
  chapters: Chapter[];
  pendingReviewBySeries: Record<string, number>;
}) {
  if (series.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
        Bạn chưa được phân công series nào
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 text-[10px] uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Series</th>
            <th className="px-3 py-2 text-left">Mangaka</th>
            <th className="px-3 py-2 text-left">Current chapter</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Progress</th>
            <th className="px-3 py-2 text-left">Pending</th>
            <th className="px-3 py-2 text-left">Deadline</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {series.map((s) => {
            const seriesChapters = chapters.filter((c) => c.seriesId === s.id);
            const current = seriesChapters[seriesChapters.length - 1];
            const published = seriesChapters.filter((c) => c.status === "PUBLISHED").length;
            const pct = s.targetChapters > 0 ? Math.round((published / s.targetChapters) * 100) : 0;
            const risk = current ? getDeadlineRisk(current) : null;
            return (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-3 py-2">
                  <Link
                    to="/app/series/$slug/$tab"
                    params={{ slug: s.slug, tab: "overview" }}
                    className="font-semibold hover:underline"
                  >
                    {s.title}
                  </Link>
                </td>
                <td className="px-3 py-2">{s.authorName}</td>
                <td className="px-3 py-2">
                  {current ? `Ch.${current.number} ${current.title}` : "—"}
                </td>
                <td className="px-3 py-2">
                  {current ? <ReviewStatusPill status={current.status} /> : "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded bg-muted">
                      <div className="h-1.5 rounded bg-foreground" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{pct}%</span>
                  </div>
                </td>
                <td className="px-3 py-2">{pendingReviewBySeries[s.id] ?? 0}</td>
                <td className="px-3 py-2">
                  {risk ? <DeadlineRiskPill risk={risk} /> : "—"}
                  {current?.reviewDueAt ? (
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(current.reviewDueAt)}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-right">
                  {current ? (
                    <Link
                      to="/app/editor/chapters/$chapterId/review"
                      params={{ chapterId: current.id }}
                      className="inline-flex rounded bg-foreground px-2 py-1 text-[10px] font-semibold text-background hover:opacity-90"
                    >
                      Review
                    </Link>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
