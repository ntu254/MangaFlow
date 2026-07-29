import type { StudioTask } from "@/entities/series/model/studio-types";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";

export type TaskContext = {
  task: StudioTask;
  chapter?: Chapter;
  series?: ProductionSeries;
  pageIndex?: number;
};

export function buildTaskContext(
  task: StudioTask,
  chapters: Chapter[],
  seriesList: ProductionSeries[],
): TaskContext {
  const chapter = chapters.find((c) => c.id === task.chapterId);
  const series = chapter ? seriesList.find((s) => s.id === chapter.seriesId) : undefined;
  const page = chapter?.pages.find((p) => p.id === task.pageId);
  return { task, chapter, series, pageIndex: page?.index };
}

export function daysUntil(iso: string): number {
  const due = new Date(iso).getTime();
  const now = Date.now();
  return Math.round((due - now) / 86_400_000);
}

export function deadlineRisk(iso: string): { label: string; tone: "rose" | "amber" | "emerald" } {
  const d = daysUntil(iso);
  if (d < 0) return { label: `${-d}d overdue`, tone: "rose" };
  if (d <= 2) return { label: `${d}d`, tone: "rose" };
  if (d <= 5) return { label: `${d}d`, tone: "amber" };
  return { label: `${d}d`, tone: "emerald" };
}

export function priorityLabel(p: StudioTask["priority"]): string {
  return p === "high" ? "High" : p === "low" ? "Low" : "Normal";
}

export function priorityBadge(p: StudioTask["priority"]): string {
  return p === "high"
    ? "bg-rose-100 text-rose-900"
    : p === "low"
      ? "bg-zinc-100 text-zinc-700"
      : "bg-blue-100 text-blue-900";
}
