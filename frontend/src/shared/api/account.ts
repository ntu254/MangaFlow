import { apiRequest } from "./client";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  CreateNotificationRequest,
  UpdateNotificationRequest,
} from "./services";

export const adminApi = {
  users: () => apiRequest("/admin/users"),
  createUser: (body: CreateUserRequest) => apiRequest("/admin/users", { method: "POST", body }),
  getUser: (userId: string) => apiRequest(`/admin/users/${userId}`),
  updateUser: (userId: string, body: UpdateUserRequest) =>
    apiRequest(`/admin/users/${userId}`, { method: "PATCH", body }),
  resetPassword: (userId: string, password: string) =>
    apiRequest(`/admin/users/${userId}/reset-password`, {
      method: "POST",
      body: { password },
    }),
  deactivateUser: (userId: string) =>
    apiRequest(`/admin/users/${userId}/deactivate`, { method: "POST", body: {} }),
  deleteUser: (userId: string, reason?: string) =>
    apiRequest(`/admin/users/${userId}`, { method: "DELETE", body: reason ? { reason } : {} }),
  notifications: (filters?: { targetRole?: string; type?: string }) => {
    const params = new URLSearchParams();
    if (filters?.targetRole) params.set("targetRole", filters.targetRole);
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
  workflowSummary: () => apiRequest("/admin/workflow-summary"),
  storageSummary: () => apiRequest("/admin/storage-summary"),
  resetDemo: () => apiRequest("/admin/demo/reset", { method: "POST", body: {} }),
  clearDemo: () => apiRequest("/admin/demo/clear", { method: "POST", body: {} }),
};

export const assistantEarningsApi = {
  list: () => apiRequest("/assistant/earnings"),
};

export const notificationsApi = {
  list: () => apiRequest("/notifications"),
  read: (id: string) => apiRequest(`/notifications/${id}/read`, { method: "POST", body: {} }),
};
