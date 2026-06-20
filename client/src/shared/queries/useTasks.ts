import { useQuery } from "@tanstack/react-query";
import { tasksApi, type Task as APITask } from "@/shared/api/tasks";
import type { Task, TaskStatus } from "@/entities/task/model";
import { qk } from "./keys";

const STATUS_MAP: Record<APITask["status"], TaskStatus> = {
  TODO: "todo",
  IN_PROGRESS: "in-progress",
  SUBMITTED: "submitted",
  MANGAKA_APPROVED: "mangaka-approved",
  EDITOR_APPROVED: "editor-approved",
  REVISION_REQUESTED: "revision-requested",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

export function mapApiTask(apiTask: APITask): Task {
  const status = STATUS_MAP[apiTask.status];

  let type: Task["type"] = "Linework";
  const taskType = typeof apiTask.taskTypeId === "string" ? undefined : apiTask.taskTypeId;
  const typeSource =
    `${taskType?.name ?? ""} ${taskType?.code ?? ""} ${apiTask.title}`.toLowerCase();
  if (typeSource.includes("tone")) type = "Tone";
  if (typeSource.includes("background")) type = "Background";
  if (typeSource.includes("letter")) type = "Lettering";
  if (typeSource.includes("fx")) type = "FX";

  const assignedTo = apiTask.assignedTo;
  const assignedBy = apiTask.assignedBy;
  const priority: Task["priority"] =
    apiTask.priority === "LOW"
      ? "low"
      : apiTask.priority === "HIGH" || apiTask.priority === "URGENT"
        ? "high"
        : "medium";

  return {
    id: apiTask.id,
    chapterId: apiTask.chapterId,
    type,
    assigneeId:
      typeof assignedTo === "string" ? assignedTo : (assignedTo?.id ?? assignedTo?._id ?? ""),
    assigneeName:
      typeof assignedTo === "string"
        ? "Assigned assistant"
        : (assignedTo?.displayName ?? assignedTo?.name ?? "Assigned assistant"),
    pageRange: apiTask.pageId ? `Page ${apiTask.pageId}` : "Full Chapter",
    deadline: new Date(apiTask.dueDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    payout: apiTask.baseRate ?? taskType?.baseRate ?? 0,
    status,
    title: apiTask.title,
    priority,
    assignedById: typeof assignedBy === "string" ? assignedBy : (assignedBy.id ?? assignedBy._id),
    instruction: apiTask.description,
  };
}

export function useTasksBySeries(seriesId: string) {
  return useQuery({
    queryKey: ["tasks", "series", seriesId],
    queryFn: async () => {
      const data = await tasksApi.listBySeries(seriesId);
      return data.map(mapApiTask);
    },
    enabled: !!seriesId,
  });
}

export function useMyTasks() {
  return useQuery({
    queryKey: qk.tasks.mine(),
    queryFn: async () => {
      const data = await tasksApi.listMyTasks();
      return data.map(mapApiTask);
    },
  });
}
