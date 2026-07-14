import { apiListRequest, apiRequest, type ApiListEnvelope } from "./client";
import type { TableState } from "@/shared/table";

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

export type AdminUsersListMeta = {
  q?: string;
  sort?: { field: string; dir: "asc" | "desc" };
  filters: Record<string, unknown>;
  summary: {
    total: number;
    active: number;
    locked: number;
    adminCount: number;
  };
};

export type BoardQueueListMeta = {
  q?: string;
  sort?: { field: string; dir: "asc" | "desc" };
  filters: Record<string, unknown>;
  summary: {
    total: number;
    pending: number;
    needsFinalize: number;
    tieBreak: number;
  };
};

export type ProposalsListMeta = {
  q?: string;
  sort?: { field: string; dir: "asc" | "desc" };
  filters: Record<string, unknown>;
  summary: {
    total: number;
    byStatus: Record<string, number>;
  };
};

export type SeriesListMeta = {
  q?: string;
  sort?: { field: string; dir: "asc" | "desc" };
  filters: Record<string, unknown>;
  summary: {
    total: number;
    byStatus: Record<string, number>;
  };
};

export type ChaptersListMeta = {
  q?: string;
  sort?: { field: string; dir: "asc" | "desc" };
  filters: Record<string, unknown>;
  summary: {
    total: number;
    byStatus: Record<string, number>;
  };
};

export type StudioTasksListMeta = {
  q?: string;
  sort?: { field: string; dir: "asc" | "desc" };
  filters: Record<string, unknown>;
  summary: {
    total: number;
    byStatus: Record<string, number>;
  };
};

export type StudioRegionsListMeta = {
  q?: string;
  sort?: { field: string; dir: "asc" | "desc" };
  filters: Record<string, unknown>;
  summary: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  };
};

export type StudioCommentsListMeta = {
  q?: string;
  sort?: { field: string; dir: "asc" | "desc" };
  filters: Record<string, unknown>;
  summary: {
    total: number;
    byStatus: Record<string, number>;
    blocking: number;
  };
};

export type SubmissionsListMeta = {
  q?: string;
  sort?: { field: string; dir: "asc" | "desc" };
  filters: Record<string, unknown>;
  summary: {
    total: number;
    byStatus: Record<string, number>;
  };
};

export type RankingsListMeta = {
  q?: string;
  sort?: { field: string; dir: "asc" | "desc" };
  filters: Record<string, unknown>;
  summary: {
    total: number;
    atRisk: number;
    byStatus: Record<string, number>;
  };
};

function tableStateQuery(state?: TableState) {
  if (!state) return "";
  const params = new URLSearchParams();
  params.set("page", String(state.page));
  params.set("pageSize", String(state.pageSize));
  if (state.q.trim()) params.set("q", state.q.trim());
  if (state.sortBy) {
    params.set("sortBy", state.sortBy);
    params.set("sortDir", state.sortDir);
  }
  if (Object.keys(state.filters).length > 0) {
    params.set("filters", JSON.stringify(state.filters));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function withPageSize(query: string, pageSize: number) {
  const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
  if (!params.has("pageSize") && !params.has("limit")) {
    params.set("pageSize", String(pageSize));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const bootstrapApi = {
  me: () => apiRequest("/me/bootstrap"),
  dashboard: (role: string) => apiRequest(`/dashboard/${role}/summary`),
};

export const proposalsApi = {
  list: () => apiRequest("/proposals"),
  listContract: (state?: TableState) =>
    apiListRequest<unknown, ProposalsListMeta>(`/proposals${tableStateQuery(state)}`),
  get: (id: string) => apiRequest(`/proposals/${id}`),
  create: (body: CreateProposalRequest) => apiRequest("/proposals", { method: "POST", body }),
  patch: (id: string, body: UpdateProposalRequest) =>
    apiRequest(`/proposals/${id}`, { method: "PATCH", body }),
  action: (id: string, action: string, body?: unknown) =>
    apiRequest(`/proposals/${id}/actions/${action}`, { method: "POST", body: body ?? {} }),
};

export const seriesApi = {
  list: () => apiRequest("/series"),
  listContract: (state?: TableState, options?: { mine?: boolean }) => {
    const query = tableStateQuery(state);
    const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
    if (options?.mine) params.set("mine", "true");
    const qs = params.toString();
    return apiListRequest<unknown, SeriesListMeta>(`/series${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => apiRequest(`/series/${id}`),
  patch: (id: string, body: UpdateSeriesRequest) =>
    apiRequest(`/series/${id}`, { method: "PATCH", body }),
  chapters: (id: string) => apiRequest(`/series/${id}/chapters?pageSize=100`),
  chaptersList: (id: string, state?: TableState) =>
    apiListRequest<unknown, ChaptersListMeta>(`/series/${id}/chapters${tableStateQuery(state)}`),
  myChaptersList: (state?: TableState) => {
    const query = tableStateQuery(state);
    const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
    params.set("mine", "true");
    const qs = params.toString();
    return apiListRequest<unknown, ChaptersListMeta>(`/chapters?${qs}`);
  },
  chapterAction: (chapterId: string, action: string, body?: unknown) =>
    apiRequest(`/chapters/${chapterId}/actions/${action}`, { method: "POST", body: body ?? {} }),
  readiness: (chapterId: string) => apiRequest(`/chapters/${chapterId}/readiness`),
};

export const studioApi = {
  regions: (query = "") => apiRequest(`/studio/regions${withPageSize(query, 100)}`),
  regionsList: (state?: TableState) =>
    apiListRequest<unknown, StudioRegionsListMeta>(`/studio/regions${tableStateQuery(state)}`),
  createRegion: (body: CreateRegionRequest) =>
    apiRequest("/studio/regions", { method: "POST", body }),
  patchRegion: (id: string, body: UpdateRegionRequest) =>
    apiRequest(`/studio/regions/${id}`, { method: "PATCH", body }),
  tasks: (query = "") => apiRequest(`/studio/tasks${withPageSize(query, 100)}`),
  tasksList: (state?: TableState) =>
    apiListRequest<unknown, StudioTasksListMeta>(`/studio/tasks${tableStateQuery(state)}`),
  createTask: (body: CreateTaskRequest) => apiRequest("/studio/tasks", { method: "POST", body }),
  patchTask: (id: string, body: UpdateTaskRequest) =>
    apiRequest(`/studio/tasks/${id}`, { method: "PATCH", body }),
  comments: (query = "") => apiRequest(`/comments${withPageSize(query, 100)}`),
  commentsList: (state?: TableState) =>
    apiListRequest<unknown, StudioCommentsListMeta>(`/comments${tableStateQuery(state)}`),
  createComment: (body: CreateCommentRequest) => apiRequest("/comments", { method: "POST", body }),
  resolveComment: (id: string) =>
    apiRequest(`/comments/${id}/resolve`, { method: "POST", body: {} }),
  reopenComment: (id: string) => apiRequest(`/comments/${id}/reopen`, { method: "POST", body: {} }),
};

export const assistantApi = {
  submissions: () => apiRequest("/submissions?pageSize=100"),
  submissionsList: (state?: TableState) =>
    apiListRequest<unknown, SubmissionsListMeta>(`/submissions${tableStateQuery(state)}`),
  createSubmission: (body: CreateSubmissionRequest) =>
    apiRequest("/submissions", { method: "POST", body }),
  requestRevision: (id: string, reviewerNote: string) =>
    apiRequest(`/submissions/${id}/request-revision`, { method: "POST", body: { reviewerNote } }),
  editorApprove: (id: string, reviewerNote: string) =>
    apiRequest(`/submissions/${id}/editor-approve`, { method: "POST", body: { reviewerNote } }),
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
  queue: () => apiRequest("/board/queue"),
  queueList: (state?: TableState) =>
    apiListRequest<unknown, BoardQueueListMeta>(`/board/queue${tableStateQuery(state)}`),
  getVotes: (seriesId: string) => apiRequest(`/board/proposals/${seriesId}/votes`),
  castVote: (seriesId: string, body: CastVoteRequest) =>
    apiRequest(`/board/proposals/${seriesId}/votes`, { method: "POST", body }),
  finalizeDecision: (seriesId: string, body: FinalizeDecisionRequest) =>
    apiRequest(`/board/proposals/${seriesId}/finalization`, { method: "POST", body }),
  tieBreak: (seriesId: string, body: TieBreakRequest) =>
    apiRequest(`/board/proposals/${seriesId}/tie-break`, { method: "POST", body }),
  atRiskDecision: (seriesId: string, body: AtRiskDecisionRequest) =>
    apiRequest(`/board/series/${seriesId}/at-risk-decisions`, { method: "POST", body }),
  createAtRiskReport: (seriesId: string, body: AtRiskReportRequest) =>
    apiRequest(`/series/${seriesId}/at-risk-reports`, { method: "POST", body }),
  latestAtRiskReport: (seriesId: string) =>
    apiRequest(`/series/${seriesId}/at-risk-reports/latest`),
  rankings: () => apiRequest("/rankings?pageSize=100"),
  rankingsList: (state?: TableState) =>
    apiListRequest<unknown, RankingsListMeta>(`/rankings${tableStateQuery(state)}`),
  importRankings: (body: unknown) => apiRequest("/rankings/import", { method: "POST", body }),
};

export const adminApi = {
  usersList: (state?: TableState) =>
    apiListRequest<unknown, AdminUsersListMeta>(`/admin/users${tableStateQuery(state)}`),
  users: async () => {
    const list = await adminApi.usersList();
    return list.data;
  },
  createUser: (body: CreateUserRequest) => apiRequest("/admin/users", { method: "POST", body }),
  getUser: (userId: string) => apiRequest(`/admin/users/${userId}`),
  updateUser: (userId: string, body: UpdateUserRequest) =>
    apiRequest(`/admin/users/${userId}`, { method: "PATCH", body }),
  deactivateUser: (userId: string) =>
    apiRequest(`/admin/users/${userId}/deactivate`, { method: "POST", body: {} }),
  deleteUser: (userId: string, reason?: string) =>
    apiRequest(`/admin/users/${userId}`, { method: "DELETE", body: reason ? { reason } : {} }),
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
