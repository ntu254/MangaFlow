import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, is_banned } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (is_banned) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="font-heading text-xl font-semibold text-foreground mb-2">Tài khoản đã bị vô hiệu hóa</h1>
          <p className="text-sm text-muted-foreground font-body">
            Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
