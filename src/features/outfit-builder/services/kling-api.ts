import { supabase } from "@/shared/lib";

export class KlingApiError extends Error {
  code?: number;
  requestId?: string;

  constructor(message: string, options?: { code?: number; requestId?: string }) {
    super(message);
    this.name = "KlingApiError";
    this.code = options?.code;
    this.requestId = options?.requestId;
  }
}

export interface KlingTaskResult {
  taskId: string;
  taskStatus: string;
  taskStatusMsg?: string;
  images?: { index: number; url: string }[];
  createdAt: number;
  updatedAt: number;
}

export const klingApi = {
  createTryOnTask: async (humanImage: string, clothImage: string): Promise<{ taskId: string }> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const { data, error } = await supabase.functions.invoke("tryon", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: {
        action: "create",
        human_image: humanImage,
        cloth_image: clothImage,
      },
    });

    if (error) throw new KlingApiError(error.message);
    if (data?.error) throw new KlingApiError(data.error);

    const taskId = data?.data?.task_id;
    if (!taskId) throw new KlingApiError("No task_id returned from server");

    return { taskId };
  },

  getTaskStatus: async (taskId: string): Promise<KlingTaskResult> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const { data, error } = await supabase.functions.invoke("tryon", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: {
        action: "status",
        task_id: taskId,
      },
    });

    if (error) throw new KlingApiError(error.message);
    if (data?.error) throw new KlingApiError(data.error);

    const result = data?.data;
    return {
      taskId: result?.task_id || taskId,
      taskStatus: result?.task_status || "unknown",
      taskStatusMsg: result?.task_status_msg,
      images: result?.task_result?.images,
      createdAt: result?.created_at || 0,
      updatedAt: result?.updated_at || 0,
    };
  },
};
