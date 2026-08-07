import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Layers } from "lucide-react";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import { getDeadlineRisk } from "../../../model/editor-access";
import { DeadlineRiskPill, ReviewStatusPill } from "@/entities/submission";
import { ResolvedImage } from "@/shared/ui/resolved-image";
import { formatDate, formatDateTime } from "@/shared/lib/format-date";
import { SortableHeader } from "@/shared/ui";
import { useSortableData } from "@/shared/lib/use-sortable-data";

interface SeriesMonitorTableProps {
  series: ProductionSeries[];
  chapters: Chapter[];
  pendingReviewBySeries: Record<string, number>;
}

export function SeriesMonitorTable({
  series,
  chapters,
  pendingReviewBySeries,
}: SeriesMonitorTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (seriesId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(seriesId)) {
        next.delete(seriesId);
      } else {
        next.add(seriesId);
      }
      return next;
    });
  };

  const { sorted, sortKey, sortDirection, toggleSort } = useSortableData(series, {
    title: (s) => s.title,
    author: (s) => s.authorName,
    chaptersCount: (s) => chapters.filter((c) => c.seriesId === s.id).length,
    progress: (s) => {
      const seriesChapters = chapters.filter((c) => c.seriesId === s.id);
      const published = seriesChapters.filter((c) => c.status === "PUBLISHED").length;
      return s.targetChapters > 0 ? published / s.targetChapters : 0;
    },
    pending: (s) => pendingReviewBySeries[s.id] ?? 0,
    deadline: (s) => {
      const seriesChapters = chapters.filter((c) => c.seriesId === s.id);
      const pendingCh = seriesChapters.find((c) => c.status === "TANTOU_REVIEW");
      const targetCh = pendingCh ?? seriesChapters[seriesChapters.length - 1];
      return targetCh?.reviewDueAt ? new Date(targetCh.reviewDueAt) : undefined;
    },
    updated: (s) => (s.updatedAt ? new Date(s.updatedAt) : undefined),
  });

  if (series.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
        No series found matching your criteria.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 text-[10px] uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="w-8 px-2 py-2 text-center"></th>
            <th className="px-3 py-2 text-left">
              <SortableHeader
                label="Series"
                sortKey="title"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
              />
            </th>
            <th className="px-3 py-2 text-left">
              <SortableHeader
                label="Mangaka"
                sortKey="author"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
              />
            </th>
            <th className="px-3 py-2 text-left">
              <SortableHeader
                label="Chapter Breakdown"
                sortKey="chaptersCount"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
              />
            </th>
            <th className="px-3 py-2 text-left">
              <SortableHeader
                label="Progress"
                sortKey="progress"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
              />
            </th>
            <th className="px-3 py-2 text-left">
              <SortableHeader
                label="Pending"
                sortKey="pending"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
              />
            </th>
            <th className="px-3 py-2 text-left">
              <SortableHeader
                label="Deadline"
                sortKey="deadline"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
              />
            </th>
            <th className="px-3 py-2 text-left">
              <SortableHeader
                label="Updated"
                sortKey="updated"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
              />
            </th>
            <th className="px-3 py-2 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((s) => {
            const isExpanded = expandedIds.has(s.id);
            const seriesChapters = chapters
              .filter((c) => c.seriesId === s.id)
              .sort((a, b) => a.number - b.number);

            const totalChapters = seriesChapters.length;
            const publishedCount = seriesChapters.filter((c) => c.status === "PUBLISHED").length;
            const reviewCount = seriesChapters.filter(
              (c) => c.status === "TANTOU_REVIEW" || c.status === "REVISION_REQUIRED",
            ).length;
            const productionCount = seriesChapters.filter(
              (c) => c.status === "IN_PRODUCTION",
            ).length;

            const pendingCount = pendingReviewBySeries[s.id] ?? 0;
            const target = s.targetChapters > 0 ? s.targetChapters : Math.max(totalChapters, 1);
            const pct = Math.round((publishedCount / target) * 100);

            const urgentChapter =
              seriesChapters.find((c) => c.status === "TANTOU_REVIEW") ??
              seriesChapters.find((c) => c.status === "IN_PRODUCTION") ??
              seriesChapters[seriesChapters.length - 1];

            const risk = urgentChapter ? getDeadlineRisk(urgentChapter) : null;

            return (
              <React.Fragment key={s.id}>
                <tr className={`hover:bg-muted/30 ${isExpanded ? "bg-muted/20" : ""}`}>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => toggleExpand(s.id)}
                      className="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                      title={isExpanded ? "Collapse chapters" : "Expand chapters"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-3.5" />
                      ) : (
                        <ChevronRight className="size-3.5" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <ResolvedImage
                        fileKey={s.coverFileKey}
                        fallbackUrl={s.coverUrl}
                        alt={s.title}
                        className="size-9 shrink-0 rounded-lg border border-border object-cover shadow-2xs"
                        fallback={
                          <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 font-serif text-sm font-bold text-primary shadow-2xs">
                            {s.title.slice(0, 1).toUpperCase()}
                          </div>
                        }
                      />
                      <div>
                        <Link
                          to="/app/editor/series/$seriesId/studio"
                          params={{ seriesId: s.id }}
                          className="font-semibold hover:underline text-foreground"
                        >
                          {s.title}
                        </Link>
                        <p className="text-[10px] text-muted-foreground uppercase">{s.cadence}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">{s.authorName}</td>
                  <td className="px-3 py-2">
                    <div className="space-y-0.5">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {totalChapters} {totalChapters === 1 ? "chap" : "chaps"}
                        {s.targetChapters > 0 ? ` / ${s.targetChapters}` : ""}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        {publishedCount > 0 && (
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {publishedCount} pub
                          </span>
                        )}
                        {reviewCount > 0 && (
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {reviewCount} rev
                          </span>
                        )}
                        {productionCount > 0 && (
                          <span className="text-muted-foreground">{productionCount} prod</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded bg-muted overflow-hidden">
                        <div
                          className="h-1.5 rounded bg-foreground transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono font-medium">{pendingCount}</td>
                  <td className="px-3 py-2">
                    {risk ? <DeadlineRiskPill risk={risk} /> : "—"}
                    {urgentChapter?.reviewDueAt ? (
                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(urgentChapter.reviewDueAt)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-muted-foreground whitespace-nowrap">
                    {s.updatedAt ? formatDateTime(s.updatedAt) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {pendingCount > 0 && urgentChapter ? (
                        <Link
                          to="/app/editor/chapters/$chapterId/review"
                          params={{ chapterId: urgentChapter.id }}
                          className="inline-flex rounded bg-foreground px-2 py-1 text-[10px] font-semibold text-background hover:opacity-90"
                        >
                          Review
                        </Link>
                      ) : null}
                      <Link
                        to="/app/editor/series/$seriesId/studio"
                        params={{ seriesId: s.id }}
                        className="inline-flex rounded border border-border bg-card px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-muted"
                      >
                        Studio
                      </Link>
                    </div>
                  </td>
                </tr>

                {/* Accordion Chapter Drawer */}
                {isExpanded && (
                  <tr className="bg-muted/20">
                    <td colSpan={9} className="px-4 py-3">
                      <div className="rounded border border-border bg-card p-3 space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-1.5 text-foreground">
                            <Layers className="size-3.5 text-muted-foreground" />
                            Chapters in {s.title} ({seriesChapters.length})
                          </span>
                          <Link
                            to="/app/editor/series/$seriesId/studio"
                            params={{ seriesId: s.id }}
                            className="text-[10px] font-medium text-muted-foreground hover:text-foreground hover:underline"
                          >
                            Open Series Studio →
                          </Link>
                        </div>

                        {seriesChapters.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground italic p-2">
                            No chapters created yet for this series.
                          </p>
                        ) : (
                          <div className="overflow-x-auto rounded border border-border bg-card">
                            <table className="w-full text-xs">
                              <thead className="bg-muted/40 text-[9px] uppercase tracking-widest text-muted-foreground">
                                <tr>
                                  <th className="px-2.5 py-1.5 text-left">Chapter</th>
                                  <th className="px-2.5 py-1.5 text-left">Title</th>
                                  <th className="px-2.5 py-1.5 text-left">Status</th>
                                  <th className="px-2.5 py-1.5 text-left">Pages</th>
                                  <th className="px-2.5 py-1.5 text-left">Due / Published</th>
                                  <th className="px-2.5 py-1.5 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {seriesChapters.map((ch) => {
                                  const isNeedsReview = ch.status === "TANTOU_REVIEW";
                                  return (
                                    <tr
                                      key={ch.id}
                                      className={`hover:bg-muted/30 ${
                                        isNeedsReview ? "bg-amber-500/5 font-medium" : ""
                                      }`}
                                    >
                                      <td className="px-2.5 py-1.5 font-mono font-semibold">
                                        Ch.{ch.number}
                                      </td>
                                      <td className="px-2.5 py-1.5">{ch.title || "—"}</td>
                                      <td className="px-2.5 py-1.5">
                                        <ReviewStatusPill status={ch.status} />
                                      </td>
                                      <td className="px-2.5 py-1.5 text-[10px] text-muted-foreground font-mono">
                                        {ch.pages?.length ?? 0} pages
                                      </td>
                                      <td className="px-2.5 py-1.5 text-[10px] text-muted-foreground">
                                        {ch.reviewDueAt
                                          ? formatDate(ch.reviewDueAt)
                                          : ch.publishedAt
                                            ? `Published ${formatDate(ch.publishedAt)}`
                                            : "—"}
                                      </td>
                                      <td className="px-2.5 py-1.5 text-right">
                                        {isNeedsReview ? (
                                          <Link
                                            to="/app/editor/chapters/$chapterId/review"
                                            params={{ chapterId: ch.id }}
                                            className="inline-flex rounded bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background hover:opacity-90"
                                          >
                                            Review
                                          </Link>
                                        ) : (
                                          <Link
                                            to="/app/editor/chapters/$chapterId/annotate"
                                            params={{ chapterId: ch.id }}
                                            className="inline-flex rounded border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-foreground hover:bg-muted"
                                          >
                                            Annotate
                                          </Link>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
