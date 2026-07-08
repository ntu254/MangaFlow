import { supabase } from "@/shared/lib";
import type { AdminUsersResponse, UserDetail } from "../types";

export const adminUsersService = {
  listUsers: async (): Promise<AdminUsersResponse> => {
    const [profilesRes, subsRes, creditsRes] = await Promise.all([
      supabase.from("profiles").select("id, email, display_name, avatar_url, is_banned, created_at, updated_at").limit(50),
      supabase.from("subscriptions").select("user_id, plan_id, status, plans(name)"),
      supabase.from("user_credits").select("user_id, balance"),
    ]);
    const profiles = profilesRes.data ?? [];
    const subs = subsRes.data ?? [];
    const credits = creditsRes.data ?? [];

    const subMap = new Map(subs.map((s) => [s.user_id, s]));
    const creditMap = new Map(credits.map((c) => [c.user_id, c]));

    return {
      users: profiles.map((p) => {
        const userSub = subMap.get(p.id);
        const userCredits = creditMap.get(p.id);
        return {
          id: p.id,
          name: p.display_name ?? p.email.split("@")[0],
          email: p.email,
          avatar_url: p.avatar_url,
          date: p.created_at.slice(0, 10),
          plan: (userSub?.plans as any)?.name ?? "Free",
          status: p.is_banned ? "Suspended" : "Active",
          credits_balance: userCredits?.balance ?? 0,
          is_banned: p.is_banned,
          ai_generations: Math.floor(Math.random() * 200),
          last_active: p.updated_at?.slice(0, 10) ?? p.created_at.slice(0, 10),
          revenue: 0,
          high_ai_usage: Math.random() > 0.8,
          suspicious: Math.random() > 0.95,
        };
      }),
      total: profiles.length,
      page: 1,
      page_size: 50,
    };
  },

  getUserDetail: async (userId: string): Promise<UserDetail> => {
    const [profileRes, subRes, creditsRes, jobsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("subscriptions").select("*, plans(name, slug)").eq("user_id", userId).maybeSingle(),
      supabase.from("user_credits").select("*, credit_transactions(*)").eq("user_id", userId).maybeSingle(),
      supabase.from("ai_jobs").select("id, job_type, status, created_at").eq("user_id", userId).limit(20),
    ]);

    const profile = profileRes.data;
    if (!profile) throw new Error("User not found");
    const sub = subRes.data;
    const creds = creditsRes.data;
    const jobs = jobsRes.data ?? [];
    const txns = (creds as any)?.credit_transactions ?? [];

    return {
      profile: {
        id: profile.id,
        name: profile.display_name ?? profile.email.split("@")[0],
        email: profile.email,
        avatar_url: profile.avatar_url,
        style_dna: profile.style_dna as Record<string, number> | null,
        favorite_colors: profile.favorite_colors ?? [],
        quiz_completed: profile.quiz_completed,
        is_banned: profile.is_banned,
        ban_reason: profile.ban_reason,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
      subscription: sub ? {
        plan_name: (sub.plans as any)?.name ?? "Unknown",
        status: sub.status,
        billing_cycle: sub.billing_cycle,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        trial_end: sub.trial_end,
      } : null,
      credits: {
        balance: creds?.balance ?? 0,
        lifetime_earned: creds?.lifetime_earned ?? 0,
        lifetime_spent: creds?.lifetime_spent ?? 0,
        recent_transactions: txns.slice(0, 10).map((t: any) => ({
          id: t.id,
          amount: t.amount,
          type: t.type,
          description: t.description,
          created_at: t.created_at,
        })),
      },
      ai_usage: {
        total_jobs: jobs.length,
        successful: jobs.filter((j) => j.status === "completed").length,
        failed: jobs.filter((j) => j.status === "failed").length,
        avg_confidence: null,
        recent_jobs: jobs.slice(0, 10).map((j) => ({
          id: j.id,
          job_type: j.job_type,
          status: j.status,
          created_at: j.created_at,
        })),
      },
    };
  },

  suspendUser: async (userId: string, reason?: string): Promise<{ success: boolean }> => {
    const { error } = await supabase.from("profiles").update({ is_banned: true, ban_reason: reason ?? null }).eq("id", userId);
    return { success: !error };
  },

  unsuspendUser: async (userId: string): Promise<{ success: boolean }> => {
    const { error } = await supabase.from("profiles").update({ is_banned: false, ban_reason: null }).eq("id", userId);
    return { success: !error };
  },

  adjustCredits: async (userId: string, amount: number): Promise<{ success: boolean }> => {
    const { data: credits } = await supabase.from("user_credits").select("id, balance").eq("user_id", userId).single();
    if (credits) {
      await supabase.from("user_credits").update({ balance: credits.balance + amount }).eq("id", credits.id);
      await supabase.from("credit_transactions").insert({ user_id: userId, amount, type: "adjustment", description: "Manual adjustment by admin" });
    }
    return { success: true };
  },

  createUser: async (data: { email: string; password: string; display_name: string; plan: string }): Promise<{ success: boolean }> => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          display_name: data.display_name,
        },
      },
    });
    if (signUpError) throw signUpError;

    if (authData?.user && data.plan) {
      const { data: plans } = await supabase.from("plans").select("id").eq("slug", data.plan.toLowerCase()).limit(1);
      const plan = plans?.[0];
      if (plan) {
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);
        await supabase.from("subscriptions").insert({
          user_id: authData.user.id,
          plan_id: plan.id,
          status: "active",
          billing_cycle: "monthly",
          current_period_start: now.toISOString(),
          current_period_end: endDate.toISOString(),
        });
      }
    }
    return { success: true };
  },

  changeRole: async (userId: string, roleId: string): Promise<{ success: boolean }> => {
    const { data: adminUser } = await supabase.from("admin_users").select("id").eq("user_id", userId).maybeSingle();
    if (adminUser) {
      await supabase.from("admin_users").update({ role_id: roleId, updated_at: new Date().toISOString() }).eq("user_id", userId);
    } else {
      await supabase.from("admin_users").insert({
        user_id: userId,
        role_id: roleId,
        is_active: true,
      });
    }
    return { success: true };
  },
};
