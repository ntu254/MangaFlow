import { apiRequest } from "./client";

export interface CreateProposalRequest {
  title: string;
  description: string;
  seriesId?: string;
  [key: string]: unknown;
}

export interface UpdateProposalRequest {
  title?: string;
  description?: string;
  [key: string]: unknown;
}

export interface UpdateSeriesRequest {
  title?: string;
  description?: string;
  [key: string]: unknown;
}

export interface CreateRegionRequest {
  chapterId: string;
  pageId: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  [key: string]: unknown;
}

export interface UpdateRegionRequest {
  type?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  label?: string;
  status?: string;
  [key: string]: unknown;
}

export interface CreateTaskRequest {
  chapterId: string;
  pageId: string;
  regionId?: string;
  title: string;
  type: string;
  assigneeId: string;
  dueAt: string;
  priority: "low" | "normal" | "high";
  instructions: string;
  [key: string]: unknown;
}

export interface UpdateTaskRequest {
  title?: string;
  type?: string;
  assigneeId?: string;
  dueAt?: string;
  priority?: "low" | "normal" | "high";
  instructions?: string;
  status?: string;
  [key: string]: unknown;
}

export interface CreateCommentRequest {
  chapterId: string;
  pageId: string;
  regionId?: string;
  taskId?: string;
  text: string;
  x?: number;
  y?: number;
  blocking?: boolean;
  [key: string]: unknown;
}

export interface CreateSubmissionRequest {
  taskId: string;
  fileKey?: string;
  fileName?: string;
  fileUrl?: string;
  note?: string;
  [key: string]: unknown;
}

export interface CreateMaterialRequest {
  name: string;
  type?: string;
  [key: string]: unknown;
}

export interface UpdateMaterialRequest {
  name?: string;
  type?: string;
  [key: string]: unknown;
}

export interface CreateMaterialVersionRequest {
  fileKey: string;
  fileName?: string;
  [key: string]: unknown;
}

export interface CreateVotingSessionRequest {
  title: string;
  mode: "AD_HOC" | "SCHEDULED";
  scheduledFor?: string;
  proposalIds: string[];
  [key: string]: unknown;
}

export interface UpdateVotingSessionRequest {
  title?: string;
  mode?: "AD_HOC" | "SCHEDULED";
  scheduledFor?: string;
  proposalIds?: string[];
  [key: string]: unknown;
}

export interface CastVoteRequest {
  decision: "APPROVE" | "REJECT" | "ABSTAIN";
  reason?: string;
  [key: string]: unknown;
}

export interface FinalizeDecisionRequest {
  decision: string;
  reason?: string;
  [key: string]: unknown;
}

export interface TieBreakRequest {
  decision: string;
  reason?: string;
  [key: string]: unknown;
}

export interface AtRiskDecisionRequest {
  decision: string;
  reason?: string;
  [key: string]: unknown;
}

export interface AtRiskReportRequest {
  rankingSummary: string;
  recommendation: string;
  notes?: string;
  [key: string]: unknown;
}

export interface ImportRankingsRequest {
  csvData?: string;
  rankings?: Array<{ seriesId: string; rank: number; [key: string]: unknown }>;
  source?: string;
  period?: string;
  fileName?: string;
  [key: string]: unknown;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role: string;
  password?: string;
  [key: string]: unknown;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  audienceType?: string;
  audienceRole?: string;
  userId?: string;
  priority?: string;
  kind?: string;
  targetRole?: string;
  type?: string;
  [key: string]: unknown;
}

export interface UpdateNotificationRequest {
  targetRole?: string;
  type?: string;
  title?: string;
  message?: string;
  status?: string;
  [key: string]: unknown;
}

export interface OverrideRequest {
  action: string;
  targetId?: string;
  reason: string;
}

export const bootstrapApi = {
  me: () => apiRequest("/me/bootstrap"),
  dashboard: (role: string) => apiRequest(`/dashboard/${role}/summary`),
};

export const proposalsApi = {
  list: () => apiRequest("/proposals"),
  get: (id: string) => apiRequest(`/proposals/${id}`),
  create: (body: CreateProposalRequest) => apiRequest("/proposals", { method: "POST", body }),
  patch: (id: string, body: UpdateProposalRequest) =>
    apiRequest(`/proposals/${id}`, { method: "PATCH", body }),
  action: (id: string, action: string, body?: unknown) =>
    apiRequest(`/proposals/${id}/actions/${action}`, { method: "POST", body: body ?? {} }),
};

export const seriesApi = {
  list: () => apiRequest("/series"),
  get: (id: string) => apiRequest(`/series/${id}`),
  patch: (id: string, body: UpdateSeriesRequest) =>
    apiRequest(`/series/${id}`, { method: "PATCH", body }),
  chapters: (id: string) => apiRequest(`/series/${id}/chapters`),
  chapterAction: (chapterId: string, action: string, body?: unknown) =>
    apiRequest(`/chapters/${chapterId}/actions/${action}`, { method: "POST", body: body ?? {} }),
  readiness: (chapterId: string) => apiRequest(`/chapters/${chapterId}/readiness`),
  // Tantou Editor
  getEditor: (seriesId: string) => apiRequest(`/series/${seriesId}/editor`),
};

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
  createSubmission: (body: CreateSubmissionRequest) =>
    apiRequest("/submissions", { method: "POST", body }),
  requestRevision: (id: string, reviewerNote: string) =>
    apiRequest(`/submissions/${id}/request-revision`, { method: "POST", body: { reviewerNote } }),
  editorApprove: (id: string, reviewerNote: string) =>
    apiRequest(`/submissions/${id}/editor-approve`, { method: "POST", body: { reviewerNote } }),
};

export const materialsApi = {
  list: () => apiRequest("/materials"),
  create: (body: CreateMaterialRequest) => apiRequest("/materials", { method: "POST", body }),
  patch: (id: string, body: UpdateMaterialRequest) =>
    apiRequest(`/materials/${id}`, { method: "PATCH", body }),
  addVersion: (id: string, body: CreateMaterialVersionRequest) =>
    apiRequest(`/materials/${id}/versions`, { method: "POST", body }),
};

export type PresignedUpload = {
  key: string;
  uploadUrl: string;
  downloadUrl: string;
  publicUrl?: string;
  method: "PUT";
  headers?: Record<string, string>;
  persistent: boolean;
  storage: "r2" | "metadata-only" | "local";
};

export type FileDisplayUrl = {
  key: string;
  url: string;
  expiresAt: string;
};

export const filesApi = {
  presignUpload: (body: { fileName: string; contentType?: string; folder?: string }) =>
    apiRequest<PresignedUpload>("/files/presign-upload", { method: "POST", body }),
  presignDownload: (key: string) =>
    apiRequest<{ key: string; downloadUrl: string; publicUrl?: string; persistent: boolean }>(
      "/files/presign-download",
      { method: "POST", body: { key } },
    ),
  displayUrl: (body: { key: string; fileName?: string }) =>
    apiRequest<FileDisplayUrl>("/files/display-url", { method: "POST", body }),
};

export const boardApi = {
  sessions: () => apiRequest("/voting-sessions"),
  session: (id: string) => apiRequest(`/voting-sessions/${id}`),
  createSession: (body: CreateVotingSessionRequest) =>
    apiRequest("/voting-sessions", { method: "POST", body }),
  updateSession: (id: string, body: UpdateVotingSessionRequest) =>
    apiRequest(`/voting-sessions/${id}`, { method: "PATCH", body }),
  closeSession: (id: string) =>
    apiRequest(`/voting-sessions/${id}/close`, { method: "POST", body: {} }),
  cancelSession: (id: string) =>
    apiRequest(`/voting-sessions/${id}/cancel`, { method: "POST", body: {} }),
  addSessionNote: (id: string, body: { text: string }) =>
    apiRequest(`/voting-sessions/${id}/notes`, { method: "POST", body }),
  updateSessionNote: (id: string, noteId: string, body: { text: string }) =>
    apiRequest(`/voting-sessions/${id}/notes/${noteId}`, { method: "PATCH", body }),
  deleteSessionNote: (id: string, noteId: string) =>
    apiRequest(`/voting-sessions/${id}/notes/${noteId}`, { method: "DELETE" }),
  queue: () => apiRequest("/board/queue"),
  getVotes: (seriesId: string) => apiRequest(`/board/series/${seriesId}/votes`),
  castVote: (seriesId: string, body: CastVoteRequest) =>
    apiRequest(`/board/series/${seriesId}/votes`, { method: "POST", body }),
  finalizeDecision: (seriesId: string, body: FinalizeDecisionRequest) =>
    apiRequest(`/board/series/${seriesId}/decisions/finalize`, { method: "POST", body }),
  tieBreak: (seriesId: string, body: TieBreakRequest) =>
    apiRequest(`/board/series/${seriesId}/decisions/tie-break`, { method: "POST", body }),
  atRiskDecision: (seriesId: string, body: AtRiskDecisionRequest) =>
    apiRequest(`/board/series/${seriesId}/at-risk-decisions`, { method: "POST", body }),
  createAtRiskReport: (seriesId: string, body: AtRiskReportRequest) =>
    apiRequest(`/series/${seriesId}/at-risk-reports`, { method: "POST", body }),
  latestAtRiskReport: (seriesId: string) =>
    apiRequest(`/series/${seriesId}/at-risk-reports/latest`),
  rankings: () => apiRequest("/rankings"),
  importRankings: (body: unknown) => apiRequest("/rankings/import", { method: "POST", body }),
  decisionHistory: () => apiRequest("/board/decisions/history"),
};

export const adminApi = {
  users: () => apiRequest("/admin/users"),
  createUser: (body: CreateUserRequest) => apiRequest("/admin/users", { method: "POST", body }),
  getUser: (userId: string) => apiRequest(`/admin/users/${userId}`),
  updateUser: (userId: string, body: UpdateUserRequest) =>
    apiRequest(`/admin/users/${userId}`, { method: "PATCH", body }),
  deactivateUser: (userId: string) =>
    apiRequest(`/admin/users/${userId}/deactivate`, { method: "POST", body: {} }),
  deleteUser: (userId: string, reason?: string) =>
    apiRequest(`/admin/users/${userId}`, { method: "DELETE", body: reason ? { reason } : {} }),
  audit: (filters?: { action?: string; actorId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.action) params.set("action", filters.action);
    if (filters?.actorId) params.set("actorId", filters.actorId);
    const qs = params.toString();
    return apiRequest(`/admin/audit${qs ? `?${qs}` : ""}`);
  },
  notifications: (filters?: { targetRole?: string; status?: string; type?: string }) => {
    const params = new URLSearchParams();
    if (filters?.targetRole) params.set("targetRole", filters.targetRole);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.type) params.set("type", filters.type);
    const qs = params.toString();
    return apiRequest(`/admin/notifications${qs ? `?${qs}` : ""}`);
  },
  createNotification: (body: CreateNotificationRequest) =>
    apiRequest("/admin/notifications", { method: "POST", body }),
  updateNotification: (notificationId: string, body: UpdateNotificationRequest) =>
    apiRequest(`/admin/notifications/${notificationId}`, { method: "PATCH", body }),
  deleteNotification: (notificationId: string) =>
    apiRequest(`/admin/notifications/${notificationId}`, { method: "DELETE" }),
  payroll: () => apiRequest("/admin/payroll"),
  workflowSummary: () => apiRequest("/admin/workflow-summary"),
  storageSummary: () => apiRequest("/admin/storage-summary"),
  materials: () => apiRequest("/admin/materials"),
  uploadMaterial: (body: FormData) => apiRequest("/admin/materials", { method: "POST", body }),
  replaceMaterial: (id: string, body: FormData) =>
    apiRequest(`/admin/materials/${id}/replace`, { method: "POST", body }),
  archiveMaterial: (id: string, reason?: string) =>
    apiRequest(`/admin/materials/${id}/archive`, { method: "POST", body: { reason } }),
  restoreMaterial: (id: string, reason?: string) =>
    apiRequest(`/admin/materials/${id}/restore`, { method: "POST", body: { reason } }),
  resetDemo: () => apiRequest("/admin/demo/reset", { method: "POST", body: {} }),
  clearDemo: () => apiRequest("/admin/demo/clear", { method: "POST", body: {} }),
};

export const assistantEarningsApi = {
  list: () => apiRequest("/assistant/earnings"),
};

export const notificationsApi = {
  list: () => apiRequest("/notifications"),
  read: (id: string) => apiRequest(`/notifications/${id}/read`, { method: "POST", body: {} }),
  archive: (id: string) => apiRequest(`/notifications/${id}/archive`, { method: "POST", body: {} }),
};

export const assistantAiApi = {
  health: () => apiRequest("/ai/health"),
  detectBubbles: (formData: FormData) =>
    apiRequest("/ai/bubbles/detect", { method: "POST", body: formData }),
  processBubbles: (formData: FormData) =>
    apiRequest("/ai/bubbles/process", { method: "POST", body: formData }),
  detectPageBubbles: (pageId: string) =>
    apiRequest<{ pageId: string; processingId: string; regions: unknown[] }>(
      `/studio/pages/${pageId}/ai/detect-bubbles`,
      { method: "POST", body: {} },
    ),
  whitenPageBubbles: (pageId: string) =>
    apiRequest<{
      pageId: string;
      processingId: string;
      fileKey: string;
      fileUrl: string;
      metadata: Record<string, unknown>;
    }>(`/studio/pages/${pageId}/ai/whiten-bubbles`, { method: "POST", body: {} }),
};
