import { useAuth } from "@clerk/react";
import { useState, useEffect, useCallback } from "react";
import type { SystemRole, UserStatus } from "@/features/auth/auth-flow";

type AuthClaims = {
  systemRole: SystemRole | null;
  status: UserStatus;
};

type UseAuthClaimsResult = {
  claims: AuthClaims | null;
  isLoading: boolean;
  error: string | null;
  needsFallback: boolean;
  refresh: () => Promise<void>;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function useAuthClaims(): UseAuthClaimsResult {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [claims, setClaims] = useState<AuthClaims | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsFallback, setNeedsFallback] = useState(false);

  const loadClaims = useCallback(async (skipCache = false) => {
    if (!isLoaded || !isSignedIn) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken({
        template: "mangaflow",
        skipCache
      });

      if (!token) {
        setNeedsFallback(true);
        setIsLoading(false);
        return;
      }

      const payload = decodeJwtPayload(token);
      if (!payload) {
        setNeedsFallback(true);
        setIsLoading(false);
        return;
      }

      const systemRole = payload.systemRole as SystemRole | null | undefined;
      const status = payload.status as UserStatus | undefined;

      setClaims({
        systemRole: systemRole ?? null,
        status: status ?? "ACTIVE"
      });
      setNeedsFallback(false);
    } catch (err) {
      console.warn("[useAuthClaims] Failed to decode JWT:", err);
      setNeedsFallback(true);
      setError(err instanceof Error ? err.message : "Failed to load claims");
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn, isLoaded]);

  useEffect(() => {
    void loadClaims();
  }, [loadClaims]);

  const refresh = useCallback(async () => {
    await loadClaims(true);
  }, [loadClaims]);

  return { claims, isLoading, error, needsFallback, refresh };
}
