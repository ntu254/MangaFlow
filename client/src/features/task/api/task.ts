const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export const taskTypes = ["BACKGROUND", "INKING", "SCREENTONE", "CLEANUP", "EFFECT", "OTHER"] as const;
export const taskPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type TaskType = (typeof taskTypes)[number];
export type TaskPriority = (typeof taskPriorities)[number];
export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "MANGAKA_APPROVED"
  | "EDITOR_APPROVED"
  | "REJECTED";

export type Task = {
  id: string;
  seriesId: string;
  chapterId: string;
  pageId: string;
  regionId?: string;
  assignedBy: string;
  assignedTo: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  revisionRound: number;
  baseRate: number;
  bonusAmount: number;
  dueDate?: string;
  submittedAt?: string;
  mangakaApprovedAt?: string;
  editorApprovedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskFromRegionPayload = {
  assignedTo: string;
  title: string;
  description: string;
  type?: TaskType;
  priority: TaskPriority;
  dueDate?: string;
  baseRate?: number;
  bonusAmount?: number;
};

async function parseApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || fallbackMessage);
  }
  return json.data;
}

export async function listTasks(token: string): Promise<Task[]> {
  const response = await fetch(`${apiBaseUrl}/tasks`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Task[]>(response, "Failed to list tasks");
}

export async function getTask(token: string, taskId: string): Promise<Task> {
  const response = await fetch(`${apiBaseUrl}/tasks/${taskId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Task>(response, "Failed to fetch task");
}

export async function createTaskFromRegion(
  token: string,
  regionId: string,
  payload: CreateTaskFromRegionPayload
): Promise<Task> {
  const response = await fetch(`${apiBaseUrl}/regions/${regionId}/create-task`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return parseApiResponse<Task>(response, "Failed to create task");
}

export async function startTask(token: string, taskId: string): Promise<Task> {
  const response = await fetch(`${apiBaseUrl}/tasks/${taskId}/start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Task>(response, "Failed to start task");
}

export async function deleteTask(token: string, taskId: string): Promise<boolean> {
  const response = await fetch(`${apiBaseUrl}/tasks/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await parseApiResponse<{ deleted: boolean }>(response, "Failed to delete task");
  return data.deleted;
}
