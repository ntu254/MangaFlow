import { useMemo } from "react";
import { AlertOctagon, BookOpen, CalendarClock, CheckCircle2, MessageSquare } from "lucide-react";
import { useAuth } from "@/shared/auth";
import { useCommentsQuery, useMyChaptersQuery, useMySeriesQuery } from "@/entities/series";
import { useProposalsQuery } from "@/features/proposals";
import {
  buildReviewQueue,
  chaptersForEditor,
  getDeadlineRisk,
  getPublicationReadiness,
  seriesForEditor,
} from "../../model/editor-access";
import { StatCard } from "@/shared/ui/stat-card";
import { PageHeader } from "@/shared/ui";
import { SeriesMonitorTable } from "./series/series-monitor-table";

export function SeriesMonitorPage() {
  const user = useAuth((s) => s.user);
  const { data: series = [] } = useMySeriesQuery();
  const { data: chapters = [] } = useMyChaptersQuery();
  const { data: comments = [] } = useCommentsQuery({});
  const { data: proposals = [] } = useProposalsQuery();

  const mySeries = useMemo(() => (user ? seriesForEditor(series, user.id) : []), [series, user]);
  const myChapters = useMemo(
    () => (user ? chaptersForEditor(chapters, series, user.id) : []),
    [chapters, series, user],
  );
  const queue = useMemo(
    () => (user ? buildReviewQueue(proposals, chapters, series, comments, user.id) : []),
    [user, proposals, chapters, series, comments],
  );

  const counts = useMemo(() => {
    const active = mySeries.filter((s) => s.status === "ONGOING").length;
    const atRisk = myChapters.filter((c) => getDeadlineRisk(c).tone === "rose").length;
    const ready = myChapters.filter((c) => getPublicationReadiness(c, comments).ready).length;
    return { active, atRisk, pending: queue.length, ready };
  }, [mySeries, myChapters, comments, queue]);

  const pendingBySeries: Record<string, number> = useMemo(() => {
    const m: Record<string, number> = {};
    queue.forEach((q) => {
      if (q.seriesId) m[q.seriesId] = (m[q.seriesId] ?? 0) + 1;
    });
    return m;
  }, [queue]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <PageHeader
        eyebrow="Editor"
        title="Series Monitor"
        description="Series you manage: progress, deadline risk, and items needing review."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          tone="emerald"
          icon={<BookOpen className="size-4" />}
          label="Active"
          value={counts.active}
        />
        <StatCard
          tone="rose"
          icon={<AlertOctagon className="size-4" />}
          label="At risk"
          value={counts.atRisk}
        />
        <StatCard
          tone="amber"
          icon={<MessageSquare className="size-4" />}
          label="Pending review"
          value={counts.pending}
        />
        <StatCard
          tone="blue"
          icon={<CheckCircle2 className="size-4" />}
          label="Publish ready"
          value={counts.ready}
        />
      </div>

      <SeriesMonitorTable
        series={mySeries}
        chapters={chapters}
        pendingReviewBySeries={pendingBySeries}
      />

      <div className="flex items-center gap-2 rounded border border-dashed border-border bg-card/40 p-3 text-[11px] text-muted-foreground">
        <CalendarClock className="size-3.5" /> Tip: Click "Review" to open the detailed Chapter
        Review.
      </div>
    </div>
  );
}
