import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SystemRole } from "../constants/roles";
import type { AuthRouteUser } from "@/features/auth/auth-flow";

export type RoleGuardProps = {
  user: AuthRouteUser | null;
  allowedRoles: SystemRole[];
  children: React.ReactNode;
};

export function RoleGuard({ user, allowedRoles, children }: RoleGuardProps) {
  if (!user || !user.systemRole || !allowedRoles.includes(user.systemRole as SystemRole)) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold tracking-tight mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          You do not have the required permissions to view this page. If you believe this is a mistake, please contact support or your administrator.
        </p>
        <Link to="/">
          <Button variant="default">Return to Home</Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
