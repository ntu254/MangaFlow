import type { Role } from "@/shared/auth";
import type { AccessScope, RestrictionCode } from "./access-labels";
import { defaultScopeForRole } from "./scope-utils";

export type PermissionAction =
  | "view"
  | "vote"
  | "finalize"
  | "review"
  | "approve_submission"
  | "submit_work"
  | "manage_users"
  | "change_role"
  | "admin_override"
  | "edit_creative_file"
  | "create_assistant_task"
  | "ranking_import"
  | "payroll_mark_paid";

export type PermissionEntity = {
  ownerId?: string;
  assigneeId?: string;
  editorId?: string;
  submittedById?: string;
  isLastAdmin?: boolean;
  callbackExists?: boolean;
};

export type GuardInput = {
  role: Role;
  scope?: AccessScope;
  action: PermissionAction;
  entity?: PermissionEntity;
  currentUserId?: string;
};

export type GuardResult = {
  allowed: boolean;
  reason?: RestrictionCode;
  requiresOverride?: boolean;
};

export function canShowAction({
  role,
  scope = defaultScopeForRole(role),
  action,
  entity = {},
  currentUserId,
}: GuardInput): GuardResult {
  if (entity.callbackExists === false) return { allowed: false, reason: "CALLBACK_MISSING" };

  if (action === "view") return { allowed: true };

  if (scope === "TASK_ONLY" && !["submit_work", "view"].includes(action)) {
    return { allowed: false, reason: "TASK_ONLY_SCOPE" };
  }

  if (
    action === "approve_submission" &&
    entity.submittedById &&
    entity.submittedById === currentUserId
  ) {
    return { allowed: false, reason: "SELF_APPROVAL_BLOCKED" };
  }

  if (action === "change_role" && entity.isLastAdmin) {
    return { allowed: false, reason: "LAST_ADMIN_BLOCKED" };
  }

  if (role === "admin") {
    if (["admin_override", "manage_users", "change_role", "payroll_mark_paid"].includes(action)) {
      return { allowed: true, requiresOverride: action !== "manage_users" };
    }
    return { allowed: false, reason: "ADMIN_OVERRIDE_REQUIRED", requiresOverride: true };
  }

  if (role === "board") {
    if (["vote", "finalize"].includes(action)) return { allowed: true };
    if (
      [
        "edit_creative_file",
        "create_assistant_task",
        "payroll_mark_paid",
        "manage_users",
        "ranking_import",
      ].includes(action)
    ) {
      return { allowed: false, reason: "BOARD_REVIEW_ONLY" };
    }
  }

  if (role === "editor") {
    if (["review"].includes(action)) {
      if (entity.editorId && entity.editorId !== currentUserId)
        return { allowed: false, reason: "NOT_ASSIGNED_EDITOR" };
      return { allowed: true };
    }
    if (["vote", "manage_users", "payroll_mark_paid"].includes(action))
      return { allowed: false, reason: "ROLE_FORBIDDEN" };
  }

  if (role === "assistant") {
    if (action === "submit_work") return { allowed: true };
    return { allowed: false, reason: "TASK_ONLY_SCOPE" };
  }

  if (role === "mangaka") {
    if (["approve_submission", "review"].includes(action)) return { allowed: true };
    return { allowed: false, reason: "ROLE_FORBIDDEN" };
  }

  return { allowed: false, reason: "ROLE_FORBIDDEN" };
}
