import { apiRequest } from "./client";
import type {
  CreateRegionRequest,
  UpdateRegionRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateCommentRequest,
  CreateSubmissionRequest,
  CreateMaterialRequest,
  UpdateMaterialRequest,
  CreateMaterialVersionRequest,
} from "./services";

export const studioApi = {
  regions: (query = "") => apiRequest(`/studio/regions${query}`),
  createRegion: (body: CreateRegionRequest) =>
    apiRequest("/studio/regions", { method: "POST", body }),
  patchRegion: (id: string, body: UpdateRegionRequest) =>
    apiRequest(`/studio/regions/${id}`, { method: "PATCH", body }),
  tasks: (query = "") => apiRequest(`/studio/tasks${query}`),
  createTask: (body: CreateTaskRequest) => apiRequest("/studio/tasks", { method: "POST", body }),
  patchTask: (id: string, body: UpdateTaskRequest) =>
    apiRequest(`/studio/tasks/${id}`, { method: "PATCH", body }),
  comments: (query = "") => apiRequest(`/comments${query}`),
  createComment: (body: CreateCommentRequest) => apiRequest("/comments", { method: "POST", body }),
  resolveComment: (id: string) =>
    apiRequest(`/comments/${id}/resolve`, { method: "POST", body: {} }),
  reopenComment: (id: string) => apiRequest(`/comments/${id}/reopen`, { method: "POST", body: {} }),
};

export const assistantApi = {
  submissions: () => apiRequest("/submissions"),
  createSubmission: (body: CreateSubmissionRequest) => {
    const { taskId, idempotencyKey, ...payload } = body;
    const key =
      idempotencyKey ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${taskId}-${Date.now()}`);
    return apiRequest(`/tasks/${taskId}/submit`, {
      method: "POST",
      body: payload,
      headers: { "Idempotency-Key": key },
    });
  },
  requestRevision: (id: string, reviewerNote: string) =>
    apiRequest(`/submissions/${id}/request-revision`, { method: "POST", body: { reviewerNote } }),
  reopenTask: (taskId: string) =>
    apiRequest(`/tasks/${taskId}/reopen`, { method: "POST", body: {} }),
  editorApprove: (_id: string, _reviewerNote: string) =>
    Promise.reject(
      new Error(
        "Tantou no longer approves Assistant submissions. Review the consolidated Chapter instead.",
      ),
    ),
};

export const materialsApi = {
  list: () => apiRequest("/materials"),
  create: (body: CreateMaterialRequest) => apiRequest("/materials", { method: "POST", body }),
  patch: (id: string, body: UpdateMaterialRequest) =>
    apiRequest(`/materials/${id}`, { method: "PATCH", body }),
  addVersion: (id: string, body: CreateMaterialVersionRequest) =>
    apiRequest(`/materials/${id}/versions`, { method: "POST", body }),
};
