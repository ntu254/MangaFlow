import { useMemo, useState } from "react";
import { AlertOctagon, BookOpen, CalendarClock, CheckCircle2, MessageSquare, X } from "lucide-react";
import { useAuth } from "@/shared/auth";
import { useCommentsQuery, useMyChaptersQuery, useMySeriesQuery } from "@/entities/series";
import { useProposalsQuery } from "@/features/proposals";
import { useEditorReviewQueueQuery } from "@/features/series";
import {
  buildReviewQueue,
  buildSubmissionReviewItems,
  chaptersForEditor,
  getDeadlineRisk,
  getPublicationReadiness,
  seriesForEditor,
} from "../../model/editor-access";
import { StatCard } from "@/shared/ui/stat-card";
import { PageHeader, SearchToolbar, FilterSelect } from "@/shared/ui";
import { SelectItem } from "@/components/ui/select";
import { SeriesMonitorTable } from "./series/series-monitor-table";

type QuickFilterKey = "ALL" | "AT_RISK" | "PENDING_REVIEW" | "PUBLISH_READY";

export function SeriesMonitorPage() {
  const user = useAuth((s) => s.user);
  const { data: series = [] } = useMySeriesQuery();
  const { data: chapters = [] } = useMyChaptersQuery();
  const { data: comments = [] } = useCommentsQuery({});
  const { data: proposals = [] } = useProposalsQuery();
  const { data: liveSubmissions = [] } = useEditorReviewQueueQuery();

  const mySeries = useMemo(() => (user ? seriesForEditor(series, user.id) : []), [series, user]);
  const myChapters = useMemo(
    () => (user ? chaptersForEditor(chapters, series, user.id) : []),
    [chapters, series, user],
  );
  const queue = useMemo(() => {
    if (!user) return [];
    return [
      ...buildReviewQueue(proposals, chapters, series, comments, user.id).filter(
        (item) => item.kind === "CHAPTER",
      ),
      ...buildSubmissionReviewItems(liveSubmissions),
    ];
  }, [user, proposals, chapters, series, comments, liveSubmissions]);

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

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [quickFilter, setQuickFilter] = useState<QuickFilterKey>("ALL");

  const statuses = useMemo(() => Array.from(new Set(mySeries.map((s) => s.status))), [mySeries]);

  const atRiskSeriesIds = useMemo(() => {
    const ids = new Set<string>();
    myChapters.forEach((c) => {
      if (getDeadlineRisk(c).tone === "rose") ids.add(c.seriesId);
    });
    return ids;
  }, [myChapters]);

  const publishReadySeriesIds = useMemo(() => {
    const ids = new Set<string>();
    myChapters.forEach((c) => {
      if (getPublicationReadiness(c, comments).ready) ids.add(c.seriesId);
    });
    return ids;
  }, [myChapters, comments]);

  const filteredSeries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return mySeries
      .filter((s) => statusFilter === "ALL" || s.status === statusFilter)
      .filter((s) => {
        if (quickFilter === "AT_RISK") return atRiskSeriesIds.has(s.id);
        if (quickFilter === "PENDING_REVIEW") return (pendingBySeries[s.id] ?? 0) > 0;
        if (quickFilter === "PUBLISH_READY") return publishReadySeriesIds.has(s.id);
        return true;
      })
      .filter(
        (s) =>
          !needle ||
          s.title.toLowerCase().includes(needle) ||
          s.authorName.toLowerCase().includes(needle),
      );
  }, [
    mySeries,
    query,
    statusFilter,
    quickFilter,
    atRiskSeriesIds,
    pendingBySeries,
    publishReadySeriesIds,
  ]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <PageHeader
        eyebrow="Editor"
        title="Series Monitor"
        description="Series you manage: progress, chapter breakdown, deadline risk, and items needing review."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          onClick={() => {
            setStatusFilter("ONGOING");
            setQuickFilter("ALL");
          }}
          className="cursor-pointer"
        >
          <StatCard
            tone="emerald"
            icon={<BookOpen className="size-4" />}
            label="Active"
            value={counts.active}
          />
        </div>

        <div
          onClick={() => setQuickFilter((prev) => (prev === "AT_RISK" ? "ALL" : "AT_RISK"))}
          className="cursor-pointer"
        >
          <StatCard
            tone="rose"
            icon={<AlertOctagon className="size-4" />}
            label="At risk"
            value={counts.atRisk}
          />
        </div>

        <div
          onClick={() =>
            setQuickFilter((prev) => (prev === "PENDING_REVIEW" ? "ALL" : "PENDING_REVIEW"))
          }
          className="cursor-pointer"
        >
          <StatCard
            tone="amber"
            icon={<MessageSquare className="size-4" />}
            label="Pending review"
            value={counts.pending}
          />
        </div>

        <div
          onClick={() =>
            setQuickFilter((prev) => (prev === "PUBLISH_READY" ? "ALL" : "PUBLISH_READY"))
          }
          className="cursor-pointer"
        >
          <StatCard
            tone="blue"
            icon={<CheckCircle2 className="size-4" />}
            label="Publish ready"
            value={counts.ready}
          />
        </div>
      </div>

      {quickFilter !== "ALL" && (
        <div className="flex items-center gap-2 rounded border border-border bg-card/60 px-3 py-2 text-xs text-muted-foreground">
          <span>Filtered by:</span>
          <span className="font-semibold text-foreground">
            {quickFilter === "AT_RISK" && "At Risk Series"}
            {quickFilter === "PENDING_REVIEW" && "Series with Pending Reviews"}
            {quickFilter === "PUBLISH_READY" && "Series with Publish Ready Chapters"}
          </span>
          <button
            type="button"
            onClick={() => setQuickFilter("ALL")}
            className="ml-auto inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-semibold hover:text-foreground"
          >
            <X className="size-3" /> Clear filter
          </button>
        </div>
      )}

      <SearchToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search series or mangaka"
        filters={
          <FilterSelect value={statusFilter} onValueChange={setStatusFilter}>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </FilterSelect>
        }
      />

      <SeriesMonitorTable
        series={filteredSeries}
        chapters={chapters}
        pendingReviewBySeries={pendingBySeries}
      />

      <div className="flex items-center gap-2 rounded border border-dashed border-border bg-card/40 p-3 text-[11px] text-muted-foreground">
        <CalendarClock className="size-3.5" /> Tip: Click chevron button to expand chapter pipeline and view individual chapters.
      </div>
    </div>
  );
}
