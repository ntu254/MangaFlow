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

export interface AdminBoardMember {
  userId: string;
  email?: string;
  name?: string;
  role?: ServerRole;
  isUserActive: boolean;
  isActive: boolean;
  isChair: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const usersApi = {
  list: () => api.get("/admin/users").then(unwrap<AdminUser[]>),

  create: (body: CreateUserInput) => api.post("/admin/users", body).then(unwrap<AdminUser>),

  update: (userId: string, body: Partial<CreateUserInput>) =>
    api.patch(`/admin/users/${userId}`, body).then(unwrap<AdminUser>),

  updateRole: (userId: string, role: ServerRole) =>
    api.patch(`/admin/users/${userId}/role`, { role }).then(unwrap<AdminUser>),

  updateStatus: (userId: string, isActive: boolean) =>
    api.patch(`/admin/users/${userId}/status`, { isActive }).then(unwrap<AdminUser>),

  delete: (userId: string) => api.delete(`/admin/users/${userId}`).then(unwrap<AdminUser>),
};

export const boardMembersApi = {
  list: () => api.get("/admin/board-members").then(unwrap<AdminBoardMember[]>),

  add: (userId: string) =>
    api.post("/admin/board-members", { userId }).then(unwrap<AdminBoardMember>),

  updateStatus: (userId: string, isActive: boolean) =>
    api.patch(`/admin/board-members/${userId}/status`, { isActive }).then(unwrap<AdminBoardMember>),

  setChair: (userId: string) =>
    api
      .patch(`/admin/board-members/${userId}/chair`, { isChair: true })
      .then(unwrap<AdminBoardMember>),
};
