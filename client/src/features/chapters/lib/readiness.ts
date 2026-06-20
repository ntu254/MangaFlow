import type { Task, Submission } from "@/entities";
import { isTaskActive, isTaskEditorApproved } from "./taskStatus";

export type Blocker = { id: string; label: string };

export function readinessChecklist(tasks: Task[]) {
  return tasks.map((t) => ({
    id: t.id,
    label: `${t.type} · ${t.pageRange}`,
    state: isTaskEditorApproved(t)
      ? ("done" as const)
      : t.status === "rejected"
        ? ("failed" as const)
        : ("pending" as const),
  }));
}

export function computeBlockers(tasks: Task[], subs: Submission[]): Blocker[] {
  const blockers: Blocker[] = [];
  if (tasks.length === 0)
    blockers.push({ id: "no-tasks", label: "No tasks created for this chapter yet." });
  const activeCount = tasks.filter(isTaskActive).length;
  if (activeCount > 0)
    blockers.push({ id: "active-tasks", label: `${activeCount} task(s) still in progress.` });
  const pendingMangaka = subs.filter((s) => !s.mangakaApproved && !s.rejected).length;
  if (pendingMangaka > 0)
    blockers.push({
      id: "pending-mangaka",
      label: `${pendingMangaka} submission(s) awaiting Mangaka review.`,
    });
  const pendingEditor = subs.filter(
    (s) => s.mangakaApproved && !s.editorApproved && !s.rejected,
  ).length;
  if (pendingEditor > 0)
    blockers.push({
      id: "pending-editor",
      label: `${pendingEditor} submission(s) awaiting Editor final review.`,
    });
  return blockers;
}

export function isReadyForPublication(tasks: Task[]) {
  return tasks.length > 0 && tasks.every(isTaskEditorApproved);
}
