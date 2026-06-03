import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { fetchCurrentUser, getStoredToken, setAuthToken, apiBaseUrl } from "@/shared/api/client";
import type { SystemRole, UserStatus } from "@/features/auth/auth-flow";

type AuthUser = {
  id: string;
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
  login: (email: string, password: string) => Promise<{ user: AuthUser; auth: { redirectTo: string } }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const getToken = useCallback(async (_opts?: { template?: string; skipCache?: boolean }): Promise<string | null> => {
    return getStoredToken();
  }, []);

  const loadUser = useCallback(async () => {
    // Only attempt to fetch user profile if we have a stored token
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsLoaded(true);
      return;
    }
    try {
      const userData = await fetchCurrentUser();
      if (userData) {
        setUser({
          id: userData.id,
          email: userData.email,
          fullName: userData.fullName,
          avatarUrl: userData.avatarUrl,
          systemRole: userData.systemRole as SystemRole | null,
          status: userData.status as UserStatus,
        });
      } else {
        setUser(null);
        setAuthToken(null); // clear invalid/expired token
      }
    } catch {
      setUser(null);
      setAuthToken(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Failed to log in");
    }

    const { token, user: userData, auth } = json.data;
    setAuthToken(token);
    const authedUser: AuthUser = {
      id: userData.id,
      email: userData.email,
      fullName: userData.fullName,
      avatarUrl: userData.avatarUrl,
      systemRole: userData.systemRole as SystemRole | null,
      status: userData.status as UserStatus,
    };
    setUser(authedUser);

    return { user: authedUser, auth };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch(`${apiBaseUrl}/auth/logout`, { method: "POST", credentials: "include" });
    } catch (e) {
      // ignore
    }
    setAuthToken(null);
    setUser(null);
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
    login,
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
