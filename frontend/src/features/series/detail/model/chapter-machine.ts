import type { User } from "@/shared/auth";
import type {
  Chapter,
  ChapterAction,
  ChapterEvent,
  ChapterPage,
  ChapterStatus,
  ProductionSeries,
} from "@/entities/series/model/series-types";

export type ChapterActionCheck = { ok: boolean; reason?: string };

function isChapterAssigneeOrOwner(user: User, chapter: Chapter, series: ProductionSeries) {
  return (
    (user.role === "mangaka" && (chapter.assigneeId === user.id || series.authorId === user.id)) ||
    (user.role === "assistant" && chapter.assigneeId === user.id)
  );
}

function isOwningMangaka(user: User, series: ProductionSeries) {
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
      if (!isChapterAssigneeOrOwner(user, chapter, series))
        return { ok: false, reason: "Only assignee or admin." };
      if (chapter.status !== "PLANNED")
        return { ok: false, reason: "Can only start when PLANNED." };
      return { ok: true };
    case "SUBMIT_REVIEW":
      if (series.status !== "ONGOING" && series.status !== "COMPLETED")
        return { ok: false, reason: "Series must be approved before chapter review." };
      if (!isOwningMangaka(user, series))
        return { ok: false, reason: "Only the owning Mangaka can send this chapter." };
      if (!["PLANNED", "IN_PRODUCTION"].includes(chapter.status))
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
      if (!isOwningMangaka(user, series))
        return { ok: false, reason: "Only the owning Mangaka can resubmit this chapter." };
      if (chapter.status !== "REVISION_REQUIRED")
        return { ok: false, reason: "Can only resubmit when in REVISION_REQUIRED." };
      return { ok: true };
    case "REQUEST_REVISION":
      if (!isEditor(user, series)) return { ok: false, reason: "Editor only." };
      if (series.authorId === user.id)
        return { ok: false, reason: "An Editor cannot review their own production chapter." };
      if (chapter.status !== "TANTOU_REVIEW")
        return { ok: false, reason: "Only during TANTOU_REVIEW." };
      return { ok: true };
    case "EDITOR_APPROVE":
      if (!isEditor(user, series)) return { ok: false, reason: "Editor only." };
      if (series.authorId === user.id)
        return { ok: false, reason: "An Editor cannot review their own production chapter." };
      if (chapter.status !== "TANTOU_REVIEW")
        return { ok: false, reason: "Can only approve from TANTOU_REVIEW." };
      return { ok: true };
    case "SCHEDULE":
      if (!isEditor(user, series)) return { ok: false, reason: "Editor only." };
      if (chapter.status !== "READY_FOR_PUBLICATION")
        return { ok: false, reason: "Can only schedule from READY_FOR_PUBLICATION." };
      return { ok: true };
    case "PUBLISH":
      if (!isEditor(user, series)) return { ok: false, reason: "Editor only." };
      if (chapter.status !== "READY_FOR_PUBLICATION")
        return { ok: false, reason: "Can only publish from READY_FOR_PUBLICATION." };
      return { ok: true };
    case "REASSIGN":
      if (user.role !== "admin" && user.role !== "editor")
        return { ok: false, reason: "Editor/admin only." };
      if (chapter.status === "PUBLISHED")
        return { ok: false, reason: "Chapter already published." };
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

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export type ChapterTransitionPayload = {
  comment?: string;
  scheduledAt?: string;
  reviewNote?: string;
  newAssigneeId?: string;
  newAssigneeName?: string;
  pages?: Omit<ChapterPage, "id" | "uploadedAt">[];
};

export type ChapterTransitionResult = {
  chapter: Chapter;
  notify: { userId: string; message: string; kind: string }[];
};

export function applyChapterTransition(
  chapter: Chapter,
  action: ChapterAction,
  user: User,
  series: ProductionSeries,
  payload: ChapterTransitionPayload = {},
): ChapterTransitionResult {
  const check = checkChapterAction(action, user, chapter, series);
  if (!check.ok) throw new Error(check.reason ?? "Invalid action.");

  const now = new Date().toISOString();
  const base = {
    id: uid("ce"),
    chapterId: chapter.id,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    createdAt: now,
  };

  const events: ChapterEvent[] = [];
  const notify: ChapterTransitionResult["notify"] = [];
  const next: Chapter = { ...chapter, updatedAt: now };

  const editorTarget = series.editorId;
  const authorTarget = series.authorId;

  const transit = (to: ChapterStatus, type: ChapterAction) => {
    const from = next.status;
    next.status = to;
    events.push({
      ...base,
      id: uid("ce"),
      type,
      fromStatus: from,
      toStatus: to,
      comment: payload.comment,
    });
  };

  switch (action) {
    case "START_DRAFT":
      transit("IN_PRODUCTION", "START_DRAFT");
      notify.push({
        userId: editorTarget,
        kind: "chapter.started",
        message: `Chapter ${chapter.number} (${series.title}) has started drafting.`,
      });
      break;
    case "SUBMIT_REVIEW":
      transit("TANTOU_REVIEW", "SUBMIT_REVIEW");
      notify.push({
        userId: editorTarget,
        kind: "chapter.submitted",
        message: `Chapter ${chapter.number} of ${series.title} has been submitted for review.`,
      });
      break;
    case "RESUBMIT": {
      next.revisionRound = (next.revisionRound ?? 0) + 1;
      transit("TANTOU_REVIEW", "RESUBMIT");
      notify.push({
        userId: editorTarget,
        kind: "chapter.resubmitted",
        message: `Chapter ${chapter.number} (${series.title}) has been resubmitted (round ${next.revisionRound}).`,
      });
      break;
    }
    case "REQUEST_REVISION": {
      if (!payload.reviewNote) throw new Error("A revision note is required.");
      next.reviewNotes = [
        ...next.reviewNotes,
        {
          id: uid("rn"),
          authorId: user.id,
          authorName: user.name,
          authorRole: user.role,
          text: payload.reviewNote,
          resolved: false,
          createdAt: now,
        },
      ];
      transit("REVISION_REQUIRED", "REQUEST_REVISION");
      notify.push({
        userId: chapter.assigneeId,
        kind: "chapter.revision",
        message: `Editor requested revisions for chapter ${chapter.number} (${series.title}).`,
      });
      notify.push({
        userId: authorTarget,
        kind: "chapter.revision",
        message: `Chapter ${chapter.number} (${series.title}) needs revisions.`,
      });
      break;
    }
    case "EDITOR_APPROVE":
      transit("READY_FOR_PUBLICATION", "EDITOR_APPROVE");
      notify.push({
        userId: chapter.assigneeId,
        kind: "chapter.approved",
        message: `Chapter ${chapter.number} (${series.title}) has been approved.`,
      });
      notify.push({
        userId: authorTarget,
        kind: "chapter.approved",
        message: `Chapter ${chapter.number} has been approved.`,
      });
      break;
    case "SCHEDULE": {
      if (!payload.scheduledAt) throw new Error("Schedule date is required.");
      // Scheduling lives on the Publication; the chapter stays READY_FOR_PUBLICATION.
      next.scheduledAt = payload.scheduledAt;
      next.publication = {
        id: uid("pub"),
        seriesId: series.id,
        chapterId: chapter.id,
        status: "SCHEDULED",
        scheduledAt: payload.scheduledAt,
      };
      transit(next.status, "SCHEDULE");
      notify.push({
        userId: chapter.assigneeId,
        kind: "chapter.scheduled",
        message: `Chapter ${chapter.number} has been scheduled.`,
      });
      notify.push({
        userId: authorTarget,
        kind: "chapter.scheduled",
        message: `Chapter ${chapter.number} (${series.title}) has been scheduled.`,
      });
      break;
    }
    case "PUBLISH": {
      next.publishedAt = now;
      if (!next.scheduledAt) next.scheduledAt = now;
      transit("PUBLISHED", "PUBLISH");
      notify.push({
        userId: chapter.assigneeId,
        kind: "chapter.published",
        message: `Chapter ${chapter.number} (${series.title}) has been published.`,
      });
      notify.push({
        userId: authorTarget,
        kind: "chapter.published",
        message: `Chapter ${chapter.number} (${series.title}) has been published.`,
      });
      notify.push({
        userId: "u-admin",
        kind: "chapter.published",
        message: `Chapter ${chapter.number} (${series.title}) has been published.`,
      });
      break;
    }
    case "REASSIGN": {
      if (!payload.newAssigneeId || !payload.newAssigneeName)
        throw new Error("New assignee is required.");
      next.assigneeId = payload.newAssigneeId;
      next.assigneeName = payload.newAssigneeName;
      events.push({
        ...base,
        id: uid("ce"),
        type: "REASSIGN",
        comment: `Changed assignee to ${payload.newAssigneeName}.`,
      });
      notify.push({
        userId: payload.newAssigneeId,
        kind: "chapter.assigned",
        message: `You have been assigned Chapter ${chapter.number} (${series.title}).`,
      });
      break;
    }
  }

  next.history = [...next.history, ...events];
  return { chapter: next, notify };
}

export function chapterReadinessForPublish(chapter: Chapter): { ready: boolean; reason?: string } {
  if (chapter.status === "PUBLISHED") return { ready: false, reason: "Already published." };
  const scheduledAt =
    chapter.publication?.status === "SCHEDULED" ? chapter.publication.scheduledAt : undefined;
  if (scheduledAt) {
    const due = new Date(scheduledAt).getTime();
    if (due > Date.now())
      return { ready: false, reason: `Waiting until ${new Date(due).toLocaleString("en-US")}.` };
  }
  return { ready: chapter.status === "READY_FOR_PUBLICATION" };
}
