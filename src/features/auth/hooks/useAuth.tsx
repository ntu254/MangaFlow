import { authService, type AuthResult } from "@/features/auth/services/auth.service";
import { profileService } from "@/features/profile/services/profile.service";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface AuthContextType {
  session: AuthResult | null;
  user: AuthResult["user"] | null;
  role: "user" | "admin" | null;
  is_banned: boolean;
  quizCompleted: boolean;
  loading: boolean;
  refreshSession: () => Promise<AuthResult | null>;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  markQuizCompleted: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const refreshSession = useCallback(async () => {
    const current = await authService.getSession();
    setSession(current);
    return current;
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const current = await authService.getSession();
      if (!mounted) return;
      setSession(current);
      if (current?.user?.id) {
        try {
          const profile = await profileService.getProfile(current.user.id);
          if (!mounted) return;
          setQuizCompleted(profile.quiz_completed ?? false);
        } catch {
          if (!mounted) return;
          setQuizCompleted(false);
        }
      }
      setLoading(false);
    };

    bootstrap();

    const { data } = authService.onAuthStateChange(async (nextSession) => {
      setSession(nextSession);
      if (nextSession?.user?.id) {
        try {
          const profile = await profileService.getProfile(nextSession.user.id);
          setQuizCompleted(profile.quiz_completed ?? false);
        } catch {
          setQuizCompleted(false);
        }
      } else {
        setQuizCompleted(false);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const nextSession = await authService.login(email, password);
    setSession(nextSession);
    if (nextSession?.user?.id) {
      try {
        const profile = await profileService.getProfile(nextSession.user.id);
        setQuizCompleted(profile.quiz_completed ?? false);
      } catch {
        setQuizCompleted(false);
      }
    }
    return nextSession;
  }, []);

  const signup = useCallback(async (email: string, password: string, displayName?: string) => {
    const nextSession = await authService.signup(email, password, displayName);
    if (nextSession?.session?.access_token) {
      setSession(nextSession);
    }
    if (nextSession?.user?.id) {
      setQuizCompleted(false);
    }
    return nextSession;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setSession(null);
    setQuizCompleted(false);
  }, []);

  const markQuizCompleted = useCallback(() => {
    setQuizCompleted(true);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      role: session?.role ?? null,
      is_banned: session?.is_banned ?? false,
      quizCompleted,
      loading,
      refreshSession,
      login,
      signup,
      logout,
      markQuizCompleted,
    }),
    [loading, login, logout, refreshSession, session, signup, quizCompleted, markQuizCompleted],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}