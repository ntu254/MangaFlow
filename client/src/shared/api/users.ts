import { api, unwrap } from "./_client";
import type { ServerRole } from "./auth";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  team?: string;
  notes?: string;
  role: ServerRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  displayName?: string;
  team?: string;
  notes?: string;
  role: ServerRole;
  isActive?: boolean;
}

export const usersApi = {
  list: () => api.get("/admin/users").then(unwrap<AdminUser[]>),

  create: (body: CreateUserInput) =>
    api.post("/admin/users", body).then(unwrap<AdminUser>),

  update: (userId: string, body: Partial<CreateUserInput>) =>
    api.patch(`/admin/users/${userId}`, body).then(unwrap<AdminUser>),

  updateRole: (userId: string, role: ServerRole) =>
    api.patch(`/admin/users/${userId}/role`, { role }).then(unwrap<AdminUser>),

  updateStatus: (userId: string, isActive: boolean) =>
    api.patch(`/admin/users/${userId}/status`, { isActive }).then(unwrap<AdminUser>),

  delete: (userId: string) =>
    api.delete(`/admin/users/${userId}`).then(unwrap<AdminUser>),
};
