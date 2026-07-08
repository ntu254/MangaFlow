import { apiClient } from "@/shared/api";
import { apiConfig } from "@/shared/api/config";
import { supabase } from "@/shared/lib/supabase";
import type { AdminProductsData, AdminProductClick } from "../types";

export const adminProductsService = {
  getData: async (): Promise<AdminProductsData> => {
    if (!apiConfig.useMockApi) {
      const [productsRes, catsRes, srcsRes] = await Promise.all([
        supabase.from("products").select("id, name, price, currency, is_active, is_featured, is_hidden, link_status, image_url, category_id, source_id, click_count"),
        supabase.from("product_categories").select("id, name"),
        supabase.from("product_sources").select("id, platform"),
      ]);
      const products = productsRes.data ?? [];
      const cats = catsRes.data ?? [];
      const srcs = srcsRes.data ?? [];
      const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));
      const srcMap = Object.fromEntries(srcs.map((s) => [s.id, s.platform]));
      const activeProducts = products.filter((p) => p.is_active);
      const brokenLinks = products.filter((p) => p.link_status === "broken").length;
      const totalClicks = products.reduce((s, p) => s + (p.click_count || 0), 0);

      return {
        stats: {
          totalProducts: products.length,
          activeAffiliates: activeProducts.length,
          brokenLinks,
          totalClicks,
        },
        products: products.map((p) => ({
          id: p.id,
          title: p.name,
          platform: srcMap[p.source_id] ?? "Unknown",
          category: catMap[p.category_id] ?? "Uncategorized",
          affiliate: p.is_active ? "Active" : "Inactive",
          linkHealth: p.link_status === "broken" ? "Broken" : "Healthy",
          featured: p.is_featured,
          clicks: p.click_count || 0,
          commission: 0,
          image_url: p.image_url,
        })),
      };
    }
    return apiClient.get<AdminProductsData>("/api/admin/products");
  },

  toggleFeatured: async (productId: string): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { data } = await supabase.from("products").select("is_featured").eq("id", productId).single();
      if (!data) return { success: false };
      await supabase.from("products").update({ is_featured: !data.is_featured }).eq("id", productId);
      return { success: true };
    }
    return apiClient.post<{ success: boolean }>(`/api/admin/products/${productId}/feature`);
  },

  toggleVisibility: async (productId: string, hidden: boolean): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      await supabase.from("products").update({ is_hidden: hidden }).eq("id", productId);
      return { success: true };
    }
    return apiClient.post<{ success: boolean }>(`/api/admin/products/${productId}/visibility`, { json: { hidden } } as RequestInit);
  },

  updateLink: async (productId: string, affiliateUrl: string): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { error } = await supabase.from("products").update({ affiliate_url: affiliateUrl, link_status: "healthy" }).eq("id", productId);
      return { success: !error };
    }
    return apiClient.patch<{ success: boolean }>(`/api/admin/products/${productId}/link`, { json: { affiliateUrl } } as RequestInit);
  },

  deleteProduct: async (productId: string): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      return { success: !error };
    }
    return apiClient.delete<{ success: boolean }>(`/api/admin/products/${productId}`);
  },

  getClicks: async (productId: string): Promise<AdminProductClick[]> => {
    if (!apiConfig.useMockApi) {
      const { data } = await supabase
        .from("product_clicks")
        .select("id, platform, clicked_at, source")
        .eq("product_id", productId)
        .order("clicked_at", { ascending: false })
        .limit(20);
      return (data ?? []).map((c) => ({
        id: c.id,
        user: "User",
        platform: c.platform ?? "",
        clicked_at: c.clicked_at,
        source: c.source ?? "unknown",
      }));
    }
    return apiClient.get<AdminProductClick[]>(`/api/admin/products/${productId}/clicks`);
  },
};
