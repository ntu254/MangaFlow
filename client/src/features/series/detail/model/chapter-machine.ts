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

function isMangakaOwner(user: User, chapter: Chapter, series: ProductionSeries) {
  return user.role === "mangaka" && series.authorId === user.id;
}

function isEditor(user: User, _series: ProductionSeries) {
  return user.role === "admin" || user.role === "editor";
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
        return { ok: false, reason: "Chỉ assignee hoặc admin." };
      if (chapter.status !== "PLANNED") return { ok: false, reason: "Chỉ start khi PLANNED." };
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
      if (!isMangakaOwner(user, chapter, series)) return { ok: false, reason: "Chỉ assignee." };
      if (chapter.status !== "REVISION") return { ok: false, reason: "Chỉ resubmit khi REVISION." };
      return { ok: true };
    case "REQUEST_REVISION":
      if (!isEditor(user, series)) return { ok: false, reason: "Chỉ editor." };
      if (chapter.status !== "EDITOR_REVIEW")
        return { ok: false, reason: "Chỉ khi EDITOR_REVIEW." };
      return { ok: true };
    case "EDITOR_APPROVE":
      if (!isEditor(user, series)) return { ok: false, reason: "Chỉ editor." };
      if (chapter.status !== "EDITOR_REVIEW")
        return { ok: false, reason: "Chỉ approve từ EDITOR_REVIEW." };
      return { ok: true };
    case "SCHEDULE":
      if (!isEditor(user, series)) return { ok: false, reason: "Chỉ editor." };
      if (chapter.status !== "READY_FOR_PUBLICATION" && chapter.status !== "SCHEDULED")
        return { ok: false, reason: "Chỉ schedule từ APPROVED hoặc reschedule khi SCHEDULED." };
      return { ok: true };
    case "PUBLISH":
      if (!isEditor(user, series)) return { ok: false, reason: "Chỉ editor." };
      if (chapter.status !== "SCHEDULED" && chapter.status !== "READY_FOR_PUBLICATION")
        return { ok: false, reason: "Chỉ publish từ APPROVED/SCHEDULED." };
      return { ok: true };
    case "REASSIGN":
      if (user.role !== "admin" && user.role !== "editor")
        return { ok: false, reason: "Chỉ editor/admin." };
      if (chapter.status === "PUBLISHED") return { ok: false, reason: "Chapter đã publish." };
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
  if (!check.ok) throw new Error(check.reason ?? "Action không hợp lệ.");

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
      transit("DRAFTING", "START_DRAFT");
      notify.push({
        userId: editorTarget,
        kind: "chapter.started",
        message: `Chapter ${chapter.number} (${series.title}) đã bắt đầu drafting.`,
      });
      break;
    case "SUBMIT_REVIEW":
      transit("EDITOR_REVIEW", "SUBMIT_REVIEW");
      notify.push({
        userId: editorTarget,
        kind: "chapter.submitted",
        message: `Chapter ${chapter.number} của ${series.title} đã submit review.`,
      });
      break;
    case "RESUBMIT": {
      next.revisionRound = (next.revisionRound ?? 0) + 1;
      transit("EDITOR_REVIEW", "RESUBMIT");
      notify.push({
        userId: editorTarget,
        kind: "chapter.resubmitted",
        message: `Chapter ${chapter.number} (${series.title}) đã resubmit (vòng ${next.revisionRound}).`,
      });
      break;
    }
    case "REQUEST_REVISION": {
      if (!payload.reviewNote) throw new Error("Cần ghi rõ ghi chú revision.");
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
      transit("REVISION", "REQUEST_REVISION");
      notify.push({
        userId: chapter.assigneeId,
        kind: "chapter.revision",
        message: `Editor yêu cầu chỉnh sửa chapter ${chapter.number} (${series.title}).`,
      });
      notify.push({
        userId: authorTarget,
        kind: "chapter.revision",
        message: `Chapter ${chapter.number} (${series.title}) cần chỉnh sửa.`,
      });
      break;
    }
    case "EDITOR_APPROVE":
      transit("EDITOR_APPROVED", "EDITOR_APPROVE");
      notify.push({
        userId: chapter.assigneeId,
        kind: "chapter.approved",
        message: `Chapter ${chapter.number} (${series.title}) đã được approve.`,
      });
      notify.push({
        userId: authorTarget,
        kind: "chapter.approved",
        message: `Chapter ${chapter.number} đã approve.`,
      });
      break;
    case "SCHEDULE": {
      if (!payload.scheduledAt) throw new Error("Cần ngày schedule.");
      next.scheduledAt = payload.scheduledAt;
      transit("SCHEDULED", "SCHEDULE");
      notify.push({
        userId: chapter.assigneeId,
        kind: "chapter.scheduled",
        message: `Chapter ${chapter.number} đã được schedule.`,
      });
      notify.push({
        userId: authorTarget,
        kind: "chapter.scheduled",
        message: `Chapter ${chapter.number} (${series.title}) đã schedule.`,
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
        message: `Chapter ${chapter.number} (${series.title}) đã publish.`,
      });
      notify.push({
        userId: authorTarget,
        kind: "chapter.published",
        message: `Chapter ${chapter.number} (${series.title}) đã publish.`,
      });
      notify.push({
        userId: "u-admin",
        kind: "chapter.published",
        message: `Chapter ${chapter.number} (${series.title}) đã publish.`,
      });
      break;
    }
    case "REASSIGN": {
      if (!payload.newAssigneeId || !payload.newAssigneeName)
        throw new Error("Thiếu assignee mới.");
      next.assigneeId = payload.newAssigneeId;
      next.assigneeName = payload.newAssigneeName;
      events.push({
        ...base,
        id: uid("ce"),
        type: "REASSIGN",
        comment: `Đổi assignee → ${payload.newAssigneeName}.`,
      });
      notify.push({
        userId: payload.newAssigneeId,
        kind: "chapter.assigned",
        message: `Bạn được giao Chapter ${chapter.number} (${series.title}).`,
      });
      break;
    }
  }

  next.history = [...next.history, ...events];
  return { chapter: next, notify };
}

export function chapterReadinessForPublish(chapter: Chapter): { ready: boolean; reason?: string } {
  if (chapter.status === "PUBLISHED") return { ready: false, reason: "Đã publish." };
  if (chapter.status === "SCHEDULED" && chapter.scheduledAt) {
    const due = new Date(chapter.scheduledAt).getTime();
    if (due > Date.now())
      return { ready: false, reason: `Chờ tới ${new Date(due).toLocaleString("vi-VN")}.` };
  }
  return {
    ready:
      chapter.status === "SCHEDULED" ||
      chapter.status === "EDITOR_APPROVED" ||
      chapter.status === "READY_FOR_PUBLICATION",
  };
}
