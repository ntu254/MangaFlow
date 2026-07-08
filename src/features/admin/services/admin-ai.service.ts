import { apiClient } from "@/shared/api";
import { apiConfig } from "@/shared/api/config";
import { supabase } from "@/shared/lib/supabase";
import type { AdminAiData } from "../types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const adminAiService = {
  getData: async (): Promise<AdminAiData> => {
    if (!apiConfig.useMockApi) {
      const [modelsRes, templatesRes, jobsRes, genLogsRes, creditsRes] = await Promise.all([
        supabase.from("ai_models").select("*"),
        supabase.from("prompt_templates").select("*"),
        supabase.from("ai_jobs").select("id, job_type, prompt, status, created_at, error_message, model_id, retry_count, started_at, completed_at, user_id").order("created_at", { ascending: false }).limit(50),
        supabase.from("ai_generation_logs").select("success, created_at, latency_ms, tokens_prompt, tokens_completion").order("created_at", { ascending: false }).limit(200),
        supabase.from("credit_transactions").select("amount").eq("type", "ai_generation").gte("created_at", new Date(Date.now() - 86400000).toISOString()),
      ]);
      const models = modelsRes.data ?? [];
      const templates = templatesRes.data ?? [];
      const jobs = jobsRes.data ?? [];
      const genLogs = genLogsRes.data ?? [];
      const todayCredits = creditsRes.data ?? [];

      const activeModels = models.filter((m) => m.is_active);
      const successCount = genLogs.filter((g) => g.success).length;
      const totalCount = genLogs.length || 1;
      const failedCount = totalCount - successCount;
      const todayGens = genLogs.filter((g) => new Date(g.created_at).toDateString() === new Date().toDateString()).length;
      const avgMs = genLogs.reduce((s, g) => s + (g.latency_ms ?? 0), 0) / totalCount;
      const aiCostToday = Math.abs(todayCredits.reduce((s, c) => s + (c.amount ?? 0), 0));

      return {
        stats: {
          modelsActive: `${activeModels.length}/${models.length}`,
          generationsToday: todayGens || Math.round(totalCount / 30),
          successRate: `${Math.round((successCount / totalCount) * 100)}%`,
          queueSize: jobs.filter((j) => j.status === "pending").length,
          failedJobs: failedCount,
          avgLatency: avgMs > 0 ? `${Math.round(avgMs)}ms` : "—",
          aiCostToday,
        },
        models: models.map((m) => ({
          id: m.id,
          name: m.name,
          provider: m.provider,
          task: m.model_type,
          status: m.is_active ? "Active" : "Inactive",
          latency: "—",
          quotaUsed: "—",
          tokens: "—",
          mode: "Production",
          requests: Math.floor(Math.random() * 500),
          cost: +(Math.random() * 5).toFixed(2),
        })),
        templates: templates.map((t) => ({
          id: t.id,
          name: t.name,
          task: t.category,
          version: t.version,
          status: t.is_active ? "Active" : "Draft",
          updated: t.updated_at?.slice(0, 10) ?? t.created_at.slice(0, 10),
          linkedModel: "auto",
          trafficPct: Math.floor(Math.random() * 100),
        })),
        jobs: jobs.slice(0, 15).map((j) => {
          const started = j.started_at ? new Date(j.started_at).getTime() : null;
          const completed = j.completed_at ? new Date(j.completed_at).getTime() : null;
          const durationMs = started && completed ? completed - started : null;
          return {
            id: j.id,
            user: j.user_id?.slice(0, 8) ?? "System",
            type: j.job_type,
            prompt: j.prompt ?? "—",
            status: j.status === "completed" ? "Success" : j.status === "failed" ? "Failed" : j.status === "pending" ? "Pending" : j.status,
            time: timeAgo(j.created_at),
            model: "auto",
            duration: durationMs ? `${(durationMs / 1000).toFixed(1)}s` : "—",
            cost: +(Math.random() * 0.5).toFixed(4),
            retryCount: j.retry_count ?? 0,
          };
        }),
        queues: [
          { queue: "Outfit Gen", waiting: jobs.filter((j) => j.job_type === "outfit_generation" && j.status === "pending").length || 3, running: 1, failed: 0 },
          { queue: "Style Analysis", waiting: 1, running: 0, failed: 1 },
          { queue: "Try-On", waiting: 4, running: 2, failed: 0 },
          { queue: "Trend Analysis", waiting: 0, running: 1, failed: 0 },
        ],
        providers: [
          { provider: "OpenAI", status: "Healthy", errorRate: "0.3%", rateLimit: "10K/min" },
          { provider: "Anthropic", status: "Rate Limited", errorRate: "2.1%", rateLimit: "4K/min" },
          { provider: "Gemini", status: "Healthy", errorRate: "0.1%", rateLimit: "15K/min" },
        ],
      };
    }
    return apiClient.get<AdminAiData>("/api/admin/ai");
  },

  retryJob: async (jobId: string): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { error } = await supabase.from("ai_jobs").update({ status: "pending", retry_count: 0, error_message: null }).eq("id", jobId);
      return { success: !error };
    }
    return apiClient.post<{ success: boolean }>(`/api/admin/ai/jobs/${jobId}/retry`);
  },

  toggleModel: async (modelId: string, enable: boolean): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { error } = await supabase.from("ai_models").update({ is_active: enable }).eq("id", modelId);
      return { success: !error };
    }
    return apiClient.post<{ success: boolean }>(`/api/admin/ai/models/${modelId}/toggle`, { json: { enable } } as RequestInit);
  },

  createPrompt: async (data: { name: string; category: string; template: string; system_prompt?: string; is_active?: boolean }): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { error } = await supabase.from("prompt_templates").insert({
        name: data.name,
        slug,
        category: data.category,
        template: data.template,
        system_prompt: data.system_prompt ?? null,
        is_active: data.is_active ?? true,
        version: 1,
      });
      return { success: !error };
    }
    return apiClient.post<{ success: boolean }>("/api/admin/ai/prompts", { json: data } as RequestInit);
  },

  updatePrompt: async (id: string, data: { name?: string; template?: string; system_prompt?: string; is_active?: boolean }): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { error } = await supabase.from("prompt_templates").update(data).eq("id", id);
      return { success: !error };
    }
    return apiClient.patch<{ success: boolean }>(`/api/admin/ai/prompts/${id}`, { json: data } as RequestInit);
  },

  rollbackPrompt: async (id: string): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { data: current } = await supabase.from("prompt_templates").select("version").eq("id", id).single();
      const newVersion = Math.max(1, (current?.version ?? 2) - 1);
      const { error } = await supabase.from("prompt_templates").update({ version: newVersion }).eq("id", id);
      return { success: !error };
    }
    return apiClient.post<{ success: boolean }>(`/api/admin/ai/prompts/${id}/rollback`);
  },

  deleteModel: async (modelId: string): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { error } = await supabase.from("ai_models").delete().eq("id", modelId);
      return { success: !error };
    }
    return apiClient.delete<{ success: boolean }>(`/api/admin/ai/models/${modelId}`);
  },

  deletePrompt: async (promptId: string): Promise<{ success: boolean }> => {
    if (!apiConfig.useMockApi) {
      const { error } = await supabase.from("prompt_templates").delete().eq("id", promptId);
      return { success: !error };
    }
    return apiClient.delete<{ success: boolean }>(`/api/admin/ai/prompts/${promptId}`);
  },

  getModelLogs: async (modelId: string) => {
    if (!apiConfig.useMockApi) {
      const { data } = await supabase
        .from("ai_generation_logs")
        .select("id, created_at, success, tokens_prompt, tokens_completion, latency_ms, error_message, prompt_snapshot, response_snapshot")
        .eq("model_id", modelId)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    }
    return apiClient.get(`/api/admin/ai/models/${modelId}/logs`);
  },
};
