import type {
  SeriesPrimaryAction,
  SeriesProductionSummary,
} from "@/entities/series/model/series-production";
import { PRIMARY_ACTION_LABEL, formatDeadline } from "@/entities/series/model/series-production";
export type {
  SeriesPrimaryAction,
  SeriesProductionSummary,
} from "@/entities/series/model/series-production";
export { PRIMARY_ACTION_LABEL, formatDeadline } from "@/entities/series/model/series-production";
import type {
  ProductionSeries,
  Chapter,
  ChapterStatus,
} from "@/entities/series/model/series-types";
import type { StudioTask } from "@/entities/series/model/studio-types";
import type { AssistantSubmission } from "@/entities/submission/model/assistant-types";

export function deriveProductionSummary(
  series: ProductionSeries,
  chapters: Chapter[],
  tasks: StudioTask[],
  submissions: AssistantSubmission[],
): SeriesProductionSummary {
  const publishedCount = chapters.filter((c) => c.status === "PUBLISHED").length;

  const currentChapter =
    chapters.filter((c) => c.status !== "PUBLISHED").sort((a, b) => a.number - b.number)[0] ?? null;

  const chapterIds = new Set(chapters.map((c) => c.id));

  const seriesTasks = tasks.filter((t) => chapterIds.has(t.chapterId));
  const openTaskCount = seriesTasks.filter(
    (t) => t.status === "TODO" || t.status === "IN_PROGRESS",
  ).length;

  const now = Date.now();
  const overdueTaskCount = seriesTasks.filter((t) => {
    if (t.status === "EDITOR_APPROVED" || t.status === "REJECTED" || t.status === "CANCELLED")
      return false;
    if (!t.dueAt) return false;
    return new Date(t.dueAt).getTime() < now;
  }).length;

  const blockedTaskCount = seriesTasks.filter(
    (t) =>
      t.blocked ||
      t.status === "MANGAKA_REVISION_REQUESTED" ||
      t.status === "EDITOR_REVISION_REQUESTED",
  ).length;

  const reviewChapterCount = chapters.filter((c) => c.status === "TANTOU_REVIEW").length;
  const pendingSubmissionCount = submissions.filter(
    (s) =>
      s.status === "PENDING" ||
      s.status === "MANGAKA_REVISION_REQUESTED" ||
      s.status === "EDITOR_REVISION_REQUESTED",
  ).length;
  const pendingReviewCount = reviewChapterCount + pendingSubmissionCount;

  const deadlines: string[] = [];
  for (const ch of chapters) {
    if (ch.status === "PUBLISHED" || ch.publication?.status === "SCHEDULED") continue;
    if (ch.draftDueAt) deadlines.push(ch.draftDueAt);
    if (ch.reviewDueAt) deadlines.push(ch.reviewDueAt);
    if (ch.scheduledAt) deadlines.push(ch.scheduledAt);
  }
  for (const t of seriesTasks) {
    if (t.status === "EDITOR_APPROVED" || t.status === "REJECTED" || t.status === "CANCELLED")
      continue;
    if (t.dueAt) deadlines.push(t.dueAt);
  }
  const futureDeadlines = deadlines
    .filter((d) => new Date(d).getTime() > now)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const nextDeadline = futureDeadlines[0] ?? null;

  const primaryAction = derivePrimaryAction(
    series,
    chapters,
    seriesTasks,
    overdueTaskCount,
    blockedTaskCount,
    pendingReviewCount,
  );

  return {
    publishedCount,
    currentChapter: currentChapter
      ? {
          number: currentChapter.number,
          title: currentChapter.title,
          status: currentChapter.status,
        }
      : null,
    openTaskCount,
    overdueTaskCount,
    blockedTaskCount,
    pendingReviewCount,
    nextDeadline,
    primaryAction,
  };
}

function derivePrimaryAction(
  series: ProductionSeries,
  chapters: Chapter[],
  tasks: StudioTask[],
  overdueTaskCount: number,
  blockedTaskCount: number,
  pendingReviewCount: number,
): SeriesPrimaryAction {
  if (series.status === "COMPLETED") return "view_publication";
  if (series.status === "HIATUS") return "resume_planning";
  if (overdueTaskCount > 0) return "view_task_board";
  if (blockedTaskCount > 0) return "view_task_board";
  if (pendingReviewCount > 0) return "review_submissions";
  if (series.status === "PLANNING" && chapters.length === 0) return "open_proposal";
  if (series.status === "PLANNING") return "setup_chapters";
  return "open_studio";
}
