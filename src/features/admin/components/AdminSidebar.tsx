import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/ui";
import {
  BarChart3,
  Brain,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Settings,
  ShoppingBag,
  TrendingUp,
  Users,
  Zap,
  ClipboardList,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, module: "dashboard" },
  { title: "Users", url: "/admin/users", icon: Users, module: "users" },
  { title: "AI Engine", url: "/admin/ai-engine", icon: Brain, module: "ai_engine" },
  { title: "Products", url: "/admin/products", icon: ShoppingBag, module: "products" },
  { title: "Trends & Content", url: "/admin/trends", icon: TrendingUp, module: "trends" },
  { title: "Plans & Billing", url: "/admin/plans", icon: CreditCard, module: "plans" },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3, module: "analytics" },
  { title: "Notifications", url: "/admin/notifications", icon: Megaphone, module: "notifications" },
  { title: "Reports", url: "/admin/feedback", icon: MessageSquare, module: "reports" },
  { title: "Survey", url: "/admin/survey", icon: ClipboardList, module: "reports" },
  { title: "Settings", url: "/admin/settings", icon: Settings, module: "settings" },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { session, hasPermission } = useAdminAuth();

  const visibleItems = navItems.filter((item) => hasPermission(item.module, "read"));
  const isActive = (url: string) =>
    url === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(url);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-background"
    >
      <SidebarHeader className="p-4 border-b border-border">
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 text-accent-foreground" />
          </div>
          {!collapsed && (
            <span className="font-body font-semibold text-sm tracking-tight text-foreground">
              Redo Admin
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-body transition-colors",
                        isActive(item.url)
                          ? "bg-accent/10 text-accent font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border">
        {!collapsed && session && (
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">
              {session.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate capitalize">
                {session.roleName.replace("_", " ")}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session.email}
              </p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
