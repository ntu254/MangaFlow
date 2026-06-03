import { useEffect, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { exchangeGoogleCode } from "@/shared/api/auth";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff9fb] via-[#f8f1ff] to-[#fff7ec]">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-4 border-[#eadff6] border-t-[#9065d5]" />
        <p className="text-sm text-[#5f5270]">Completing sign in...</p>
      </div>
    </div>
  );
}

function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff9fb] via-[#f8f1ff] to-[#fff7ec]">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#2f243a] mb-2">Sign In Failed</h2>
        <p className="text-sm text-[#5f5270] mb-4">Unable to complete sign in. Please try again.</p>
        <a
          href="/sign-in"
          className="inline-flex px-4 py-2 bg-[#9065d5] text-white rounded-xl text-sm font-semibold"
        >
          Try Again
        </a>
      </div>
    </div>
  );
}

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error || !code) {
        if (!cancelled) setStatus("error");
        return;
      }

      const token = await exchangeGoogleCode(code);
      if (cancelled) return;

      if (token) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    }

    void handleCallback();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (status === "success") {
    return <Navigate to="/" replace />;
  }

  if (status === "error") {
    return <ErrorPage />;
  }

  return <LoadingScreen />;
}
