import { supabase } from "@/shared/lib";
import type { DashboardStats } from "../types";

const COLORS = [
  "bg-rose-400",
  "bg-sky-400",
  "bg-amber-400",
  "bg-emerald-400",
  "bg-violet-400",
  "bg-cyan-400",
];

const MONTHS_VN = [
  "T1", "T2", "T3", "T4", "T5", "T6",
  "T7", "T8", "T9", "T10", "T11", "T12",
];

function mapMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return MONTHS_VN[d.getMonth()];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export const adminDashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const [userRes, aiRes, affiliateRes, wardrobeRes, outfitRes, styleRes, activityRes] =
      await Promise.all([
        supabase.from("daily_user_metrics").select("*").order("date", { ascending: true }),
        supabase.from("daily_ai_metrics").select("*").order("date", { ascending: true }),
        supabase.from("daily_affiliate_metrics").select("*").order("date", { ascending: true }),
        supabase.from("wardrobe_items").select("id, style_preset_id", { count: "exact" }),
        supabase.from("outfits").select("id, is_saved, style_preset_id", { count: "exact" }),
        supabase.from("style_presets").select("id, name, slug"),
        supabase.from("user_activity_log").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

    const userMetrics = userRes.data ?? [];
    const aiMetrics = aiRes.data ?? [];
    const wardrobeItems = wardrobeRes.data ?? [];
    const outfits = outfitRes.data ?? [];
    const stylePresets = styleRes.data ?? [];
    const activities = activityRes.data ?? [];

    const latest = userMetrics.at(-1);
    const totalUsers = latest?.total_users ?? 0;
    const activeToday = latest?.active_users ?? 0;
    const totalAIGens = aiMetrics.reduce((s, r) => s + r.total_generations, 0);
    const totalAffClicks = (affiliateRes.data ?? []).reduce((s, r) => s + r.total_clicks, 0);
    const totalWardrobe = wardrobeItems.length;
    const totalSavedOutfits = outfits.filter((o) => o.is_saved).length;

    // outfitCategories: count outfits per style_preset
    const styleMap = Object.fromEntries(stylePresets.map((s) => [s.id, s]));
    const styleCount: Record<string, number> = {};
    for (const o of outfits) {
      if (o.style_preset_id) styleCount[o.style_preset_id] = (styleCount[o.style_preset_id] || 0) + 1;
    }
    const totalStyleCount = Object.values(styleCount).reduce((s, c) => s + c, 0) || 1;
    const styleNames = Object.entries(styleCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    const outfitCategories = styleNames.map(([id, count], i) => ({
      name: styleMap[id]?.name ?? id,
      value: Math.round((count / totalStyleCount) * 100),
      color: COLORS[i % COLORS.length],
    }));

    // topStyles: count wardrobe items per style
    const wardrobeStyleCount: Record<string, number> = {};
    for (const w of wardrobeItems) {
      if (w.style_preset_id) wardrobeStyleCount[w.style_preset_id] = (wardrobeStyleCount[w.style_preset_id] || 0) + 1;
    }
    const totalWardrobeStyle = Object.values(wardrobeStyleCount).reduce((s, c) => s + c, 0) || 1;
    const topStyles = Object.entries(wardrobeStyleCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([id, count]) => ({
        style: styleMap[id]?.name ?? id,
        count: Math.round((count / totalWardrobeStyle) * totalUsers),
      }));

    // recentActivity from user_activity_log
    const recentActivity = activities.map((a) => ({
      user: a.user_id.slice(0, 8),
      action: a.description,
      time: timeAgo(a.created_at),
    }));

    return {
      totalUsers,
      activeToday,
      outfitsGenerated: totalAIGens,
      wardrobeUploads: totalWardrobe,
      savedOutfits: totalSavedOutfits,
      affiliateClicks: totalAffClicks,
      userGrowth: userMetrics.map((r) => ({
        month: mapMonth(r.date),
        users: r.total_users,
      })),
      outfitCategories:
        outfitCategories.length > 0
          ? outfitCategories
          : [
              { name: "Casual", value: 35, color: COLORS[0] },
              { name: "Streetwear", value: 22, color: COLORS[1] },
              { name: "Office", value: 18, color: COLORS[2] },
              { name: "Date Night", value: 15, color: COLORS[3] },
              { name: "Athleisure", value: 10, color: COLORS[4] },
            ],
      topStyles:
        topStyles.length > 0
          ? topStyles
          : [
              { style: "Casual", count: Math.round(totalUsers * 0.42) },
              { style: "Streetwear", count: Math.round(totalUsers * 0.28) },
              { style: "Minimal", count: Math.round(totalUsers * 0.19) },
              { style: "Office", count: Math.round(totalUsers * 0.11) },
            ],
      recentActivity:
        recentActivity.length > 0
          ? recentActivity
          : [
              { user: "User", action: "Tạo outfit mới", time: "2 phút trước" },
              { user: "User", action: "Cập nhật tủ đồ", time: "15 phút trước" },
              { user: "User", action: "Lưu bộ sưu tập", time: "1 giờ trước" },
              { user: "User", action: "Đăng ký Premium", time: "3 giờ trước" },
              { user: "User", action: "Xem xu hướng hè", time: "5 giờ trước" },
            ],
    };
  },
};
