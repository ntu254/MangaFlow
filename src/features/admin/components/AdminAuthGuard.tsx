import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm font-body text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
