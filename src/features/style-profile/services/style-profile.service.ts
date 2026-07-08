import { supabase } from "@/shared/lib";
import { apiClient } from "@/shared/api";
import { apiConfig } from "@/shared/api/config";
import type { StyleProfile, StyleRecommendation } from "../types";

async function callEdgeRecommendations(styleDna: any, favoriteColors: string[], wardrobeItems: any[]): Promise<StyleRecommendation[] | null> {
  try {
    const { data, error } = await supabase.functions.invoke("style-recommendations", {
      body: { styleDna, favoriteColors, wardrobeItems },
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("style-recommendations edge function failed:", error);
    return null;
  }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildProfileFallback(dna: Record<string, number>, colors: string[], styles: string[]): StyleProfile {
  const DNA = Object.entries(dna).map(([style, value]) => ({ style, value }));
  const colorList = colors.map((c, i) => ({
    name: c,
    hex: ["#FFFFFF", "#F5F0E8", "#1C1C1C", "#1B2A4A", "#9CAF88"][i % 5],
    pct: Math.round(100 / Math.max(colors.length, 1)),
  }));
  const topStyle = DNA.sort((a, b) => b.value - a.value)[0]?.style ?? "Casual";

  return {
    styleDna: DNA.length > 0 ? DNA : [{ style: "Casual", value: 100 }],
    favoriteColors: colorList.length > 0 ? colorList : [{ name: "White", hex: "#FFFFFF", pct: 100 }],
    outfitTypeDistribution: [
      { name: "Casual", value: 42, color: "hsl(0 0% 75%)" },
      { name: "Office", value: 28, color: "hsl(0 0% 45%)" },
      { name: "Streetwear", value: 15, color: "hsl(0 100% 70%)" },
      { name: "Party", value: 10, color: "hsl(0 0% 25%)" },
      { name: "Sport", value: 5, color: "hsl(166 65% 50%)" },
    ],
    aiInsight: {
      summary: `Phong cách thiên hướng ${topStyle}`,
      description: `Phong cách ${topStyle} chiếm ưu thế trong tủ đồ của bạn.`,
    },
    insights: [
      `Tông màu ${colors[0] ?? "trung tính"} chiếm ưu thế`,
      "Bạn có xu hướng chọn đồ basic và phối layer",
    ],
    wardrobeFavorites: [],
    evolution: MONTHS.slice(0, 6).map((m, i) => ({
      month: m,
      [topStyle]: 30 + i * 10,
      Casual: 50 - i * 5,
      Office: 20 - i * 5,
    })),
    trendSummary: [
      { label: topStyle, change: `+${DNA[0]?.value ?? 50}%`, positive: true },
    ],
    keyMoments: [{ month: `${MONTHS[new Date().getMonth()]} 2026`, event: "Cập nhật phong cách gần đây" }],
    suggestedStyles: [
      { name: "Quiet Luxury", image: "", desc: "Sang trọng thầm lặng" },
      { name: "Soft Minimal", image: "", desc: "Tối giản mềm mại" },
    ],
    missingEssentials: [
      { item: "Áo blazer trung tính", reason: "Thiếu item layering công sở", priority: "high" as const },
      { item: "Giày loafer", reason: "Đa năng cho cả công sở và đi chơi", priority: "medium" as const },
    ],
    consistencyScore: Math.min(85, DNA.length * 15),
    dominantStyles: styles.length > 0 ? styles : [topStyle],
  };
}

export const styleProfileService = {
  getProfile: async (userId: string, forceRefresh: boolean = false): Promise<StyleProfile> => {
    const LOCAL_STORAGE_KEY = `redo_style_profile_${userId}`;
    
    if (!forceRefresh) {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached) as StyleProfile;
        } catch (err) {
          console.warn("Failed to parse cached style profile", err);
        }
      }
    }

    if (!apiConfig.useMockApi) {
      try {
        const { data, error } = await supabase.functions.invoke("analyze-style-profile", {
          body: { forceRefresh },
        });
        if (error) throw error;
        if (data) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
          return data as StyleProfile;
        }
      } catch (err) {
        console.error("Failed to analyze style profile from edge function:", err);
      }
      
      // Fallback to local computation if edge function fails
      const { data: profile } = await supabase
        .from("profiles")
        .select("style_dna, favorite_colors, preferred_styles, quiz_completed")
        .eq("id", userId)
        .single();

      if (profile?.style_dna) {
        const dna = profile.style_dna as Record<string, number>;
        const colors = (profile.favorite_colors ?? []) as string[];
        const styles = (profile.preferred_styles ?? []) as string[];
        const fallbackProfile = buildProfileFallback(dna, colors, styles);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fallbackProfile));
        return fallbackProfile;
      }
      
      const defaultProfile = buildProfileFallback({ Casual: 100 }, ["Trắng", "Đen"], ["Casual"]);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultProfile));
      return defaultProfile;
    }
    
    try {
      const mockProfile = await apiClient.get<StyleProfile>(`/api/style-profile/${userId}`);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockProfile));
      return mockProfile;
    } catch (error) {
      throw error;
    }
  },

  getRecommendations: async (userId: string): Promise<StyleRecommendation[]> => {
    if (!apiConfig.useMockApi) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("style_dna, favorite_colors, preferred_styles")
        .eq("id", userId)
        .single();

      try {
        const edgeResult = await callEdgeRecommendations(
          profile?.style_dna ?? {},
          (profile?.favorite_colors ?? []) as string[],
          [],
        );
        if (edgeResult) return edgeResult;
      } catch {
        // edge function unavailable, fallback to local computation
      }

      const dna = profile?.style_dna as Record<string, number> ?? {};
      const topStyle = Object.entries(dna).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Casual";

      const recommendations: Record<string, StyleRecommendation[]> = {
        Minimal: [
          { prompt: "Gợi ý outfit tối giản thanh lịch", label: "Minimal", style: "Minimal" },
          { prompt: "Office layer tông trung tính", label: "Công sở", style: "Office" },
        ],
        Streetwear: [
          { prompt: "Streetwear cá tính layer áo khoác", label: "Streetwear", style: "Streetwear" },
          { prompt: "Oversized thoải mái cuối tuần", label: "Cuối tuần", style: "Casual" },
        ],
        Casual: [
          { prompt: "Casual sang trọng cho ngày mới", label: "Casual", style: "Casual" },
          { prompt: "Hẹn hò cuối tuần thanh lịch", label: "Hẹn hò", style: "Party" },
        ],
        Office: [
          { prompt: "Office look chuyên nghiệp", label: "Công sở", style: "Office" },
          { prompt: "Smart casual sau giờ làm", label: "Sau 5h", style: "Casual" },
        ],
        Party: [
          { prompt: "Dạ tiệc sang trọng", label: "Dạ tiệc", style: "Party" },
          { prompt: "Date night quyến rũ", label: "Hẹn hò", style: "Party" },
        ],
      };

      return recommendations[topStyle] ?? recommendations.Casual;
    }
    return apiClient.get<StyleRecommendation[]>(`/api/style-profile/${userId}/recommendations`);
  },
};
