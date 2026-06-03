import { useEffect, useState, Suspense, lazy } from "react";
import { useAuth } from "@clerk/react";
import { resolveAuthRoute } from "@/features/auth/auth-flow";
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

export function HomeGate() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function syncAndRedirect() {
      if (!isLoaded || !isSignedIn) {
        return;
      }

      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch(`${apiBaseUrl}/auth/sync-user`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const body = await response.json();

        if (cancelled) return;

        if (response.ok && body.success) {
          const redirect = resolveAuthRoute({
            isSignedIn: true,
            user: body.data.user
          });
          setDestination(redirect);
        } else {
          setDestination("/app/onboarding");
        }
      } catch {
        if (!cancelled) {
          setDestination("/app/onboarding");
        }
      }
    }

    void syncAndRedirect();

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
      <LandingPage clerkConfigured />
    </Suspense>
  );
}
