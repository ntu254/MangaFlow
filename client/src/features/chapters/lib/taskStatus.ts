import type { Task } from "@/entities";

// Map current entity statuses to canonical buckets.
// Active: TODO, IN_PROGRESS, SUBMITTED, REVISION_REQUESTED, MANGAKA_APPROVED
// Finished: EDITOR_APPROVED, REJECTED, CANCELLED
export const ACTIVE_TASK_STATUSES: Task["status"][] = [
  "assigned",
  "in-progress",
  "submitted",
];
export const FINISHED_TASK_STATUSES: Task["status"][] = ["approved", "rejected"];

export const isTaskActive = (t: Task) => ACTIVE_TASK_STATUSES.includes(t.status);
export const isTaskFinished = (t: Task) => FINISHED_TASK_STATUSES.includes(t.status);
export const isTaskEditorApproved = (t: Task) => t.status === "approved";

// Parse "p. 1–8" / "p. 9-16" into a numeric range.
export function parsePageRange(range: string): [number, number] {
  const m = range.match(/(\d+)\s*[–-]\s*(\d+)/);
  if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)];
  const single = range.match(/(\d+)/);
  if (single) return [parseInt(single[1], 10), parseInt(single[1], 10)];
  return [0, 0];
}

export function taskCoversPage(t: Task, pageOrder: number) {
  const [a, b] = parsePageRange(t.pageRange);
  return pageOrder >= a && pageOrder <= b;
}
