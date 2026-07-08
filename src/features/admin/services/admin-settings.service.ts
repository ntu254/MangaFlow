import { apiClient } from "@/shared/api";
import { apiConfig } from "@/shared/api/config";
import { supabase } from "@/shared/lib/supabase";
import type { AdminSettingsData, AdminPlatformInfo } from "../types";

export const adminSettingsService = {
  getData: async (): Promise<AdminSettingsData> => {
    if (!apiConfig.useMockApi) {
      const [settingsRes, flagsRes, rolesRes] = await Promise.all([
        supabase.from("system_settings").select("key, value"),
        supabase.from("feature_flags").select("key, enabled, description"),
        supabase.from("admin_roles").select("name, description"),
      ]);
      const settings = settingsRes.data ?? [];
      const flags = flagsRes.data ?? [];
      const roles = rolesRes.data ?? [];
      const getSetting = (key: string) => settings.find((s) => s.key === key);
      const appName = (getSetting("app_name")?.value as string) ?? "Redo";
      const supportEmail = (getSetting("support_email")?.value as string) ?? "support@redo.ai";

      return {
        onboardingToggles: flags.map((f) => ({
          key: f.key,
          label: f.description ?? f.key,
          description: f.key.replace(/_/g, " "),
          enabled: f.enabled,
        })),
        platformInfo: { platformName: appName, supportEmail },
        styleCategories: ["Casual", "Streetwear", "Office", "Date Night", "Athleisure", "Party", "Minimal", "Bohemian"],
        occasionCategories: ["Work", "Weekend", "Date", "Party", "Vacation", "Formal Event", "Gym", "School"],
        colorPalette: ["#E8927C", "#2EC4B6", "#1D1D1D", "#F4F0EC", "#6C63FF", "#FFD166", "#EF476F", "#118AB2"],
        notificationTemplates: ["Welcome Email", "Weekly Style Report", "New Trend Alert", "Outfit Saved Confirmation", "Account Suspension Notice"],
        apiIntegrations: [
          { name: "Shopee Affiliate API", status: "Connected" },
          { name: "TikTok Shop API", status: "Connected" },
        ],
        roles: roles.map((r) => ({
          role: r.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          users: 0,
          access: r.description ?? "—",
        })),
      };
    }
    return apiClient.get<AdminSettingsData>("/api/admin/settings");
  },

  saveGeneral: async (info: AdminPlatformInfo, toggles: { key: string; enabled: boolean }[]): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      await supabase.from("system_settings").upsert({ key: "app_name", value: info.platformName }, { onConflict: "key" });
      await supabase.from("system_settings").upsert({ key: "support_email", value: info.supportEmail }, { onConflict: "key" });
      for (const t of toggles) {
        await supabase.from("feature_flags").update({ enabled: t.enabled }).eq("key", t.key);
      }
      return { success: true };
    }
    return apiClient.post<{ success: boolean }>("/api/admin/settings/general", { json: { platformInfo: info, toggles } } as RequestInit);
  },

  saveApiKey: async (name: string, key: string): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      await supabase.from("system_settings").upsert(
        { key: `api_key_${name}`, value: key },
        { onConflict: "key" },
      );
      return { success: true };
    }
    return apiClient.post<{ success: boolean }>("/api/admin/settings/api", { json: { name, key } } as RequestInit);
  },
};
