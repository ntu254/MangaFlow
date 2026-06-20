import { useMemo, useState } from "react";
import { findChapter, findSeries, type Task } from "@/entities";
import { parseDeadline } from "../lib/deadline";
import type { DueFilter } from "../components/TaskToolbar";

export function useTaskFilters(allTasks: Task[]) {
  const [search, setSearch] = useState("");
  const [seriesFilter, setSeriesFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");

  const seriesOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of allTasks) {
      const ch = findChapter(t.chapterId);
      const s = ch ? findSeries(ch.seriesId) : null;
      if (s && !map.has(s.id)) map.set(s.id, s.title);
    }
    return Array.from(map, ([id, label]) => ({ id, label }));
  }, [allTasks]);

  const typeOptions = useMemo(() => Array.from(new Set(allTasks.map((t) => t.type))), [allTasks]);

  const filtered = useMemo(() => {
    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const q = search.trim().toLowerCase();

    return allTasks.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;

      const ch = findChapter(t.chapterId);
      const s = ch ? findSeries(ch.seriesId) : null;
      if (seriesFilter !== "all" && s?.id !== seriesFilter) return false;

      if (q) {
        const hay = [s?.title, ch?.number, t.type, t.pageRange]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (dueFilter !== "all") {
        const d = parseDeadline(t.deadline);
        if (!d) return false;
        if (dueFilter === "overdue" && d.getTime() >= now.getTime()) return false;
        if (
          dueFilter === "week" &&
          (d.getTime() < now.getTime() || d.getTime() > weekAhead.getTime())
        )
          return false;
      }

      return true;
    });
  }, [allTasks, search, seriesFilter, typeFilter, dueFilter]);

  const hasActiveFilter =
    search.trim() !== "" || seriesFilter !== "all" || typeFilter !== "all" || dueFilter !== "all";

  function clear() {
    setSearch("");
    setSeriesFilter("all");
    setTypeFilter("all");
    setDueFilter("all");
  }

  return {
    state: { search, seriesFilter, typeFilter, dueFilter },
    setters: { setSearch, setSeriesFilter, setTypeFilter, setDueFilter },
    options: { seriesOptions, typeOptions },
    filtered,
    hasActiveFilter,
    clear,
  };
}
