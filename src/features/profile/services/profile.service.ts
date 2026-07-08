import { supabase } from "@/shared/lib";
import { apiClient } from "@/shared/api";
import { apiConfig } from "@/shared/api/config";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  style_dna: Record<string, number> | null;
  favorite_colors: string[] | null;
  quiz_completed: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  body_size: Record<string, unknown> | null;
  preferred_styles: string[];
  preferred_occasions: string[];
  budget_min: number | null;
  budget_max: number | null;
  fashion_preferences: {
    gender?: string | null;
    [key: string]: unknown;
  };
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  display_name?: string;
  avatar_url?: string;
  style_dna?: Record<string, number>;
  favorite_colors?: string[];
  quiz_completed?: boolean;
  body_size?: Record<string, unknown> | null;
  preferred_styles?: string[];
  preferred_occasions?: string[];
  budget_min?: number | null;
  budget_max?: number | null;
  fashion_preferences?: {
    gender?: string | null;
    [key: string]: unknown;
  };
  two_factor_enabled?: boolean;
}

export interface UserNotificationPreferences {
  id: string;
  user_id: string;
  trend_alerts: boolean;
  outfit_suggestions: boolean;
  promotions: boolean;
  subscription_reminders: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const profileService = {
  getProfile: async (userId: string) => {
    if (apiConfig.useMockApi) {
      return apiClient.get<Profile>("/api/profile");
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (
      error &&
      !error.message.includes("schema cache") &&
      !error.message.includes("permission denied") &&
      error.code !== "PGRST204" &&
      error.code !== "PGRST116" &&
      error.code !== "42P01" &&
      error.code !== "42501" &&
      error.code !== "PGRST301"
    ) {
      throw error;
    }

    if (data) return data as Profile;

    // Fallback if data is null or if there was a schema cache/missing table error
    const { data: user } = await supabase.auth.getUser();
    const email = user?.user?.email ?? "";
    const displayName = user?.user?.user_metadata?.full_name
      ?? user?.user?.user_metadata?.name
      ?? email.split("@")[0]
      ?? "";

    const fallbackProfile: Profile = {
      id: userId,
      email,
      display_name: displayName,
      preferred_styles: [],
      preferred_occasions: [],
      fashion_preferences: {},
      avatar_url: null,
      style_dna: null,
      favorite_colors: [],
      quiz_completed: false,
      is_banned: false,
      ban_reason: null,
      body_size: null,
      budget_min: null,
      budget_max: null,
      two_factor_enabled: false,
      created_at: user?.user?.created_at ?? new Date().toISOString(),
      updated_at: user?.user?.updated_at ?? new Date().toISOString(),
    };

    // Only attempt to upsert if there was NO schema error, otherwise we'll just return the fallback.
    if (!error) {
      const { data: created, error: insertError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          email,
          display_name: displayName,
          preferred_styles: [],
          preferred_occasions: [],
          fashion_preferences: {},
        })
        .select()
        .single();
      
      if (insertError) {
        if (
          !insertError.message.includes("schema cache") &&
          !insertError.message.includes("permission denied") &&
          insertError.code !== "42P01" &&
          insertError.code !== "42501" &&
          insertError.code !== "PGRST301"
        ) {
          throw insertError;
        }
      } else if (created) {
        return created as Profile;
      }
    }

    return fallbackProfile;
  },

  updateProfile: async (userId: string, updates: ProfileUpdate) => {
    if (apiConfig.useMockApi) {
      return apiClient.patch<Profile>("/api/profile", { json: updates });
    }
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  },

  updateStylePreferences: async (userId: string, styleDna: Record<string, number>, favoriteColors: string[]) => {
    if (apiConfig.useMockApi) {
      return apiClient.patch<Profile>("/api/profile/style-preferences", { json: { styleDna, favoriteColors } });
    }
    return profileService.updateProfile(userId, { style_dna: styleDna, favorite_colors: favoriteColors });
  },

  completeQuiz: async (userId: string, styleDna: Record<string, number>) => {
    if (apiConfig.useMockApi) {
      return apiClient.post<Profile>("/api/profile/quiz-complete", { json: { styleDna } });
    }
    return profileService.updateProfile(userId, { style_dna: styleDna, quiz_completed: true });
  },

  resetPersonalization: async (userId: string) => {
    if (apiConfig.useMockApi) {
      return apiClient.post<Profile>("/api/profile/reset-personalization");
    }
    const { error: eventsError } = await supabase
      .from("analytics_events")
      .delete()
      .eq("user_id", userId)
      .in("event_type", ["outfit_generate", "save_outfit", "quiz_complete", "trend_view"]);
    if (eventsError) throw eventsError;

    return profileService.updateProfile(userId, {
      style_dna: {},
      favorite_colors: [],
      preferred_styles: [],
      preferred_occasions: [],
      fashion_preferences: {},
      quiz_completed: false,
    });
  },

  uploadAvatar: async (userId: string, file: File) => {
    if (apiConfig.useMockApi) {
      return URL.createObjectURL(file);
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { cacheControl: "3600", upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await profileService.updateProfile(userId, { avatar_url: data.publicUrl });
    return data.publicUrl;
  },

  getNotificationPreferences: async (userId: string) => {
    if (apiConfig.useMockApi) {
      return apiClient.get<UserNotificationPreferences>("/api/profile/notification-preferences");
    }
    const { data, error } = await supabase
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (
        error.message.includes("schema cache") ||
        error.message.includes("permission denied") ||
        error.code === "PGRST204" ||
        error.code === "PGRST116" ||
        error.code === "42P01" ||
        error.code === "42501" ||
        error.code === "PGRST301"
      ) {
        return {
          id: "dummy",
          user_id: userId,
          push_enabled: false,
          email_enabled: false,
          trend_alerts: false,
          outfit_suggestions: false,
          promotions: false,
          subscription_reminders: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserNotificationPreferences;
      }
      throw error;
    }

    if (data) return data as UserNotificationPreferences;

    const { data: created, error: insertError } = await supabase
      .from("user_notification_preferences")
      .insert({ user_id: userId })
      .select()
      .single();
    
    if (insertError) {
      if (
        insertError.message.includes("schema cache") ||
        insertError.message.includes("permission denied") ||
        insertError.code === "42P01" ||
        insertError.code === "42501" ||
        insertError.code === "PGRST301"
      ) {
        return {
          id: "dummy",
          user_id: userId,
          push_enabled: false,
          email_enabled: false,
          trend_alerts: false,
          outfit_suggestions: false,
          promotions: false,
          subscription_reminders: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserNotificationPreferences;
      }
      throw insertError;
    }
    return created as UserNotificationPreferences;
  },

  updateNotificationPreferences: async (
    userId: string,
    updates: Partial<Omit<UserNotificationPreferences, "id" | "user_id" | "created_at" | "updated_at">>,
  ) => {
    if (apiConfig.useMockApi) {
      return apiClient.patch<UserNotificationPreferences>("/api/profile/notification-preferences", { json: updates });
    }
    const { data, error } = await supabase
      .from("user_notification_preferences")
      .upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
      .select()
      .single();
      
    if (error) {
      if (
        error.message.includes("schema cache") ||
        error.message.includes("permission denied") ||
        error.code === "42P01" ||
        error.code === "42501" ||
        error.code === "PGRST301"
      ) {
        return {
          id: "dummy",
          user_id: userId,
          push_enabled: false,
          email_enabled: false,
          trend_alerts: false,
          outfit_suggestions: false,
          promotions: false,
          subscription_reminders: false,
          ...updates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserNotificationPreferences;
      }
      throw error;
    }
    return data as UserNotificationPreferences;
  },

  listPayments: async (userId: string) => {
    if (apiConfig.useMockApi) {
      return apiClient.get<Array<{ id: string; amount: number; currency: string; status: string; paid_at: string | null; created_at: string }>>("/api/profile/payments");
    }
    const { data, error } = await supabase
      .from("payments")
      .select("id, amount, currency, status, paid_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return data ?? [];
  },

  listInvoices: async (userId: string) => {
    if (apiConfig.useMockApi) {
      return apiClient.get<Array<{ id: string; invoice_number: string; amount: number; currency: string; status: string; pdf_url: string | null; created_at: string }>>("/api/profile/invoices");
    }
    const { data, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, amount, currency, status, pdf_url, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return data ?? [];
  },
};
