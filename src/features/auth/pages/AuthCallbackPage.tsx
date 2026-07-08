import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/shared/lib";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const isLinking = searchParams.get("linking") === "true";
  const oauthError = searchParams.get("error") || searchParams.get("error_code");
  const oauthErrorDescription = searchParams.get("error_description") || "Đăng nhập đã bị hủy hoặc hết hạn.";

  useEffect(() => {
    let cancelled = false;

    if (oauthError) {
      navigate("/login", { replace: true, state: { oauthError: oauthErrorDescription } });
      return;
    }

    const handleCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) throw new Error("Không tìm thấy phiên đăng nhập");

        const user = session.user;
        const metadata = user.user_metadata || {};

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, quiz_completed")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          await supabase.from("profiles").upsert({
            id: user.id,
            email: user.email ?? "",
            display_name: metadata.full_name ?? metadata.name ?? user.email?.split("@")[0] ?? "",
            avatar_url: metadata.avatar_url ?? metadata.picture ?? metadata.avatar ?? null,
            preferred_styles: [],
            preferred_occasions: [],
            fashion_preferences: {},
          });

          if (!cancelled) navigate("/quiz", { replace: true });
        } else if (isLinking) {
          if (!cancelled) navigate("/profile", { replace: true });
        } else {
          // Navigate directly to the app rather than "/" to avoid a flash
          // through the landing page while QuizRedirectHandler processes.
          if (!cancelled) navigate("/recommender", { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
          setTimeout(() => navigate("/login", { replace: true }), 3000);
        }
      }
    };

    handleCallback();
    return () => { cancelled = true; };
  }, [navigate, isLinking, oauthError, oauthErrorDescription]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="soft-panel p-8 max-w-sm text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Đăng nhập thất bại</h2>
          <p className="font-body text-sm text-foreground/50 mb-4">{error}</p>
          <p className="font-body text-xs text-foreground/30">Tự động chuyển về trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-accent" />
          <span className="font-heading text-xl font-semibold text-foreground">Redo</span>
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
        <p className="font-body text-sm text-foreground/60">
          {isLinking ? "Đang liên kết tài khoản..." : "Đang xác thực tài khoản..."}
        </p>
      </div>
    </div>
  );
}
