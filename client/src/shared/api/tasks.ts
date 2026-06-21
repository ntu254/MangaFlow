import { api, unwrap } from "./_client";

export interface Task {
  id: string;
  _id?: string;
  seriesId: string;
  chapterId: string;
  pageId?: string;
  regionId?: string;
  taskTypeId:
    | string
    | { id?: string; _id?: string; name?: string; code?: string; baseRate?: number };
  title: string;
  description?: string;
  status:
    | "TODO"
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "EDITOR_APPROVED"
    | "MANGAKA_APPROVED"
    | "REVISION_REQUESTED"
    | "REJECTED"
    | "CANCELLED";
  priority: "HIGH" | "NORMAL" | "LOW" | "URGENT";
  assignedTo?: string | { id?: string; _id?: string; name?: string; displayName?: string };
  assignedBy: string | { id?: string; _id?: string };
  baseRate?: number;
  currentSubmissionId?: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  seriesId: string;
  chapterId: string;
  pageId?: string;
  regionId?: string;
  taskTypeId: string;
  assignedTo: string;
  title: string;
  description?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  dueDate: string;
  contextPageIds?: string[];
}

export interface TaskType {
  id: string;
  _id?: string;
  name: string;
  code?: string;
  description?: string;
  baseRate?: number;
  currency?: string;
  isActive?: boolean;
  allowRegionTask?: boolean;
  allowPageTask?: boolean;
  requiresFileSubmission?: boolean;
  requiresTextSubmission?: boolean;
  sortOrder?: number;
}

export const tasksApi = {
  listBySeries: (seriesId: string) => api.get(`/tasks/series/${seriesId}`).then(unwrap<Task[]>),
  listMyTasks: () => api.get(`/tasks/my`).then(unwrap<Task[]>),
  get: (taskId: string) => api.get(`/tasks/${taskId}`).then(unwrap<Task>),
  create: (payload: CreateTaskPayload) => api.post(`/tasks`, payload).then(unwrap<Task>),
  updateStatus: (taskId: string, status: Task["status"]) =>
    api.patch(`/tasks/${taskId}/status`, { status }).then(unwrap<Task>),
};

export const taskTypesApi = {
  listActive: () =>
    api.get(`/task-types/active`).then(unwrap<TaskType[]>).then((taskTypes) =>
      taskTypes.map((taskType) => ({
        ...taskType,
        id: taskType.id ?? taskType._id ?? "",
      })),
    ),
};
