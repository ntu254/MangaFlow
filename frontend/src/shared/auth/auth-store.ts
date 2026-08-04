import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearApiTokens, registerUnauthorizedHandler } from "@/shared/api/client";
import { loginDemoRole, loginWithPassword, logoutLive as apiLogoutLive } from "@/shared/api/auth";

const WEB_ROLES = ["admin", "mangaka", "assistant", "editor", "board"] as const;

export type Role = (typeof WEB_ROLES)[number];

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  isChair?: boolean;
};

type AuthState = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
};

const AUTH_STORAGE_KEY = "beachread-auth";

function isRole(value: unknown): value is Role {
  return typeof value === "string" && WEB_ROLES.includes(value as Role);
}

function isPersistedUser(value: unknown): value is User {
  if (value === null || typeof value !== "object") return false;
  const user = value as Partial<User>;
  return (
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.email === "string" &&
    isRole(user.role)
  );
}

/**
 * Read the persisted auth snapshot used by route guards.
 *
 * Route guards run before React mounts, so they cannot rely on a hook. Keeping
 * parsing and validation here prevents each route from coupling itself to the
 * Zustand storage format and makes malformed browser state fail closed.
 */
export function getPersistedAuthUser(): User | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") return null;
    const state = (parsed as { state?: unknown }).state;
    if (state === null || typeof state !== "object") return null;
    const user = (state as { user?: unknown }).user;
    return isPersistedUser(user) ? user : null;
  } catch {
    return null;
  }
}

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

export const MANGAKAS: User[] = [
  { id: "u-mangaka", name: "Inoue Takehiko", email: "inoue@beachread.jp", role: "mangaka" },
];

export function findUserById(id: string): User | undefined {
  if (id === "u-admin")
    return { id: "u-admin", name: "Hayashi Admin", email: "admin@beachread.jp", role: "admin" };
  if (id === "u-editor")
    return {
      id: "u-editor",
      name: "Tanaka Akira",
      email: "tanaka@beachread.jp",
      role: "editor",
    };
  return (
    BOARD_MEMBERS.find((u) => u.id === id) ??
    ASSISTANTS.find((u) => u.id === id) ??
    MANGAKAS.find((u) => u.id === id)
  );
}

/**
 * Chair check for the current user.
 *
 * The live API carries `isChair` on the user profile, so that takes
 * precedence. The static demo list is only a fallback for demo users.
 */
export function isBoardChair(userId: string) {
  const current = useAuth.getState().user;
  if (current && current.id === userId && typeof current.isChair === "boolean") {
    return current.isChair;
  }
  return BOARD_MEMBERS.find((m) => m.id === userId)?.isChair === true;
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
    { name: AUTH_STORAGE_KEY },
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
  admin: "Full system access, user management, and earnings tracking",
  mangaka: "Creator: submits series proposals and leads production",
  assistant: "Assistant: receives tasks, submits work, and tracks earnings",
  editor: "Editor: reviews proposals, chapters, and publication readiness",
  board: "Board: votes on proposals, governance, and ranking analytics",
};

registerUnauthorizedHandler(() => {
  useAuth.getState().logout();
});
