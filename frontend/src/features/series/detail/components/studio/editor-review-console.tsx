import { useMemo } from "react";
import {
  AlertTriangle,
  Check,
  CircleDot,
  Clock3,
  FileCheck2,
  Flag,
  RotateCcw,
  Send,
} from "lucide-react";
import { useChapterReviewsQuery } from "@/entities/series";
import { ChapterStatusPill } from "@/entities/chapter";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import type { StudioComment } from "@/entities/series/model/studio-types";
import { formatDateTime } from "@/shared/lib/format-date";
import { ChapterActionPanel } from "../chapter-action-panel";

type Props = {
  chapter: Chapter;
  series: ProductionSeries;
  comments: StudioComment[];
};

const REVIEW_STAGES: Array<{ label: string; statuses: Chapter["status"][] }> = [
  { label: "Production", statuses: ["IN_PRODUCTION"] },
  { label: "Review", statuses: ["TANTOU_REVIEW"] },
  { label: "Revision", statuses: ["REVISION_REQUIRED"] },
  { label: "Ready", statuses: ["READY_FOR_PUBLICATION", "PUBLISHED"] },
];

export function EditorReviewConsole({ chapter, series, comments }: Props) {
  const { data: reviews = [] } = useChapterReviewsQuery(chapter.id);
  const stats = useMemo(() => {
    const chapterComments = comments.filter((comment) => comment.chapterId === chapter.id);
    return {
      blocking: chapterComments.filter(
        (comment) => comment.isBlocking && comment.status !== "RESOLVED",
      ).length,
      open: chapterComments.filter(
        (comment) => comment.status === "OPEN" || comment.status === "REOPENED",
      ).length,
      addressed: chapterComments.filter((comment) => comment.status === "ADDRESSED").length,
    };
  }, [chapter.id, comments]);
  const activeReview = reviews.find((review) => review.status === "OPEN") ?? reviews[0];
  const currentStage = REVIEW_STAGES.findIndex((stage) => stage.statuses.includes(chapter.status));
  const isInReview = chapter.status === "TANTOU_REVIEW";
  const summary =
    stats.blocking > 0
      ? `${stats.blocking} blocking issue${stats.blocking === 1 ? "" : "s"} must be resolved.`
      : isInReview
        ? "Ready for an editorial decision."
        : chapter.status === "REVISION_REQUIRED"
          ? "Waiting for a revised submission."
          : "Review is not currently open.";

  return (
    <section className="space-y-4" aria-label="Editorial review console">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="border-b border-border bg-muted/35 px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-serif text-lg font-semibold leading-none">Editorial review</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{summary}</p>
            </div>
            <ChapterStatusPill status={chapter.status} />
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          <ReviewMetric
            label="Blocking"
            value={stats.blocking}
            tone={stats.blocking > 0 ? "danger" : "success"}
          />
          <ReviewMetric label="Open" value={stats.open} tone="neutral" />
          <ReviewMetric label="Addressed" value={stats.addressed} tone="attention" />
        </div>

        <div className="space-y-3 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold text-foreground">Review progress</h3>
            <span className="text-[11px] text-muted-foreground">
              {currentStage >= 0 ? REVIEW_STAGES[currentStage]?.label : "Planned"}
            </span>
          </div>
          <ol className="grid grid-cols-4 gap-1" aria-label="Chapter review progress">
            {REVIEW_STAGES.map((stage, index) => {
              const complete = currentStage > index;
              const current = currentStage === index;
              return (
                <li key={stage.label} className="min-w-0">
                  <div
                    className={`mb-1.5 h-1 rounded-full ${
                      current ? "bg-primary" : complete ? "bg-emerald-500" : "bg-muted"
                    }`}
                  />
                  <span
                    className={`block truncate text-[10px] font-medium ${
                      current || complete ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {stage.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="space-y-2 border-y border-border py-3">
        <h3 className="text-xs font-semibold text-foreground">Review snapshot</h3>
        {activeReview ? (
          <dl className="space-y-2 text-xs">
            <SnapshotRow label="Snapshot" value={activeReview.status} icon={FileCheck2} />
            <SnapshotRow
              label="Frozen pages"
              value={String(activeReview.pageVersionIds.length)}
              icon={Flag}
            />
            <SnapshotRow
              label="Submitted"
              value={formatDateTime(activeReview.createdAt)}
              icon={Clock3}
            />
          </dl>
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">
            No review snapshot exists yet. The Mangaka must submit this chapter for review first.
          </p>
        )}
      </div>

      <ChapterActionPanel chapter={chapter} series={series} />
    </section>
  );
}

function ReviewMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "success" | "attention" | "neutral";
}) {
  const Icon =
    tone === "danger"
      ? AlertTriangle
      : tone === "success"
        ? Check
        : tone === "attention"
          ? Send
          : CircleDot;
  const className =
    tone === "danger"
      ? "text-rose-700 dark:text-rose-300"
      : tone === "success"
        ? "text-emerald-700 dark:text-emerald-300"
        : tone === "attention"
          ? "text-amber-700 dark:text-amber-300"
          : "text-foreground";
  return (
    <div className="min-w-0 px-2 py-2.5 text-center">
      <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${className}`}>
        <Icon className="size-3" aria-hidden="true" />
        {label}
      </span>
      <strong className={`mt-1 block text-lg leading-none ${className}`}>{value}</strong>
    </div>
  );
}

function SnapshotRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Clock3;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd className="truncate text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
