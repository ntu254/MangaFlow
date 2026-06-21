import { findChapter, findStaff, isAssistantEligible, type Task } from "@/entities";

export type AccessVerdict = { allowed: boolean; reason?: string };

const ok: AccessVerdict = { allowed: true };
const no = (reason: string): AccessVerdict => ({ allowed: false, reason });

/**
 * Assistant may open a Task Studio only when:
 *  - they are the assignee
 *  - the assignee is an actual Assistant
 *  - they are an active SeriesMember of that series
 *  - the task is not cancelled
 */
export function canOpenAssistantTask(task: Task | undefined, assistantId: string): AccessVerdict {
  if (!task) return no("Task not found.");
  if (task.assigneeId !== assistantId) return no("This task is not assigned to you.");
  if (task.status === "cancelled") return no("This task has been cancelled.");
  const staff = findStaff(assistantId);
  if (!staff || staff.role !== "assistant")
    return no("Only an Assistant can open this Task Studio.");
  const ch = findChapter(task.chapterId);
  if (!ch) return no("Chapter not found.");
  if (!isAssistantEligible(assistantId, ch.seriesId))
    return no("You are not an active member of this Series.");
  return ok;
}
