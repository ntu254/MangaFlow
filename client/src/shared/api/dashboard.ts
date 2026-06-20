import { api, unwrap } from "./_client";

export type DashboardSummary = Record<string, any>;

export const dashboardApi = {
  admin: () => api.get("/dashboard/admin/sidebar-summary").then(unwrap<DashboardSummary>),
  mangaka: () => api.get("/dashboard/mangaka/summary").then(unwrap<DashboardSummary>),
  editor: () => api.get("/dashboard/editor/summary").then(unwrap<DashboardSummary>),
  assistant: () => api.get("/dashboard/assistant/summary").then(unwrap<DashboardSummary>),
  board: () => api.get("/dashboard/board/summary").then(unwrap<DashboardSummary>),
};
