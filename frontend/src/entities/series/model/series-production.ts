import type { ChapterStatus } from "./series-types";

export type SeriesPrimaryAction =
  | "open_studio"
  | "review_submissions"
  | "open_proposal"
  | "setup_chapters"
  | "resume_planning"
  | "view_publication";

export const PRIMARY_ACTION_LABEL: Record<SeriesPrimaryAction, string> = {
  open_studio: "Open Studio",
  review_submissions: "Review",
  open_proposal: "Open Proposal",
  setup_chapters: "Setup Chapters",
  resume_planning: "Resume Planning",
  view_publication: "View Publication",
};

export type SeriesProductionSummary = {
  publishedCount: number;
  currentChapter: { number: number; title: string; status: ChapterStatus } | null;
  openTaskCount: number;
  overdueTaskCount: number;
  revisionTaskCount: number;
  pendingReviewCount: number;
  nextDeadline: string | null;
  primaryAction: SeriesPrimaryAction;
};

export function formatDeadline(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) return `${diffDays}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
