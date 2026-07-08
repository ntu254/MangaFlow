import { supabase } from "@/shared/lib";
import { apiClient } from "@/shared/api";
import { apiConfig } from "@/shared/api/config";

export type AdminRoleName = "super_admin" | "admin" | "moderator" | "finance";

export interface AdminSession {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  roleId: string;
  roleName: AdminRoleName;
  permissions: AdminPermission[];
}

export interface AdminPermission {
  module: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

interface AdminLoginResponse {
  session: AdminSession;
  token: string;
}

function buildSessionFromAdminUser(adminUser: Record<string, unknown>, authUser: { id: string; email?: string }, roleName: string, permissions: AdminPermission[]): AdminSession {
  return {
    id: adminUser.id as string,
    userId: authUser.id,
    email: authUser.email ?? "",
    displayName: roleName,
    roleId: adminUser.role_id as string,
    roleName: roleName as AdminRoleName,
    permissions,
  };
}

export const adminAuthService = {
  login: async (email: string, password: string) => {
    if (apiConfig.useMockApi) {
      return apiClient.post<AdminLoginResponse>("/api/admin/auth/login", {
        json: { email, password },
      });
    }
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;

    const { data: adminUsers, error: adminError } = await supabase.rpc("is_admin_user");
    const adminUser = adminUsers?.[0] ?? null;
    if (adminError || !adminUser) throw new Error("Unauthorized: not an admin");
    if (!adminUser.is_active) throw new Error("Account disabled");

    const { data: roleData } = await supabase
      .from("admin_roles")
      .select("name")
      .eq("id", adminUser.role_id)
      .single();

    const { data: perms } = await supabase
      .from("admin_permissions")
      .select("module, can_read, can_write, can_delete")
      .eq("role_id", adminUser.role_id);

    const roleName = (roleData?.name ?? "admin") as AdminRoleName;
    const permissions: AdminPermission[] = perms?.map((p) => ({
      module: p.module,
      canRead: p.can_read,
      canWrite: p.can_write,
      canDelete: p.can_delete,
    })) ?? [];

    const session = buildSessionFromAdminUser(adminUser, authData.user, roleName, permissions);
    return { session, token: authData.session?.access_token ?? "" };
  },

  logout: async () => {
    if (apiConfig.useMockApi) {
      return apiClient.post("/api/admin/auth/logout");
    }
    await supabase.auth.signOut();
  },

  getSession: () => {
    const stored = sessionStorage.getItem("admin_session");
    if (!stored) return null;
    try { return JSON.parse(stored) as AdminSession; }
    catch { return null; }
  },

  saveSession: (session: AdminSession) => {
    sessionStorage.setItem("admin_session", JSON.stringify(session));
  },

  clearSession: () => {
    sessionStorage.removeItem("admin_session");
  },

  logAudit: async (action: string, entityType?: string, entityId?: string, details?: Record<string, unknown>) => {
    if (apiConfig.useMockApi) {
      return apiClient.post("/api/admin/audit-log", {
        json: { action, entityType, entityId, details },
      });
    }
    const session = adminAuthService.getSession();
    if (!session) return;
    await supabase.from("admin_audit_logs").insert({
      admin_id: session.id,
      action,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      details: details ?? null,
    });
  },

  hasPermission: (session: AdminSession | null, module: string, action: "read" | "write" | "delete"): boolean => {
    if (!session) return false;
    if (session.roleName === "super_admin") return true;
    const perm = session.permissions.find((p) => p.module === module);
    if (!perm) return false;
    if (action === "read") return perm.canRead;
    if (action === "write") return perm.canWrite;
    if (action === "delete") return perm.canDelete;
    return false;
  },
};
