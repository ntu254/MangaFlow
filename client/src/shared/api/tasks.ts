import { api, unwrap } from "./_client";

export interface Task {
  id: string;
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

export const tasksApi = {
  listBySeries: (seriesId: string) => api.get(`/tasks/series/${seriesId}`).then(unwrap<Task[]>),
  listMyTasks: () => api.get(`/tasks/my`).then(unwrap<Task[]>),
};
