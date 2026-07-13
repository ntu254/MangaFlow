import { isUnauthorizedApiError, type ApiRequestError } from "@/shared/api/client";
import { adminApi } from "@/shared/api/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  isChair?: boolean;
  isEditorInChief?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EarningItem {
  id: string;
  earningId: string;
  taskId: string;
  taskTitle: string;
  series: string;
  chapter: string;
  taskType: string;
  approvedAt: string;
  rate: number;
  amount: number;
  status: "PENDING" | "APPROVED" | "VOIDED";
}

export interface Earning {
  id: string;
  assistantId: string;
  period: string;
  tasksCount: number;
  subtotal: number;
  bonusPenalty: number;
  amount: number;
  currency: string;
  status: "PENDING" | "CONFIRMED" | "PAID" | "VOIDED";
  createdAt?: string;
  updatedAt?: string;
  items?: EarningItem[];
}

export const adminKeys = {
  all: ["admin"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  user: (userId: string) => [...adminKeys.all, "user", userId] as const,
};

function retryAdminQuery(failureCount: number, error: Error) {
  if (isUnauthorizedApiError(error)) return false;
  return failureCount < 2;
}

export function mapAdminError(err: unknown): string {
  if (err instanceof Error) {
    const apiError = err as ApiRequestError;
    if (apiError.status === 401) return "Session expired. Please sign in again.";
    if (apiError.status === 403) return "You do not have permission for this action.";

    const msg = err.message;
    if (msg.includes("FORBIDDEN")) return "You do not have permission to perform this action.";
    if (msg.includes("NOT_FOUND")) return "Record not found.";
    if (msg.includes("INVALID_STATUS")) return "The current status does not allow this action.";
    if (msg.includes("PROTECTED_FIELD")) return "This field cannot be edited.";
    return msg;
  }
  return "An unknown error occurred.";
}

/** Demo tooling: reset (reseed) or clear all transactional data, keeping users. */
export function useDemoDataMutation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, "reset" | "clear">({
    mutationFn: (mode) => (mode === "reset" ? adminApi.resetDemo() : adminApi.clearDemo()),
    onSuccess: () => {
      // Wipe all cached data so the UI reflects the fresh demo state.
      queryClient.invalidateQueries();
    },
  });
}
