import { useAdminAuth } from "../hooks/useAdminAuth";

interface PermissionGuardProps {
  module: string;
  action?: "read" | "write" | "delete";
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({ module, action = "read", fallback, children }: PermissionGuardProps) {
  const { hasPermission } = useAdminAuth();

  if (!hasPermission(module, action)) {
    return fallback !== undefined ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

export function RequirePermission({ module, action = "read" }: { module: string; action?: "read" | "write" | "delete" }) {
  const { hasPermission } = useAdminAuth();
  const allowed = hasPermission(module, action);

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-lg">🔒</span>
        </div>
        <h2 className="font-heading text-lg text-foreground mb-1">Access Restricted</h2>
        <p className="text-sm text-muted-foreground font-body max-w-sm">
          You don't have permission to access this section. Contact a Super Admin to request access.
        </p>
      </div>
    );
  }

  return null;
}
