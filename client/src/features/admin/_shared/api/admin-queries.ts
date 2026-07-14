import { type ApiRequestError } from "@/shared/api/client";

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

export const adminKeys = {
  all: ["admin"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  user: (userId: string) => [...adminKeys.all, "user", userId] as const,
};

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
