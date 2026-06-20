import { api, unwrap } from "./_client";

export interface Task {
  id: string;
  seriesId: string;
  chapterId: string;
  pageId?: string;
  regionId?: string;
  taskTypeId: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "submitted" | "editor-approved" | "mangaka-approved" | "rejected";
  priority: "high" | "medium" | "low";
  assignedTo?: { id: string; name: string; displayName?: string };
  assignedBy: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export const tasksApi = {
  listBySeries: (seriesId: string) => api.get(`/tasks/series/${seriesId}`).then(unwrap<Task[]>),
};
