import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, AlertTriangle, Calendar, Clock, Sparkles, ChevronRight as ChevronRightIcon } from "lucide-react";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import { monthGrid, sameDay, formatDate } from "@/shared/lib/format-date";
import { ChapterStatusPill } from "@/entities/chapter";
import { cn } from "@/shared/lib/cn";

export function PublicationCalendar({
  series,
  chapters,
  seriesId,
}: {
  series: ProductionSeries[];
  chapters: Chapter[];
  seriesId?: string;
}) {
  const filtered = useMemo(
    () =>
      chapters.filter(
        (c) =>
          (!seriesId || c.seriesId === seriesId) &&
          (c.scheduledAt || c.publishedAt || c.draftDueAt),
      ),
    [chapters, seriesId],
  );

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const grid = monthGrid(cursor.y, cursor.m);
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(cursor.y, cursor.m, 1),
  );

  // Current targeted series (if single series selected)
  const activeSeriesObj = useMemo(
    () => (seriesId ? series.find((s) => s.id === seriesId) : undefined),
    [series, seriesId],
  );

  // Conflict: 2 chapters in the same series on the same day
  const conflicts = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((c) => {
      if (!c.scheduledAt) return;
      const key = `${c.seriesId}|${new Date(c.scheduledAt).toDateString()}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return new Set(
      Array.from(map.entries())
        .filter(([, n]) => n > 1)
        .map(([k]) => k),
    );
  }, [filtered]);

  const dayKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const next30DaysChapters = useMemo(() => {
    return filtered
      .filter((c) => {
        const t = c.scheduledAt ?? c.draftDueAt;
        if (!t) return false;
        const d = new Date(t).getTime();
        return d >= Date.now() && d <= Date.now() + 30 * 86400000;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledAt ?? a.draftDueAt!).getTime() -
          new Date(b.scheduledAt ?? b.draftDueAt!).getTime(),
      );
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Unified Glassmorphic Calendar Workbench Card */}
      <div className="rounded-2xl border border-border/80 bg-card/80 shadow-xs backdrop-blur-md overflow-hidden">
        {/* Editorial Calendar Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-border/60 bg-muted/20 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Publication Radar & Launch Schedule
              </p>
              {activeSeriesObj ? (
                <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                  {activeSeriesObj.publicationType ?? activeSeriesObj.cadence ?? "WEEKLY"} CADENCE
                </span>
              ) : null}
            </div>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground capitalize mt-0.5">
              {monthLabel}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-card p-1 shadow-2xs">
              <button
                type="button"
                onClick={() =>
                  setCursor((p) => ({ y: p.m === 0 ? p.y - 1 : p.y, m: p.m === 0 ? 11 : p.m - 1 }))
                }
                className="grid size-8 place-items-center rounded-lg hover:bg-muted text-foreground transition-all"
                title="Previous Month"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCursor(() => {
                    const d = new Date();
                    return { y: d.getFullYear(), m: d.getMonth() };
                  })
                }
                className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-all"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() =>
                  setCursor((p) => ({ y: p.m === 11 ? p.y + 1 : p.y, m: p.m === 11 ? 0 : p.m + 1 }))
                }
                className="grid size-8 place-items-center rounded-lg hover:bg-muted text-foreground transition-all"
                title="Next Month"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Days Header Bar */}
        <div className="grid grid-cols-7 border-b border-border/60 bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {dayKeys.map((d) => (
            <div key={d} className="px-3 py-2 text-center">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border/50">
          {grid.map((d, i) => {
            const inMonth = d.getMonth() === cursor.m;
            const events = filtered.filter((c) => {
              const target = c.publishedAt ?? c.scheduledAt ?? c.draftDueAt;
              return target && sameDay(new Date(target), d);
            });
            const isToday = sameDay(d, new Date());
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[100px] p-2 text-xs transition-colors flex flex-col justify-between",
                  inMonth ? "bg-card/40" : "bg-muted/15 text-muted-foreground/50",
                  isToday ? "bg-primary/5 ring-1 ring-primary/30" : "",
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full font-bold text-[11px]",
                      isToday
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "text-foreground/90",
                    )}
                  >
                    {d.getDate()}
                  </span>
                  {events.length > 0 && (
                    <span className="text-[9px] font-bold text-muted-foreground">
                      {events.length} {events.length === 1 ? "event" : "events"}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 overflow-hidden">
                  {events.map((c) => {
                    const s = series.find((x) => x.id === c.seriesId);
                    const conflict =
                      c.scheduledAt &&
                      conflicts.has(`${c.seriesId}|${new Date(c.scheduledAt).toDateString()}`);
                    return (
                      <Link
                        key={c.id}
                        to="/app/series/$slug/$tab"
                        from="/app/series/$slug/$tab"
                        params={{ slug: s?.slug ?? "", tab: "overview" }}
                        className="group block rounded-xl border border-border/80 bg-background/80 p-2 text-[10px] shadow-2xs transition-all hover:border-primary/50 hover:bg-card"
                        title={`${s?.title} — Ch.${c.number} ${c.title}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-foreground truncate">
                            #{c.number} {c.title}
                          </span>
                          {conflict ? (
                            <AlertTriangle className="size-3 text-amber-500 shrink-0" />
                          ) : null}
                        </div>
                        <div className="truncate text-muted-foreground mt-0.5">{s?.title}</div>
                        <div className="mt-1.5">
                          <ChapterStatusPill status={c.status} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next 30 Days Launch Pipeline Radar Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Next 30 Days Milestone Radar ({next30DaysChapters.length})
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground">Upcoming release deadlines</span>
        </div>

        {next30DaysChapters.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No publication events scheduled in the next 30 days.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {next30DaysChapters.slice(0, 8).map((c) => {
              const s = series.find((x) => x.id === c.seriesId);
              const targetDate = c.scheduledAt ?? c.draftDueAt;
              const daysLeft = targetDate
                ? Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div
                  key={c.id}
                  className="flex flex-col justify-between rounded-xl border border-border/70 bg-background/60 p-3.5 shadow-2xs transition-all hover:border-primary/40"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                        {s?.title}
                      </span>
                      {daysLeft != null ? (
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[9px] font-bold",
                            daysLeft <= 3
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                          )}
                        >
                          {daysLeft <= 0
                            ? "Due today"
                            : daysLeft === 1
                              ? "Tomorrow"
                              : `In ${daysLeft} days`}
                        </span>
                      ) : null}
                    </div>

                    <h4 className="font-bold text-xs text-foreground">
                      Ch.{c.number} — {c.title || "Untitled Chapter"}
                    </h4>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Target Date: {formatDate(targetDate)}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5">
                    <ChapterStatusPill status={c.status} />
                    <Link
                      to="/app/series/$slug/$tab"
                      from="/app/series/$slug/$tab"
                      params={{ slug: s?.slug ?? "", tab: "chapters" }}
                      className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      Workspace <ChevronRightIcon className="size-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

