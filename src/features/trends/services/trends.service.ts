import { supabase } from "@/shared/lib";
import { apiClient } from "@/shared/api";
import { apiConfig } from "@/shared/api/config";
import type { SeasonalTrend, RegionTrend, NextTrend, PersonalizedTrend, WardrobeMatch } from "../types";

async function callEdgeGenerate(prompt: string, systemPrompt: string): Promise<any | null> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-outfit", {
      body: { prompt, style: "analysis" },
    });
    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

const REGIONS = [
  { region: "Hà Nội", flag: "🌿" },
  { region: "TP. HCM", flag: "🌴" },
  { region: "Đà Nẵng", flag: "🌊" },
  { region: "Hải Phòng", flag: "⛵" },
  { region: "Cần Thơ", flag: "🌾" },
];

export const trendsService = {
  getSeasonalTrends: async (): Promise<SeasonalTrend[]> => {
    if (!apiConfig.useMockApi) {
      const { data, error } = await supabase
        .from("fashion_trends")
        .select("title, description, growth_pct, season, category")
        .eq("is_published", true)
        .limit(20);
      if (error) throw error;
      if (data && data.length > 0) {
        const grouped: Record<string, SeasonalTrend> = {};
        data.forEach((t) => {
          const s = t.season ?? "all_year";
          if (!grouped[s]) grouped[s] = { season: s, label: `${s} 2026`, trends: [] };
          grouped[s].trends.push({
            name: t.title,
            desc: t.description ?? "",
            growth: `${t.growth_pct ?? 0}%`,
          });
        });
        return Object.values(grouped);
      }
      return [];
    }
    return apiClient.get<SeasonalTrend[]>("/api/trends/seasonal");
  },

  getRegionalTrends: async (): Promise<RegionTrend[]> => {
    if (!apiConfig.useMockApi) {
      const { data } = await supabase
        .from("fashion_trends")
        .select("title, category, description")
        .eq("is_published", true)
        .limit(30);

      const trendsByRegion: Record<string, string[]> = {};
      (data ?? []).forEach((t, i) => {
        const region = REGIONS[i % REGIONS.length].region;
        if (!trendsByRegion[region]) trendsByRegion[region] = [];
        if (trendsByRegion[region].length < 3) trendsByRegion[region].push(t.title);
      });

      return REGIONS.map((r) => ({
        region: r.region,
        flag: r.flag,
        trends: trendsByRegion[r.region] ?? [],
      }));
    }
    return apiClient.get<RegionTrend[]>("/api/trends/regional");
  },

  getNextTrends: async (): Promise<NextTrend[]> => {
    if (!apiConfig.useMockApi) {
      const { data } = await supabase
        .from("fashion_trends")
        .select("title, description, growth_pct")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        return data.map((t) => ({
          name: t.title,
          desc: t.description ?? "",
          confidence: Math.min(95, 50 + Math.abs(t.growth_pct ?? 0)),
          source: "Redo trend analysis",
        }));
      }
      return [];
    }
    return apiClient.get<NextTrend[]>("/api/trends/next");
  },

  getPersonalizedTrends: async (): Promise<PersonalizedTrend[]> => {
    if (!apiConfig.useMockApi) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("style_dna, preferred_styles")
          .eq("id", user.id)
          .single();

        const styles = (profile?.preferred_styles as string[]) ?? ["Casual"];
        const dna = profile?.style_dna as Record<string, number> ?? {};
        const topStyle = Object.entries(dna).sort((a, b) => b[1] - a[1])[0]?.[0] ?? styles[0];

        const stylePrompts: Record<string, PersonalizedTrend[]> = {
          Minimal: [
            { prompt: "Tối giản tinh tế", label: "Quiet Luxury", reason: "Phù hợp style minimal của bạn" },
            { prompt: "Layer công sở", label: "Smart Layering", reason: "Tối ưu tủ đồ công sở" },
          ],
          Streetwear: [
            { prompt: "Streetwear cá tính", label: "Urban Street", reason: "Xu hướng đường phố 2026" },
            { prompt: "Oversized layer", label: "Lazy Fit", reason: "Thoải mái nhưng chất" },
          ],
          Casual: [
            { prompt: "Casual sang trọng", label: "Smart Casual", reason: "Nâng tầm phong cách hàng ngày" },
            { prompt: "Weekend vibe", label: "Chill Weekend", reason: "Thư giãn cuối tuần" },
          ],
        };

        return stylePrompts[topStyle] ?? stylePrompts.Casual;
      }
      return [];
    }
    return apiClient.get<PersonalizedTrend[]>("/api/trends/personalized");
  },

  getWardrobeMatches: async (): Promise<WardrobeMatch[]> => {
    if (!apiConfig.useMockApi) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const [trendsRes, itemsRes] = await Promise.all([
        supabase.from("fashion_trends").select("title").eq("is_published", true).limit(5),
        supabase.from("wardrobe_items").select("name").eq("user_id", user.id).limit(100),
      ]);

      const trends = (trendsRes.data ?? []).map((t) => t.title);
      const items = (itemsRes.data ?? []).map((i) => i.name);
      const matches: WardrobeMatch[] = [];

      trends.forEach((trend) => {
        const owned = items.filter((item) =>
          trend.toLowerCase().includes(item.split(" ")[0]?.toLowerCase() ?? "")
        );
        matches.push({
          trend,
          match: owned.length > 0 ? owned.slice(0, 2).join(" + ") : "Cần bổ sung item mới",
          note: owned.length > 0
            ? `Bạn có ${owned.length}/${Math.min(3, owned.length + 1)} items cần thiết`
            : "Chưa có item nào trong tủ đồ",
        });
      });

      return matches;
    }
    return apiClient.get<WardrobeMatch[]>("/api/trends/wardrobe-matches");
  },
};
