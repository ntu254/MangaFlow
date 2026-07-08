import { AdminSidebar } from "@/features/admin/components";
import { Button, Input, SidebarProvider, SidebarTrigger } from "@/shared/ui";
import { Bell, LogOut, Search } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";

export default function AdminLayout() {
  const { session, logout } = useAdminAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-background px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="w-64 pl-9 h-9 text-sm bg-muted/50 border-border font-body"
                />
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
                  {session?.email?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-medium text-foreground font-body leading-tight">{session?.email || "Admin"}</p>
                  <p className="text-[10px] text-muted-foreground font-body capitalize">{session?.roleName?.replace("_", " ") || "Admin"}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
