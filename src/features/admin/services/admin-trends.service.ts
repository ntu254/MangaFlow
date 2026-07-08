import { apiClient } from "@/shared/api";
import { apiConfig } from "@/shared/api/config";
import { supabase } from "@/shared/lib/supabase";
import type { AdminTrendsData, AdminTrendCreate } from "../types";

export const adminTrendsService = {
  getData: async (): Promise<AdminTrendsData> => {
    if (!apiConfig.useMockApi) {
      const { data } = await supabase
        .from("fashion_trends")
        .select("id, title, category, season, year, is_published, created_at, growth_pct")
        .order("created_at", { ascending: false });
      const trends = data ?? [];
      return {
        trends: trends.map((t) => ({
          id: t.id,
          title: t.title,
          category: t.category,
          season: t.season ? `${t.season} ${t.year}` : `${t.year}`,
          status: t.is_published ? "Published" : "Draft",
          date: t.created_at.slice(0, 10),
          growthPct: t.growth_pct,
        })),
        published: trends.filter((t) => t.is_published).length,
        drafts: trends.filter((t) => !t.is_published).length,
      };
    }
    return apiClient.get<AdminTrendsData>("/api/admin/trends");
  },

  togglePublish: async (trendId: string): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { data } = await supabase.from("fashion_trends").select("is_published").eq("id", trendId).single();
      if (!data) return { success: false };
      await supabase.from("fashion_trends").update({ is_published: !data.is_published }).eq("id", trendId);
      return { success: true };
    }
    return apiClient.post<{ success: boolean }>(`/api/admin/trends/${trendId}/toggle`);
  },

  deleteTrend: async (trendId: string): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { error } = await supabase.from("fashion_trends").delete().eq("id", trendId);
      return { success: !error };
    }
    return apiClient.delete<{ success: boolean }>(`/api/admin/trends/${trendId}`);
  },

  updateTrend: async (id: string, data: { title?: string; category?: string; season?: string; description?: string; growth_pct?: number }): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { error } = await supabase.from("fashion_trends").update(data).eq("id", id);
      return { success: !error };
    }
    return apiClient.patch<{ success: boolean }>(`/api/admin/trends/${id}`, { json: data } as RequestInit);
  },

  createTrend: async (data: AdminTrendCreate): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { error } = await supabase.from("fashion_trends").insert({
        title: data.title,
        slug: data.title.toLowerCase().replace(/\s+/g, "-"),
        category: data.category,
        season: data.season,
        description: data.description ?? null,
        growth_pct: data.growthPct ?? null,
        year: 2026,
        is_published: false,
      });
      return { success: !error };
    }
    return apiClient.post<{ success: boolean }>("/api/admin/trends", { json: data } as RequestInit);
  },
};
