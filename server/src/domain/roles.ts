import type { AuthUser, Role, WebRole } from "../types.js";

export const webToApiRole: Record<WebRole, Role> = {
  admin: "ADMIN",
  mangaka: "MANGAKA",
  assistant: "ASSISTANT",
  editor: "EDITOR",
  board: "BOARD"
};

export const apiToWebRole: Record<Role, WebRole> = {
  ADMIN: "admin",
  MANGAKA: "mangaka",
  ASSISTANT: "assistant",
  EDITOR: "editor",
  BOARD: "board"
};

export function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  isChair?: boolean;
  isEditorInChief?: boolean;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isChair: user.isChair,
    isEditorInChief: user.isEditorInChief
  };
}

export function canMutate(role: Role, allowed: Role[]) {
  return role === "ADMIN" || allowed.includes(role);
}
