import { apiClient } from "@/shared/api";
import { apiConfig } from "@/shared/api/config";
import { supabase } from "@/shared/lib/supabase";
import type { AdminFeedbackData } from "../types";

export const adminFeedbackService = {
  getData: async (): Promise<AdminFeedbackData> => {
    if (!apiConfig.useMockApi) {
      const { data } = await supabase
        .from("user_reports")
        .select("id, reporter_id, report_type, reason, description, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      const reports = data ?? [];
      return {
        reports: reports.map((r) => ({
          id: r.id,
          type: r.report_type,
          user: r.reporter_id?.slice(0, 8) ?? "Anonymous",
          priority: "Medium",
          status: r.status === "pending" ? "New" : r.status === "resolved" ? "Resolved" : "In Review",
          date: r.created_at.slice(0, 10),
          detail: r.description ?? r.reason,
        })),
        total: reports.length,
      };
    }
    return apiClient.get<AdminFeedbackData>("/api/admin/feedback");
  },

  updateStatus: async (reportId: string, status: string): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const dbStatus = status === "New" ? "pending" : status === "Resolved" ? "resolved" : "in_review";
      const { error } = await supabase.from("user_reports").update({ status: dbStatus }).eq("id", reportId);
      return { success: !error };
    }
    return apiClient.post<{ success: boolean }>(`/api/admin/feedback/${reportId}/status`, { json: { status } } as RequestInit);
  },

  escalate: async (reportId: string): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { error } = await supabase.from("report_actions").insert({
        report_id: reportId,
        action: "escalate",
        note: "Escalated to senior admin",
      });
      return { success: !error };
    }
    return apiClient.post<{ success: boolean }>(`/api/admin/feedback/${reportId}/escalate`);
  },
};
