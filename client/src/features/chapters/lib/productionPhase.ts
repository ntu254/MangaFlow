import type { Chapter, Task, Submission, Page } from "@/entities";
import { isTaskActive, isTaskEditorApproved } from "./taskStatus";

export type ProductionPhase = "draft" | "in-production" | "ready" | "published";
export type ProductionSubstate =
  | "needs-tasks"
  | "tasks-in-progress"
  | "mangaka-review"
  | "editor-final-review"
  | null;

export const PHASE_LABEL: Record<ProductionPhase, string> = {
  draft: "Draft",
  "in-production": "In production",
  ready: "Ready for publication",
  published: "Published",
};

export const SUBSTATE_LABEL: Record<Exclude<ProductionSubstate, null>, string> = {
  "needs-tasks": "Needs tasks",
  "tasks-in-progress": "Tasks in progress",
  "mangaka-review": "Mangaka review",
  "editor-final-review": "Editor final review",
};

export function derivePhase(
  chapter: Chapter,
  pages: Page[],
  tasks: Task[],
  subs: Submission[],
): { phase: ProductionPhase; substate: ProductionSubstate } {
  if (chapter.publishedAt || chapter.status === "published") {
    return { phase: "published", substate: null };
  }
  if (pages.length === 0) {
    return { phase: "draft", substate: null };
  }
  if (tasks.length > 0 && tasks.every(isTaskEditorApproved)) {
    return { phase: "ready", substate: null };
  }
  if (chapter.status === "ready-for-publication") {
    return { phase: "ready", substate: null };
  }

  if (tasks.length === 0) return { phase: "in-production", substate: "needs-tasks" };
  if (subs.some((s) => s.mangakaApproved && !s.editorApproved && !s.rejected))
    return { phase: "in-production", substate: "editor-final-review" };
  if (subs.some((s) => !s.mangakaApproved && !s.rejected))
    return { phase: "in-production", substate: "mangaka-review" };
  if (tasks.some(isTaskActive)) return { phase: "in-production", substate: "tasks-in-progress" };
  return { phase: "in-production", substate: "tasks-in-progress" };
}

export function chapterHasActiveTask(tasks: Task[]) {
  return tasks.some(isTaskActive);
}
