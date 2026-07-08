import { apiClient } from "@/shared/api";
import { apiConfig } from "@/shared/api/config";
import { supabase } from "@/shared/lib/supabase";
import type { AdminPlansData } from "../types";

export const adminPlansService = {
  getData: async (): Promise<AdminPlansData> => {
    if (!apiConfig.useMockApi) {
      const [plansRes, subsRes, paymentsRes] = await Promise.all([
        supabase.from("plans").select("*").order("sort_order"),
        supabase.from("subscriptions").select("plan_id, status, created_at"),
        supabase.from("payments").select("id, amount, status, created_at, user_id").limit(100),
      ]);
      const plans = plansRes.data ?? [];
      const subs = subsRes.data ?? [];
      const payments = paymentsRes.data ?? [];

      const payingSubs = subs.filter((s) => s.status === "active" || s.status === "trialing");
      const payingUsers = payingSubs.length;
      const totalRevenue = payments
        .filter((p) => p.status === "completed")
        .reduce((s, p) => s + (p.amount ?? 0), 0);
      const totalUsers = (await supabase.from("profiles").select("id", { count: "exact", head: true })).count ?? 0;

      return {
        stats: {
          monthlyRevenue: `${totalRevenue.toLocaleString("vi-VN")}₫`,
          payingUsers,
          avgRevenuePerUser: payingUsers > 0 ? `${Math.round(totalRevenue / payingUsers).toLocaleString("vi-VN")}₫` : "0₫",
          conversionRate: totalUsers > 0 ? `${((payingUsers / totalUsers) * 100).toFixed(1)}%` : "0%",
        },
        plans: plans.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price_monthly === 0 ? "Miễn phí" : `${p.price_monthly.toLocaleString("vi-VN")}₫/tháng`,
          users: payingSubs.filter((s) => s.plan_id === p.id).length,
          revenue: `${(payingSubs.filter((s) => s.plan_id === p.id).length * p.price_monthly).toLocaleString("vi-VN")}₫`,
          credits: p.credits_per_month,
          status: p.is_active ? "Hoạt động" : "Tạm dừng",
        })),
        transactions: payments
          .filter((p) => p.status === "completed")
          .slice(0, 10)
          .map((p) => ({
            id: p.id,
            user: p.user_id?.slice(0, 8) ?? "—",
            plan: "—",
            amount: `${(p.amount ?? 0).toLocaleString("vi-VN")}₫`,
            method: "PayOS",
            date: p.created_at.slice(0, 10),
            status: "Hoàn thành",
          })),
      };
    }
    return apiClient.get<AdminPlansData>("/api/admin/plans");
  },

  createPlan: async (data: { name: string; slug: string; price_monthly: number; ai_generations_limit: number; wardrobe_limit: number; saved_outfits_limit: number }): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { error } = await supabase.from("plans").insert({ ...data, is_active: true, sort_order: 99 });
      return { success: !error };
    }
    return apiClient.post<{ success: boolean }>("/api/admin/plans", { json: data } as RequestInit);
  },

  updatePlan: async (id: string, data: { name?: string; price_monthly?: number; is_active?: boolean }): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { error } = await supabase.from("plans").update(data).eq("id", id);
      return { success: !error };
    }
    return apiClient.patch<{ success: boolean }>(`/api/admin/plans/${id}`, { json: data } as RequestInit);
  },

  togglePlanStatus: async (planId: string): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { data } = await supabase.from("plans").select("is_active").eq("id", planId).single();
      if (!data) return { success: false };
      await supabase.from("plans").update({ is_active: !data.is_active }).eq("id", planId);
      return { success: true };
    }
    return apiClient.post<{ success: boolean }>(`/api/admin/plans/${planId}/toggle`);
  },
};
