import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteHeader } from "@/shared/layout/shell/site-header";
import { SiteFooter } from "@/shared/layout/shell/site-footer";

export const Route = createFileRoute("/read")({
  component: () => (
    <div className="min-h-screen bg-background bg-paper-grain" suppressHydrationWarning>
      <SiteHeader />
      <Outlet />
      <SiteFooter />
    </div>
  ),
});
