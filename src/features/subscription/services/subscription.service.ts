import { supabase } from "@/shared/lib";
import type { CheckoutResponse, Plan, SubscriptionInfo } from "../types";

export const subscriptionService = {
  getPlans: async (): Promise<Plan[]> => {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
      
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
        // Fallback mock plans
        return [
          {
            id: "plan_free",
            name: "Free",
            slug: "free",
            description: "Gói cơ bản để trải nghiệm",
            price_monthly: 0,
            price_yearly: 0,
            currency: "VND",
            ai_generations_limit: 10,
            wardrobe_limit: 50,
            saved_outfits_limit: 20,
            credits_per_month: 0,
            has_ai_analysis: false,
            has_affiliate_access: false,
            has_trend_insights: false,
            has_priority_support: false,
            trial_days: 0,
            is_active: true,
            sort_order: 1,
          },
          {
            id: "plan_pro",
            name: "Pro",
            slug: "pro",
            description: "Tính năng cao cấp cho tín đồ thời trang",
            price_monthly: 99000,
            price_yearly: 990000,
            currency: "VND",
            ai_generations_limit: 100,
            wardrobe_limit: 500,
            saved_outfits_limit: 200,
            credits_per_month: 500,
            has_ai_analysis: true,
            has_affiliate_access: true,
            has_trend_insights: true,
            has_priority_support: false,
            trial_days: 7,
            is_active: true,
            sort_order: 2,
          }
        ];
      }
      throw error;
    }
    return data ?? [];
  },

  getSubscription: async (userId: string): Promise<SubscriptionInfo | null> => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, plans(*)")
      .eq("user_id", userId)
      .maybeSingle();
      
    if (error) {
      if (
        error.message.includes("schema cache") ||
        error.message.includes("permission denied") ||
        error.code === "42P01" ||
        error.code === "42501" ||
        error.code === "PGRST301"
      ) {
        return null;
      }
      throw error;
    }
    return data;
  },

  createCheckout: async (planId: string, billingCycle: "monthly" | "yearly" = "monthly"): Promise<CheckoutResponse> => {
    const { data, error } = await supabase.functions.invoke("create-payment", {
      body: { planId, billingCycle },
    });
    if (error) throw error;
    return data;
  },

  cancelSubscription: async (subscriptionId: string): Promise<void> => {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);
    if (error) throw error;
  },
};
