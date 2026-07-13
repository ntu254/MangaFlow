import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearApiTokens, registerUnauthorizedHandler } from "@/shared/api/client";
import { loginDemoRole, loginWithPassword, logoutLive as apiLogoutLive } from "@/shared/api/auth";

export type Role = "admin" | "mangaka" | "assistant" | "editor" | "board";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  isChair?: boolean;
  isEditorInChief?: boolean;
};

type AuthState = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
};

const DEMO_USERS: Record<Role, User> = {
  admin: { id: "u-admin", name: "Hayashi Admin", email: "admin@beachread.jp", role: "admin" },
  mangaka: {
    id: "u-mangaka",
    name: "Inoue Takehiko",
    email: "inoue@beachread.jp",
    role: "mangaka",
  },
  assistant: { id: "u-assist", name: "Suzuki Jun", email: "jun@beachread.jp", role: "assistant" },
  editor: {
    id: "u-editor",
    name: "Tanaka Akira",
    email: "tanaka@beachread.jp",
    role: "editor",
    isEditorInChief: true,
  },
  board: {
    id: "u-board",
    name: "Yamamoto Director",
    email: "board@beachread.jp",
    role: "board",
    isChair: true,
  },
};

export const BOARD_MEMBERS: User[] = [
  {
    id: "u-board",
    name: "Yamamoto Director",
    email: "board@beachread.jp",
    role: "board",
    isChair: true,
  },
  { id: "u-board-2", name: "Sato Eriko", email: "sato@beachread.jp", role: "board" },
  { id: "u-board-3", name: "Kobayashi Ren", email: "kobayashi@beachread.jp", role: "board" },
  { id: "u-board-4", name: "Watanabe Kaoru", email: "watanabe@beachread.jp", role: "board" },
  { id: "u-board-5", name: "Mori Haruto", email: "mori@beachread.jp", role: "board" },
];

export const ASSISTANTS: User[] = [
  { id: "u-assist", name: "Suzuki Jun", email: "jun@beachread.jp", role: "assistant" },
  { id: "u-assist-2", name: "Nakamura Hina", email: "hina@beachread.jp", role: "assistant" },
  { id: "u-assist-3", name: "Ito Daichi", email: "daichi@beachread.jp", role: "assistant" },
];

export const EDITORS: User[] = [
  {
    id: "u-editor",
    name: "Tanaka Akira",
    email: "tanaka@beachread.jp",
    role: "editor",
    isEditorInChief: true,
  },
  {
    id: "u-mobile-editor",
    name: "Mobile Editor",
    email: "editor@mangaflow.local",
    role: "editor",
  },
];

export const MANGAKAS: User[] = [
  { id: "u-mangaka", name: "Inoue Takehiko", email: "inoue@beachread.jp", role: "mangaka" },
];

export function findUserById(id: string): User | undefined {
  if (id === "u-admin")
    return { id: "u-admin", name: "Hayashi Admin", email: "admin@beachread.jp", role: "admin" };
  return (
    EDITORS.find((u) => u.id === id) ??
    BOARD_MEMBERS.find((u) => u.id === id) ??
    ASSISTANTS.find((u) => u.id === id) ??
    MANGAKAS.find((u) => u.id === id)
  );
}

export function isBoardChair(userId: string) {
  return BOARD_MEMBERS.find((m) => m.id === userId)?.isChair === true;
}

export function isEditorInChief(user: { isEditorInChief?: boolean } | null | undefined): boolean {
  return user?.isEditorInChief === true;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => {
        clearApiTokens();
        set({ user: null });
      },
    }),
    { name: "beachread-auth" },
  ),
);

export function loginAsRole(role: Role) {
  useAuth.getState().login(DEMO_USERS[role]);
}

export function loginAsUser(user: User) {
  useAuth.getState().login(user);
}

export async function loginAsRoleLive(role: Role) {
  const user = await loginDemoRole(role);
  useAuth.getState().login(user);
  return user;
}

export async function loginWithCredentials(email: string, password: string) {
  const user = await loginWithPassword(email, password);
  useAuth.getState().login(user);
  return user;
}

export async function logoutLive() {
  try {
    await apiLogoutLive();
  } finally {
    useAuth.getState().logout();
  }
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  mangaka: "Mangaka",
  assistant: "Assistant",
  editor: "Editor",
  board: "Board",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  admin: "Account, role, and access management",
  mangaka: "Author: submit series proposals and lead production",
  assistant: "Assistant: receive tasks, submit work, and track earnings",
  editor: "Editor: review proposals, final chapter review, and publication",
  board: "Board: vote on proposals, governance, and ranking analytics",
};

registerUnauthorizedHandler(() => {
  useAuth.getState().logout();
});
