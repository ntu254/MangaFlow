import type { User } from "@/shared/auth";
import { isBoardChair } from "@/shared/auth";

export type ActionCheck = {
  ok: boolean;
  reason?: string;
};

export const OWNER_OR_ADMIN = (user: User, p: { authorId: string }) =>
  user.role === "mangaka" && p.authorId === user.id;

export const EDITOR_OR_ADMIN = (user: User) => user.role === "editor";

export const BOARD_OR_ADMIN = (user: User) => user.role === "board";
