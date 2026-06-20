import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getAccessToken, setTokens } from "./api";

export type Role = "admin" | "mangaka" | "editor" | "assistant" | "board";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

export const ROLES: { id: Role; label: string; jp: string }[] = [
  { id: "admin", label: "Admin", jp: "管理者" },
  { id: "mangaka", label: "Mangaka", jp: "漫画家" },
  { id: "editor", label: "Editor", jp: "担当編集" },
  { id: "assistant", label: "Assistant", jp: "アシスタント" },
  { id: "board", label: "Board", jp: "編集会議" },
];

type Ctx = {
  role: Role;
  setRole: (r: Role) => void;
  user: UserProfile | null;
  setUser: (u: UserProfile | null) => void;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
};

const RoleContext = createContext<Ctx | null>(null);
const KEY = "mangaflow.role";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("admin");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const setRole = (r: Role) => {
    setRoleState(r);
    try {
      localStorage.setItem(KEY, r);
    } catch {}
  };

  const handleLogout = async () => {
    try {
      const refreshToken =
        typeof window !== "undefined" ? localStorage.getItem("mangaflow.refresh_token") : null;
      await api.post("/auth/logout", { refreshToken });
    } catch (e) {
      // ignore — log out client-side regardless
    } finally {
      setTokens(null, null);
      setUser(null);
    }
  };

  useEffect(() => {
    // Load preferred role from localStorage (admin demo switcher).
    const stored = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (stored && ROLES.some((r) => r.id === stored)) {
      setRoleState(stored as Role);
    }

    const token = getAccessToken();
    if (token) {
      api
        .get("/auth/me")
        .then((res: any) => {
          if (res.data?.success && res.data?.data) {
            const u = res.data.data;
            setUser(u);
            const apiRole = (u.role || "").toLowerCase() as Role;
            if (ROLES.some((r) => r.id === apiRole)) {
              setRoleState(apiRole);
              try {
                localStorage.setItem(KEY, apiRole);
              } catch {}
            }
          }
        })
        .catch(() => {
          // 401 / network — interceptor handles refresh; if it still fails,
          // user stays null and routes will redirect to /login.
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        user,
        setUser,
        loading,
        isAuthenticated: !!user,
        logout: handleLogout,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}

export function roleMeta(r: Role) {
  return ROLES.find((x) => x.id === r)!;
}
