import type { Role } from "../../../types.js";

export type AdminUserView = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  isChair: boolean;
  isEditorInChief: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export function toAdminUserView(user: any): AdminUserView {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active !== false,
    isChair: Boolean(user.isChair),
    isEditorInChief: Boolean(user.isEditorInChief),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
