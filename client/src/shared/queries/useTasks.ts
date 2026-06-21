import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  tasksApi,
  taskTypesApi,
  type CreateTaskPayload,
  type Task as APITask,
} from "@/shared/api/tasks";
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
  const id = apiTask.id ?? apiTask._id ?? "";
  const seriesId = normalizeId(apiTask.seriesId);
  const pageId = normalizeId(apiTask.pageId);
  const chapterId = normalizeId(apiTask.chapterId);

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
    id,
    seriesId,
    chapterId,
    type,
    assigneeId:
      typeof assignedTo === "string" ? assignedTo : (assignedTo?.id ?? assignedTo?._id ?? ""),
    assigneeName:
      typeof assignedTo === "string"
        ? "Assigned assistant"
        : (assignedTo?.displayName ?? assignedTo?.name ?? "Assigned assistant"),
    pageRange: pageId ? `Page ${pageId}` : "Full Chapter",
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
    description: apiTask.description,
    pageId,
    regionId: normalizeId(apiTask.regionId),
    createdAt: apiTask.createdAt,
    updatedAt: apiTask.updatedAt,
  };
}

function normalizeId(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as { id?: string; _id?: string };
    return record.id ?? record._id;
  }
  return String(value);
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

export function useTaskDetail(taskId: string) {
  return useQuery({
    queryKey: ["tasks", "detail", taskId],
    queryFn: async () => {
      const data = await tasksApi.get(taskId);
      return mapApiTask(data);
    },
    enabled: !!taskId,
  });
}

export function useActiveTaskTypes() {
  return useQuery({
    queryKey: ["task-types", "active"],
    queryFn: taskTypesApi.listActive,
  });
}

export function useCreateTask(options?: { seriesId?: string; pageId?: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.tasks.root });
      queryClient.invalidateQueries({ queryKey: qk.tasks.mine() });
      if (options?.seriesId) {
        queryClient.invalidateQueries({ queryKey: ["tasks", "series", options.seriesId] });
      }
      if (options?.pageId) {
        queryClient.invalidateQueries({ queryKey: qk.pages.studio(options.pageId) });
      }
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: APITask["status"] }) =>
      tasksApi.updateStatus(taskId, status),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: qk.tasks.root });
      queryClient.invalidateQueries({ queryKey: qk.tasks.mine() });
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", task.id ?? task._id] });
      if (task.seriesId) {
        queryClient.invalidateQueries({ queryKey: ["tasks", "series", task.seriesId] });
      }
    },
  });
}
