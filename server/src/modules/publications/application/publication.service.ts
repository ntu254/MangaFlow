import { applyChapterAction } from "../../../services/workflow.service.js";
import type { AuthedRequest } from "../../../types.js";

export function scheduleChapterPublication(
  req: AuthedRequest,
  chapterId: string,
  payload: { scheduledAt?: string; note?: string },
) {
  return applyChapterAction(req, chapterId, "SCHEDULE", payload);
}

export function postponeChapterPublication(req: AuthedRequest, chapterId: string, payload: { note?: string }) {
  return applyChapterAction(req, chapterId, "POSTPONE", payload);
}

export function publishChapter(req: AuthedRequest, chapterId: string, payload: { note?: string }) {
  return applyChapterAction(req, chapterId, "PUBLISH", payload);
}
