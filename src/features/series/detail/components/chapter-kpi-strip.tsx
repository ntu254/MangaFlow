import { useMemo } from "react";
import { AlertTriangle, BookOpen, CheckCircle2, Eye, Images } from "lucide-react";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import { ChapterStatusPill } from "@/entities/chapter";
import { StatCard } from "@/shared/ui/stat-card";
import type { StatCardTone } from "@/shared/ui/stat-card-tones";

type Kpi = {
  icon: typeof BookOpen;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone: StatCardTone;
};

export function ChapterKpiStrip({
  series,
  chapters,
  current,
}: {
  series: ProductionSeries;
  chapters: Chapter[];
  current?: Chapter;
}) {
  const stats = useMemo(() => {
    const published = chapters.filter((c) => c.status === "PUBLISHED").length;
    const inReview = chapters.filter((c) => c.status === "EDITOR_REVIEW");
    const totalPages = chapters.reduce((sum, c) => sum + c.pages.length, 0);
    const targetPages = chapters.length
      ? Math.max(
          totalPages,
          chapters.length *
            Math.max(
              20,
              Math.round(totalPages / Math.max(1, chapters.filter((c) => c.pages.length).length)),
            ),
        )
      : 0;
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const atRisk = chapters.filter((c) => {
      if (c.status === "PUBLISHED" || c.status === "SCHEDULED" || c.status === "EDITOR_APPROVED")
        return false;
      const due = c.draftDueAt ?? c.reviewDueAt;
      if (!due) return false;
      const delta = new Date(due).getTime() - now;
      return delta <= weekMs;
    }).length;
    return { published, inReview, totalPages, targetPages, atRisk };
  }, [chapters]);

  const pagePct = stats.targetPages
    ? Math.min(100, Math.round((stats.totalPages / stats.targetPages) * 100))
    : 0;
  const progressPct = series.targetChapters
    ? Math.min(100, Math.round((stats.published / series.targetChapters) * 100))
    : 0;

  const items: Kpi[] = [
    {
      icon: BookOpen,
      label: "Tổng số chapters",
      value: chapters.length,
      hint: `${stats.published} đã hoàn thành`,
      tone: "blue",
    },
    {
      icon: CheckCircle2,
      label: "Chapter hiện tại",
      value: current ? String(current.number).padStart(3, "0") : "—",
      hint: current ? (
        <div className="flex items-center gap-1.5">
          <ChapterStatusPill status={current.status} />
          <span>Tiến độ: {progressPct}%</span>
        </div>
      ) : (
        "Chọn chapter"
      ),
      tone: "emerald",
    },
    {
      icon: Images,
      label: "Pages đã upload",
      value: (
        <span>
          {stats.totalPages}
          <span className="text-base text-muted-foreground">
            {" "}
            / {stats.targetPages || stats.totalPages}
          </span>
        </span>
      ),
      hint: (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-foreground/80" style={{ width: `${pagePct}%` }} />
          </div>
          <span className="tabular-nums">{pagePct}%</span>
        </div>
      ),
      tone: "blue",
    },
    {
      icon: Eye,
      label: "Chờ review nội bộ",
      value: stats.inReview.length,
      hint: stats.inReview.length ? `${stats.inReview.length} chapter` : "Không có",
      tone: stats.inReview.length ? "amber" : "neutral",
    },
    {
      icon: AlertTriangle,
      label: "Deadline có rủi ro",
      value: stats.atRisk,
      hint: "Trong 7 ngày tới",
      tone: stats.atRisk ? "amber" : "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map(({ icon: Icon, label, value, hint, tone }) => (
        <StatCard
          key={label}
          icon={<Icon className="size-4" />}
          tone={tone}
          label={label}
          value={value}
          hint={hint}
        />
      ))}
    </div>
  );
}
