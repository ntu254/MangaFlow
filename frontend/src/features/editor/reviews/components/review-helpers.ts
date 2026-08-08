import type { StudioComment } from "@/entities/series/model/studio-types";

export type CommentTone = "rose" | "blue" | "amber" | "emerald";

export type PageBadge = { label: string; tone: CommentTone };

export type CommentStats = { blocking: number; open: number; addressed: number; total: number };

export function isBlocking(comment: StudioComment) {
  return Boolean(comment.isBlocking);
}

/** Only a blocking note authored by a Tantou can be verified by the Tantou. */
export function isTantouBlocking(comment: StudioComment, assignedEditorId?: string) {
  return (
    isBlocking(comment) &&
    (comment.authorRole?.toUpperCase() === "EDITOR" ||
      (Boolean(assignedEditorId) && comment.authorId === assignedEditorId))
  );
}

export function commentText(comment: StudioComment) {
  return comment.body || comment.text || "";
}

export function commentTone(comment: StudioComment): CommentTone {
  if (comment.status === "RESOLVED") return "emerald";
  if (isBlocking(comment)) return "rose";
  if (comment.status === "ADDRESSED") return "amber";
  return "blue";
}

export function statusLabel(comment: StudioComment) {
  if (comment.status === "RESOLVED") return "Resolved";
  if (isBlocking(comment)) return "Blocking";
  if (comment.status === "ADDRESSED") return "Addressed";
  return "Open";
}

export const TONE_DOT: Record<CommentTone, string> = {
  rose: "bg-rose-500",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
};

export const TONE_PILL: Record<CommentTone, string> = {
  rose: "bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300",
  blue: "bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300",
  amber: "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300",
  emerald: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300",
};

export function statsForComments(comments: StudioComment[]): CommentStats {
  let blocking = 0;
  let open = 0;
  let addressed = 0;
  for (const c of comments) {
    if (c.status === "RESOLVED") continue;
    if (isBlocking(c)) blocking += 1;
    else if (c.status === "ADDRESSED") addressed += 1;
    else open += 1;
  }
  return { blocking, open, addressed, total: comments.length };
}

export function pageBadge(stats: CommentStats): PageBadge {
  if (stats.blocking > 0) return { label: "Blocking", tone: "rose" };
  if (stats.addressed > 0) return { label: "Addressed", tone: "amber" };
  if (stats.open > 0)
    return { label: `${stats.open} Comment${stats.open > 1 ? "s" : ""}`, tone: "blue" };
  return { label: "Clean", tone: "emerald" };
}
