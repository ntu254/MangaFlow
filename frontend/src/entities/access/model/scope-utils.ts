import type { Role, User } from "@/shared/auth";
import type { AccessScope } from "./access-labels";

export function defaultScopeForRole(role: Role): AccessScope {
  if (role === "admin") return "GLOBAL";
  if (role === "board") return "BOARD_REVIEW_ONLY";
  if (role === "editor") return "EDITORIAL_QUEUE";
  if (role === "assistant") return "TASK_ONLY";
  return "OWNER";
}

export function scopeForUser(
  user: User | null | undefined,
  explicitScope?: AccessScope,
): AccessScope {
  if (explicitScope) return explicitScope;
  if (!user) return "READ_ONLY";
  return defaultScopeForRole(user.role);
}

export function roleCanInspect(role: Role) {
  return role === "admin" || role === "editor" || role === "board";
}
