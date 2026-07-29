import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import { monthGrid, sameDay, formatDate } from "@/shared/lib/format-date";
import { ChapterStatusPill } from "@/entities/chapter";

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

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Publication Calendar
          </p>
          <p className="font-serif text-lg capitalize">{monthLabel}</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() =>
              setCursor((p) => ({ y: p.m === 0 ? p.y - 1 : p.y, m: p.m === 0 ? 11 : p.m - 1 }))
            }
            className="grid size-8 place-items-center rounded border border-border hover:bg-muted"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() =>
              setCursor(() => {
                const d = new Date();
                return { y: d.getFullYear(), m: d.getMonth() };
              })
            }
            className="rounded border border-border px-3 text-xs hover:bg-muted"
          >
            Today
          </button>
          <button
            onClick={() =>
              setCursor((p) => ({ y: p.m === 11 ? p.y + 1 : p.y, m: p.m === 11 ? 0 : p.m + 1 }))
            }
            className="grid size-8 place-items-center rounded border border-border hover:bg-muted"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {dayKeys.map((d) => (
          <div key={d} className="px-2 py-1.5 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
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
              className={`min-h-[88px] border-b border-r border-border p-1.5 text-[11px] ${
                inMonth ? "" : "bg-muted/20 text-muted-foreground/60"
              } ${isToday ? "bg-amber-50" : ""}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className={`font-semibold ${isToday ? "text-amber-700" : ""}`}>
                  {d.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {events.map((c) => {
                  const s = series.find((x) => x.id === c.seriesId);
                  const conflict =
                    c.scheduledAt &&
                    conflicts.has(`${c.seriesId}|${new Date(c.scheduledAt).toDateString()}`);
                  return (
                    <Link
                      key={c.id}
                      to="/app/series/$slug/$tab"
                      params={{ slug: s?.slug ?? "", tab: "overview" }}
                      className="block rounded border border-border bg-background px-1.5 py-1 text-[10px] hover:bg-muted"
                      title={`${s?.title} — Ch.${c.number} ${c.title}`}
                    >
                      <div className="flex items-center gap-1">
                        {conflict ? <AlertTriangle className="size-2.5 text-amber-600" /> : null}
                        <span className="truncate font-semibold">#{c.number}</span>
                      </div>
                      <div className="truncate text-muted-foreground">{s?.title}</div>
                      <ChapterStatusPill status={c.status} className="mt-0.5" />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Next 30 Days
        </p>
        <ul className="mt-2 space-y-1 text-xs">
          {filtered
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
            )
            .slice(0, 8)
            .map((c) => {
              const s = series.find((x) => x.id === c.seriesId);
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded border border-border bg-background px-3 py-1.5"
                >
                  <span>
                    <span className="font-semibold">{s?.title}</span> · Ch.{c.number} {c.title}
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <ChapterStatusPill status={c.status} />
                    {formatDate(c.scheduledAt ?? c.draftDueAt)}
                  </span>
                </li>
              );
            })}
          {filtered.filter((c) => {
            const t = c.scheduledAt ?? c.draftDueAt;
            if (!t) return false;
            const d = new Date(t).getTime();
            return d >= Date.now() && d <= Date.now() + 30 * 86400000;
          }).length === 0 ? (
            <li className="text-muted-foreground">No events in the next 30 days.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
