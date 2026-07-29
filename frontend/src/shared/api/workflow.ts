import { apiRequest } from "./client";
import type { CreateProposalRequest, UpdateProposalRequest, UpdateSeriesRequest } from "./services";

export const bootstrapApi = {
  me: () => apiRequest("/me/bootstrap"),
  dashboard: (role: string) => apiRequest(`/dashboard/${role}/summary`),
};

export const proposalsApi = {
  list: () => apiRequest("/proposals"),
  get: (id: string) => apiRequest(`/proposals/${id}`),
  versions: (id: string) => apiRequest(`/proposals/${id}/versions`),
  version: (id: string, versionId: string) => apiRequest(`/proposals/${id}/versions/${versionId}`),
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
  action: (id: string, action: "archive" | "unpublish" | "start_production") =>
    apiRequest(`/series/${id}/actions/${action}`, { method: "POST", body: {} }),
  delete: (id: string) => apiRequest(`/series/${id}`, { method: "DELETE" }),
  chapters: (id: string) => apiRequest(`/series/${id}/chapters`),
  chapterAction: (chapterId: string, action: string, body?: unknown) =>
    apiRequest(`/chapters/${chapterId}/actions/${action}`, { method: "POST", body: body ?? {} }),
  readiness: (chapterId: string) => apiRequest(`/chapters/${chapterId}/readiness`),
  chapterReviews: (chapterId: string) => apiRequest(`/chapters/${chapterId}/reviews`),
  // Tantou Editor
  getEditor: (seriesId: string) => apiRequest(`/series/${seriesId}/editor`),
  assignEditor: (seriesId: string, body: { editorId: string; editorName: string }) =>
    apiRequest(`/series/${seriesId}/editor`, { method: "POST", body }),
  removeEditor: (seriesId: string) =>
    apiRequest(`/series/${seriesId}/editor`, { method: "DELETE" }),
};
