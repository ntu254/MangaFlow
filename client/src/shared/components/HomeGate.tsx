import { useEffect, useState, Suspense, lazy } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { resolveAuthRoute, type SystemRole, type UserStatus } from "@/features/auth/auth-flow";
import { apiBaseUrl } from "@/shared/api";

const LandingPage = lazy(() =>
  import("@/features/landing").then(m => ({ default: m.LandingPage }))
);

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff9fb] via-[#f8f1ff] to-[#fff7ec]">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-4 border-[#eadff6] border-t-[#9065d5]" />
        <p className="text-sm text-[#5f5270]">Loading MangaFlow...</p>
      </div>
    </div>
  );
}

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

export function HomeGate() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveDestination() {
      if (!isLoaded || !isSignedIn) {
        return;
      }

      try {
        const token = await getToken();
        if (!token) return;

        // 1. Fast path: JWT claims (handles null role → onboarding)
        const payload = decodeJwtPayload(token);
        if (!cancelled) {
          setDestination(resolveAuthRoute({
            isSignedIn: true,
            user: {
              systemRole: (payload?.systemRole as SystemRole | null) ?? null,
              status: (payload?.status as UserStatus) ?? "ACTIVE"
            }
          }));
        }
        return;
      } catch {
        if (!cancelled) {
          setDestination("/app/onboarding");
        }
      }
    }

    void resolveDestination();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn]);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (isSignedIn) {
    if (destination) {
      window.location.href = destination;
    }
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <LandingPage />
    </Suspense>
  );
}
