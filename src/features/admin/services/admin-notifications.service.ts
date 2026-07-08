import { apiClient } from "@/shared/api";
import { apiConfig } from "@/shared/api/config";
import { supabase } from "@/shared/lib/supabase";
import type { AdminNotificationsData, AdminBroadcastPayload, AdminChannelSetting } from "../types";

export const adminNotificationsService = {
  getData: async (): Promise<AdminNotificationsData> => {
    if (!apiConfig.useMockApi) {
      const [notifsRes, settingsRes] = await Promise.all([
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("system_settings").select("key, value").in("key", ["email_settings", "push_settings"]),
      ]);
      const notifs = notifsRes.data ?? [];
      const settings = settingsRes.data ?? [];
      const emailCfg = settings.find((s) => s.key === "email_settings");
      const pushCfg = settings.find((s) => s.key === "push_settings");
      const emailSettingsVal = emailCfg?.value as Record<string, boolean> | null ?? {};
      const pushSettingsVal = pushCfg?.value as Record<string, boolean> | null ?? {};

      return {
        templates: notifs.map((n) => ({
          id: n.id,
          name: n.title,
          channel: n.type === "push" ? "Push" : "Email",
          trigger: n.target_type,
          status: n.sent_at ? "Active" : n.scheduled_at ? "Draft" : "Inactive",
        })),
        emailSettings: [
          { key: "weekly_digest", label: "Weekly Style Digest", description: "Send weekly outfit recommendations via email", enabled: emailSettingsVal["weekly_digest"] ?? true },
          { key: "trend_alerts", label: "Trend Alerts", description: "Notify users about new fashion trends", enabled: emailSettingsVal["trend_alerts"] ?? true },
          { key: "promotional", label: "Promotional Emails", description: "Send promotions and affiliate deals", enabled: emailSettingsVal["promotional"] ?? false },
        ],
        pushSettings: [
          { key: "outfit_ready", label: "Outfit Ready", description: "Push when AI finishes generating an outfit", enabled: pushSettingsVal["outfit_ready"] ?? true },
          { key: "new_trend", label: "New Trend Available", description: "Push when new trend insights are ready", enabled: pushSettingsVal["new_trend"] ?? true },
          { key: "subscription_reminder", label: "Subscription Reminders", description: "Push before subscription expires", enabled: pushSettingsVal["subscription_reminder"] ?? true },
        ],
      };
    }
    return apiClient.get<AdminNotificationsData>("/api/admin/notifications");
  },

  sendBroadcast: async (payload: AdminBroadcastPayload): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { error } = await supabase.from("notifications").insert({
        title: payload.title,
        body: payload.body,
        type: "push",
        target_type: payload.target,
      });
      return { success: !error };
    }
    return apiClient.post<{ success: boolean }>("/api/admin/notifications/broadcast", { json: payload } as RequestInit);
  },

  saveSettings: async (settings: AdminChannelSetting[]): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const emailKeys = settings.filter((s) => ["weekly_digest", "trend_alerts", "promotional"].includes(s.key));
      const pushKeys = settings.filter((s) => ["outfit_ready", "new_trend", "subscription_reminder"].includes(s.key));
      const emailVal: Record<string, boolean> = {};
      const pushVal: Record<string, boolean> = {};
      emailKeys.forEach((s) => { emailVal[s.key] = s.enabled; });
      pushKeys.forEach((s) => { pushVal[s.key] = s.enabled; });
      await supabase.from("system_settings").upsert({ key: "email_settings", value: emailVal }, { onConflict: "key" });
      await supabase.from("system_settings").upsert({ key: "push_settings", value: pushVal }, { onConflict: "key" });
      return { success: true };
    }
    return apiClient.post<{ success: boolean }>("/api/admin/notifications/settings", { json: { settings } } as RequestInit);
  },
};
