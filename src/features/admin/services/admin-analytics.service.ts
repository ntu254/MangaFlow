import { apiClient } from "@/shared/api";
import { apiConfig } from "@/shared/api/config";
import { supabase } from "@/shared/lib/supabase";
import type { AdminAnalyticsData, TopPrompt, FailedDetection } from "../types";

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS = ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"];

export const adminAnalyticsService = {
  getData: async (): Promise<AdminAnalyticsData> => {
    if (!apiConfig.useMockApi) {
      const [aiMetricsRes, genLogsRes, analyticsRes] = await Promise.all([
        supabase.from("daily_ai_metrics").select("*").order("date", { ascending: true }),
        supabase.from("ai_generation_logs").select("success, confidence_score, prompt_snapshot, error_message").limit(1000),
        supabase.from("analytics_events")
          .select("event_type, data")
          .in("event_type", ["outfit_generate", "affiliate_click"])
          .limit(1000),
      ]);

      const aiMetrics = aiMetricsRes.data ?? [];
      const genLogs = genLogsRes.data ?? [];
      const analytics = analyticsRes.data ?? [];

      const latest = aiMetrics.at(-1);
      const totalGens = aiMetrics.reduce((s, r) => s + r.total_generations, 0);
      const successCount = genLogs.filter((g) => g.success).length;
      const totalGenLogs = genLogs.length || 1;
      const avgConf = genLogs.reduce((s, g) => s + (g.confidence_score ?? 0), 0) / totalGenLogs;
      const failedCount = genLogs.filter((g) => !g.success).length;

      const topPromptMap = new Map<string, number>();
      genLogs.forEach((g) => {
        if (g.prompt_snapshot) {
          const key = g.prompt_snapshot.slice(0, 60);
          topPromptMap.set(key, (topPromptMap.get(key) ?? 0) + 1);
        }
      });
      const topPrompts: TopPrompt[] = [...topPromptMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([prompt, count]) => ({ prompt, count }));

      const failedItemMap = new Map<string, number>();
      genLogs.forEach((g) => {
        if (!g.success && g.error_message) {
          const key = g.error_message.slice(0, 30);
          failedItemMap.set(key, (failedItemMap.get(key) ?? 0) + 1);
        }
      });
      const failedDetections: FailedDetection[] = [...failedItemMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([item, count]) => ({
          item,
          count,
          rate: totalGenLogs > 0 ? `${Math.round((count / totalGenLogs) * 100)}%` : "0%",
        }));

      if (topPrompts.length === 0) {
        analytics.forEach((a) => {
          if (a.event_type === "outfit_generate" && a.data) {
            const prompt = (a.data as any).prompt;
            if (prompt) {
              const key = prompt.slice(0, 60);
              topPromptMap.set(key, (topPromptMap.get(key) ?? 0) + 1);
            }
          }
        });
        [...topPromptMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .forEach(([prompt, count]) => {
            topPrompts.push({ prompt, count });
          });
      }

      return {
        stats: {
          totalGenerations: totalGens >= 1000 ? `${Math.round(totalGens / 1000)}K` : String(totalGens),
          detectionAccuracy: `${Math.round((successCount / totalGenLogs) * 100)}%`,
          avgConfidence: `${Math.round(avgConf > 1 ? avgConf : avgConf * 100)}%`,
          topStyle: "Casual",
          mostSaved: String(Math.round(totalGens * 0.15)),
          failedDetections: String(failedCount),
        },
        dailyGenerations: aiMetrics.slice(-7).map((r) => ({
          day: DAYS[new Date(r.date).getDay()],
          count: r.total_generations,
        })),
        accuracyTrend: aiMetrics.map((r) => {
          const d = new Date(r.date);
          return {
            month: MONTHS[d.getMonth()],
            rate: r.total_generations > 0
              ? Math.round(((r.total_generations - r.failed_generations) / r.total_generations) * 100)
              : 0,
          };
        }),
        topPrompts,
        failedDetections,
      };
    }
    return apiClient.get<AdminAnalyticsData>("/api/admin/analytics");
  },
};
