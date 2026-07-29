import type { User } from "@/shared/auth";
import { isBoardChair, isEditorInChief } from "@/shared/auth";

export type ActionCheck = {
  ok: boolean;
  reason?: string;
};

export const OWNER_OR_ADMIN = (user: User, p: { authorId: string }) =>
  user.role === "admin" || (user.role === "mangaka" && p.authorId === user.id);

export const EDITOR_OR_ADMIN = (user: User) => user.role === "editor" || user.role === "admin";

export const BOARD_OR_ADMIN = (user: User) => user.role === "board" || user.role === "admin";
