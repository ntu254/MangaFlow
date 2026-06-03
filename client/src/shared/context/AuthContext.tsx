import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiBaseUrl } from "@/shared/api";
import { getAuthToken, fetchCurrentUser } from "@/shared/api/client";
import type { SystemRole, UserStatus } from "@/features/auth/auth-flow";

type AuthUser = {
  id: string;
  clerkId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  systemRole: SystemRole | null;
  status: UserStatus;
};

type AuthContextValue = {
  getToken: (opts?: { template?: string; skipCache?: boolean }) => Promise<string | null>;
  isSignedIn: boolean;
  isLoaded: boolean;
  user: AuthUser | null;
  signOut: () => void;
  refreshUser: () => Promise<void>;
};

const TOKEN_KEY = "mangaflow_auth_token";

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    const exp = payload.exp as number | undefined;
    if (!exp) return true;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const getToken = useCallback(async (_opts?: { template?: string; skipCache?: boolean }): Promise<string | null> => {
    const token = getStoredToken();
    if (!token) return null;
    if (isTokenExpired(token)) {
      removeToken();
      setUser(null);
      return null;
    }
    return token;
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (!token || isTokenExpired(token)) {
        removeToken();
        setUser(null);
        setIsLoaded(true);
        return;
      }
      const userData = await fetchCurrentUser(token);
      if (userData) {
        setUser({
          id: userData.id,
          clerkId: userData.clerkId,
          email: userData.email,
          fullName: userData.fullName,
          avatarUrl: userData.avatarUrl,
          systemRole: userData.systemRole as SystemRole | null,
          status: userData.status as UserStatus,
        });
      } else {
        removeToken();
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const signOut = useCallback(() => {
    removeToken();
    setUser(null);
    window.location.href = "/";
  }, []);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  const value: AuthContextValue = {
    getToken,
    isSignedIn: !!user,
    isLoaded,
    user,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}

export function setAuthToken(token: string): void {
  storeToken(token);
}

export { getStoredToken, removeToken };
