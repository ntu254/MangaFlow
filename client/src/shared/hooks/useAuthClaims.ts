import { useAuth } from "@/shared/hooks/useAuth";
import { useState, useEffect, useCallback } from "react";
import { apiBaseUrl } from "@/shared/api";
import type { SystemRole, UserStatus } from "@/features/auth/auth-flow";

type AuthClaims = {
  systemRole: SystemRole | null;
  status: UserStatus;
};

type UseAuthClaimsResult = {
  claims: AuthClaims | null;
  isLoading: boolean;
  error: string | null;
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

  const loadClaims = useCallback(async (skipCache = false) => {
    if (!isLoaded || !isSignedIn) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      // 1. Fast path: try JWT claims
      const payload = decodeJwtPayload(token);
      const jwtSystemRole = payload?.systemRole as SystemRole | null | undefined;
      const jwtStatus = payload?.status as UserStatus | undefined;

      if (jwtSystemRole) {
        setClaims({ systemRole: jwtSystemRole, status: jwtStatus ?? "ACTIVE" });
        setIsLoading(false);
        return;
      }

      // 2. Slow path: fetch from DB via /auth/me
      const response = await fetch(`${apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const body = await response.json();
        if (body.success && body.data) {
          setClaims({
            systemRole: body.data.systemRole ?? null,
            status: body.data.status ?? "ACTIVE"
          });
          setIsLoading(false);
          return;
        }
      }

      // 3. /auth/me failed (404 = user not synced yet)
      setClaims({ systemRole: null, status: "ACTIVE" });
    } catch (err) {
      console.warn("[useAuthClaims] Failed to load claims:", err);
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

  return { claims, isLoading, error, refresh };
}
