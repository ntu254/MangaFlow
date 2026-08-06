import { ChapterModel, SeriesMemberModel, StudioTaskModel, UserModel } from "../db/models.js";
import { AppError } from "../lib/http.js";
import type { RequestActor } from "../types.js";
import { nowIso } from "../domain/ids.js";

/**
 * Terminal task statuses that should not block a page-assignment release.
 *
 * Workflow integrity invariant (Sprint 1.3):
 *   MANGAKA_APPROVED is NOT terminal — it only means the owning Mangaka
 *   accepted the submission; an Editor approval step is still required
 *   before any task can be released. Releasing a page assignment while an
 *   Editor-approved-but-not-yet-paid task exists lets a new Assistant take
 *   over the page even though the Earning is still attached to the
 *   previous assignee.
 *
 * EDITOR_APPROVED is the intermediate status: earning is recorded but not
 * yet paid out. COMPLETED is the only state that releases the assignment
 * for reassignment without ambiguity about who earned the work.
 */
export const PAGE_TASK_TERMINAL_STATUSES = ["REJECTED", "CANCELLED", "COMPLETED"];

function pageOf(chapter: any, pageId: string) {
  return (chapter?.pages ?? []).find((page: any) => String(page.id) === String(pageId));
}

export async function getPageContext(pageId: string) {
  const chapter = (await ChapterModel.findOne({ "pages.id": pageId }).lean()) as any;
  if (!chapter) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
  const page = pageOf(chapter, pageId);
  if (!page) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
  return { chapter, page };
}

export async function assertEligibleAssistant(chapter: any, assistantId: string) {
  const user = (await UserModel.findOne({ id: assistantId }).lean()) as any;
  const member = await SeriesMemberModel.findOne({
    seriesId: chapter.seriesId,
    userId: assistantId,
    role: "assistant",
    status: "active",
  }).lean();
  if (!user) throw new AppError(404, "Assignee not found.", "ASSIGNEE_NOT_FOUND");
  if (user.role !== "ASSISTANT" || !member) {
    throw new AppError(403, "Assignee must be an active assistant series member.", "ASSIGNEE_NOT_ELIGIBLE");
  }
  return user;
}

export function currentPageAssignment(page: any) {
  return page?.pageAssignment ?? null;
}

async function saveAssignment(pageId: string, assignment: any) {
  const updated = await ChapterModel.findOneAndUpdate(
    { "pages.id": pageId },
    { $set: { "pages.$.pageAssignment": assignment, updatedAt: nowIso() } },
    { returnDocument: "after" },
  ).lean();
  if (!updated) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
  return pageOf(updated, pageId)?.pageAssignment ?? assignment;
}

export async function assignPage(pageId: string, assistantId: string) {
  const { chapter, page } = await getPageContext(pageId);
  const current = currentPageAssignment(page);
  if (current && ["PENDING", "ACCEPTED"].includes(String(current.status))) {
    throw new AppError(409, "Release the current page assignment before reassigning.", "PAGE_ASSIGNMENT_ACTIVE");
  }
  const assistant = await assertEligibleAssistant(chapter, assistantId);
  return saveAssignment(pageId, {
    assistantId,
    assistantName: assistant.name,
    status: "PENDING",
    assignedAt: nowIso(),
    rejectedReason: undefined,
  });
}

export async function applyPageAssignmentAction(
  actor: RequestActor,
  pageId: string,
  action: string,
  reason?: string,
) {
  const { page } = await getPageContext(pageId);
  const current = currentPageAssignment(page);
  if (!current) throw new AppError(409, "Assign an assistant to this page first.", "PAGE_ASSIGNMENT_REQUIRED");
  const normalized = action.toUpperCase();
  if (normalized === "ACCEPT" || normalized === "REJECT") {
    if (actor.role !== "ASSISTANT" || String(current.assistantId) !== actor.id) {
      throw new AppError(403, "Only the assigned assistant can respond to this page assignment.", "PAGE_ASSIGNMENT_NOT_ASSIGNED");
    }
    if (current.status !== "PENDING") {
      throw new AppError(409, "Only pending page assignments can be accepted or rejected.", "PAGE_ASSIGNMENT_NOT_PENDING");
    }
    if (normalized === "REJECT" && !reason?.trim()) {
      throw new AppError(400, "A rejection reason is required.", "REASON_REQUIRED");
    }
    const saved = await saveAssignment(pageId, {
      ...current,
      status: normalized === "ACCEPT" ? "ACCEPTED" : "REJECTED",
      acceptedAt: normalized === "ACCEPT" ? nowIso() : undefined,
      releasedAt: normalized === "REJECT" ? nowIso() : undefined,
      rejectedReason: normalized === "REJECT" ? reason?.trim() : undefined,
    });
    await (StudioTaskModel as any).updateMany(
      { pageId, status: { $nin: PAGE_TASK_TERMINAL_STATUSES } },
      normalized === "ACCEPT"
        ? { $set: { assignmentStatus: "ACCEPTED", assignmentAcceptedAt: nowIso(), updatedAt: nowIso() } }
        : { $set: { assignmentStatus: "REJECTED", assignmentRejectedAt: nowIso(), assignmentRejectedReason: reason?.trim(), updatedAt: nowIso() } },
    );
    return saved;
  }
  if (normalized === "RELEASE") {
    if (actor.role !== "MANGAKA") throw new AppError(403, "Only the owning Mangaka can release a page assignment.", "FORBIDDEN");
    const pendingEditorReview = await (StudioTaskModel as any).findOne({
      pageId,
      status: { $in: ["MANGAKA_APPROVED", "EDITOR_APPROVED"] },
    }).lean();
    if (pendingEditorReview) {
      throw new AppError(
        409,
        "Wait for the Editor to approve (and the earning to clear) before releasing the assignment.",
        "PAGE_ASSIGNMENT_HAS_PENDING_EDITOR_REVIEW",
      );
    }
    const activeTask = await (StudioTaskModel as any).findOne({
      pageId,
      status: { $nin: PAGE_TASK_TERMINAL_STATUSES },
    }).lean();
    if (activeTask) throw new AppError(409, "Finish or cancel all page tasks before releasing the assignment.", "PAGE_ASSIGNMENT_HAS_ACTIVE_TASKS");
    return saveAssignment(pageId, {
      ...current,
      status: "RELEASED",
      releasedAt: nowIso(),
    });
  }
  throw new AppError(400, "Unknown page assignment action.", "INVALID_ACTION");
}

export async function assertCurrentPageAssignment(task: any, options: { requireAccepted?: boolean } = {}) {
  if (!task.pageId) return null;
  const { page } = await getPageContext(String(task.pageId));
  const assignment = currentPageAssignment(page);
  if (!assignment || assignment.status === "RELEASED" || assignment.status === "REJECTED") {
    throw new AppError(409, "This page has no active assistant assignment.", "PAGE_ASSIGNMENT_REQUIRED");
  }
  if (task.assigneeId && String(assignment.assistantId) !== String(task.assigneeId)) {
    throw new AppError(409, "Task ownership no longer matches the page assignment.", "PAGE_ASSIGNMENT_MISMATCH");
  }
  if (options.requireAccepted && assignment.status !== "ACCEPTED") {
    throw new AppError(409, "The assigned assistant must accept the page before starting work.", "PAGE_ASSIGNMENT_NOT_ACCEPTED");
  }
  return assignment;
}
