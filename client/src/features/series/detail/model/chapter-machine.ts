import type { User } from "@/shared/auth";
import type {
  Chapter,
  ChapterAction,
  ProductionSeries,
} from "@/entities/series/model/series-types";

export type ChapterActionCheck = { ok: boolean; reason?: string };

function isMangakaOwner(user: User, chapter: Chapter, series: ProductionSeries) {
  return user.role === "mangaka" && series.authorId === user.id;
}

function isEditor(user: User, series: ProductionSeries) {
  return user.role === "editor" && series.editorId === user.id;
}

export function checkChapterAction(
  action: ChapterAction,
  user: User,
  chapter: Chapter,
  series: ProductionSeries,
): ChapterActionCheck {
  switch (action) {
    case "START_DRAFT":
      if (!isMangakaOwner(user, chapter, series))
        return { ok: false, reason: "Only the Mangaka owner can do this." };
      if (chapter.status !== "PLANNED")
        return { ok: false, reason: "Can only start from PLANNED." };
      return { ok: true };
    case "SUBMIT_REVIEW":
      if (series.status !== "ONGOING" && series.status !== "COMPLETED")
        return { ok: false, reason: "Series must be approved before chapter review." };
      if (!isMangakaOwner(user, chapter, series))
        return { ok: false, reason: "Only the Mangaka owner can send this chapter." };
      if (!["PLANNED", "DRAFTING", "ASSISTANT_WORKING", "REVISION"].includes(chapter.status))
        return { ok: false, reason: "Chapter is not ready to enter Editor Review." };
      if (
        chapter.pages.length === 0 ||
        chapter.pages.some(
          (page) =>
            (!page.fileKey && !page.fileUrl && !page.imageUrl) || page.status === "PENDING_UPLOAD",
        )
      )
        return { ok: false, reason: "Page image is required before Editor Review." };
      return { ok: true };
    case "RESUBMIT":
      if (!isMangakaOwner(user, chapter, series))
        return { ok: false, reason: "Only the assignee can do this." };
      if (chapter.status !== "REVISION")
        return { ok: false, reason: "Can only resubmit in REVISION." };
      return { ok: true };
    case "REQUEST_REVISION":
      if (!isEditor(user, series)) return { ok: false, reason: "Only an editor can do this." };
      if (chapter.status !== "EDITOR_REVIEW")
        return { ok: false, reason: "Only in EDITOR_REVIEW." };
      return { ok: true };
    case "EDITOR_APPROVE":
      if (!isEditor(user, series)) return { ok: false, reason: "Only an editor can do this." };
      if (chapter.status !== "EDITOR_REVIEW")
        return { ok: false, reason: "Can only approve from EDITOR_REVIEW." };
      return { ok: true };
    case "SCHEDULE":
      if (!isEditor(user, series)) return { ok: false, reason: "Only an editor can do this." };
      if (chapter.status !== "READY_FOR_PUBLICATION" && chapter.status !== "SCHEDULED")
        return {
          ok: false,
          reason: "Can only schedule from APPROVED or reschedule while SCHEDULED.",
        };
      return { ok: true };
    case "PUBLISH":
      if (!isEditor(user, series)) return { ok: false, reason: "Only an editor can do this." };
      if (chapter.status !== "SCHEDULED" && chapter.status !== "READY_FOR_PUBLICATION")
        return { ok: false, reason: "Can only publish from APPROVED/SCHEDULED." };
      return { ok: true };
    case "REASSIGN":
      if (!isEditor(user, series))
        return { ok: false, reason: "Only the Tantou Editor can do this." };
      if (chapter.status === "PUBLISHED")
        return { ok: false, reason: "Chapter has already been published." };
      return { ok: true };
    default:
      return { ok: false, reason: "Unknown action." };
  }
}

export function allowedChapterActions(
  user: User,
  chapter: Chapter,
  series: ProductionSeries,
): ChapterAction[] {
  const all: ChapterAction[] = [
    "START_DRAFT",
    "SUBMIT_REVIEW",
    "RESUBMIT",
    "REQUEST_REVISION",
    "EDITOR_APPROVE",
    "SCHEDULE",
    "PUBLISH",
    "REASSIGN",
  ];
  return all.filter((a) => checkChapterAction(a, user, chapter, series).ok);
}

export function chapterReadinessForPublish(chapter: Chapter): { ready: boolean; reason?: string } {
  if (chapter.status === "PUBLISHED") return { ready: false, reason: "Published." };
  if (chapter.status === "SCHEDULED" && chapter.scheduledAt) {
    const due = new Date(chapter.scheduledAt).getTime();
    if (due > Date.now())
      return { ready: false, reason: `Wait until ${new Date(due).toLocaleString("vi-VN")}.` };
  }
  return {
    ready:
      chapter.status === "SCHEDULED" ||
      chapter.status === "EDITOR_APPROVED" ||
      chapter.status === "READY_FOR_PUBLICATION",
  };
}
