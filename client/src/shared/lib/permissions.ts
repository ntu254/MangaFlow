import type { User } from "@/shared/auth";
import { isBoardChair, isEditorInChief } from "@/shared/auth";

export type ActionCheck = {
  ok: boolean;
  reason?: string;
};

export const IS_AUTHOR = (user: User, p: { authorId: string }) =>
  user.role === "mangaka" && p.authorId === user.id;

export const IS_EDITOR = (user: User) => user.role === "editor";

export const IS_BOARD = (user: User) => user.role === "board";
