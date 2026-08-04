import type { ProductionSeries } from "@/entities/series/model/series-types";
import type { StudioTask } from "@/entities/series/model/studio-types";
import type { AssistantAccessScope } from "@/entities/submission/model/assistant-types";
import { getVisualTaskStatus } from "@/entities/task";

export function getAssistantScope(
  series: ProductionSeries | undefined,
  userId: string,
): AssistantAccessScope {
  if (!series) return "TASK_ONLY_ASSISTANT";
  return series.assistantIds.includes(userId) ? "FULL_SERIES_ASSISTANT" : "TASK_ONLY_ASSISTANT";
}

export function canAssistantAccessTask(task: StudioTask | undefined, userId: string): boolean {
  if (!task) return false;
  return task.assigneeId === userId || getVisualTaskStatus(task) === "REASSIGNED";
}

export function isAssistantTaskReadOnly(task: StudioTask, userId: string): boolean {
  const visualStatus = getVisualTaskStatus(task);

  return (
    task.status === "MANGAKA_APPROVED" ||
    task.status === "REJECTED" ||
    visualStatus === "CANCELLED" ||
    (visualStatus === "REASSIGNED" && task.assigneeId !== userId)
  );
}

export function tasksForAssistant(tasks: StudioTask[], userId: string): StudioTask[] {
  return tasks.filter((t) => t.assigneeId === userId && !t.hidden);
}
