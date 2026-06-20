import { Link, useRouterState } from "@tanstack/react-router";
import { useSidebar } from "@/layouts/SidebarContext";
import { useRole, type Role } from "@/shared/lib/role";
import { Logo } from "@/shared/ui/site/Logo";
import { currentUserByRole } from "@/entities";
import {
  LayoutDashboard,
  BookOpen,
  Inbox,
  Vote,
  ListChecks,
  CheckCircle2,
  CalendarClock,
  Wallet,
  Trophy,
  Users as UsersIcon,
  Shield,
  Settings,
  BookOpenCheck,
  Plus,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { ComponentType } from "react";

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  roles: Role[];
  badge?: string;
};

const NAV: NavItem[] = [
  {
    to: "/app/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "mangaka", "editor", "board"],
  },
  {
    to: "/app/series",
    label: "My Series",
    icon: BookOpen,
    roles: ["admin", "mangaka", "editor", "board"],
  },
  { to: "/app/review", label: "Review Queue", icon: Inbox, roles: ["editor", "admin", "mangaka"], badge: "12" },
  { to: "/app/editor/series-review", label: "Editor: Series review", icon: Inbox, roles: ["editor", "admin"] },
  { to: "/app/board/series-review", label: "Board: Series vote", icon: Vote, roles: ["board", "admin"] },
  { to: "/app/notifications", label: "Notifications", icon: Bell, roles: ["admin", "mangaka", "editor", "board"] },
  {
    to: "/read",
    label: "Reader Preview",
    icon: BookOpenCheck,
    roles: ["admin", "mangaka", "editor", "board"],
  },
];

const PROD_NAV: NavItem[] = [
  { to: "/app/tasks", label: "Task Overview", icon: ListChecks, roles: ["mangaka"] },
  { to: "/app/board", label: "Board voting", icon: Vote, roles: ["board", "editor", "admin"] },
  { to: "/app/submissions", label: "Submissions", icon: CheckCircle2, roles: ["editor", "admin"] },
  { to: "/app/publications", label: "Publications", icon: CalendarClock, roles: ["editor", "admin"] },
  { to: "/app/rankings", label: "Rankings", icon: Trophy, roles: ["board", "editor", "admin", "mangaka"] },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/app/payroll", label: "Payroll", icon: Wallet, roles: ["admin", "editor"] },
  { to: "/app/admin/users", label: "Users", icon: UsersIcon, roles: ["admin"] },
  { to: "/app/admin/roles", label: "Roles & types", icon: Shield, roles: ["admin"] },
  {
    to: "/app/settings",
    label: "Settings",
    icon: Settings,
    roles: ["admin", "mangaka", "editor", "assistant", "board"],
  },
];

// Dedicated worker-view menu — assistants only see this scope.
const ASSISTANT_NAV: NavItem[] = [
  { to: "/app/assistant/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["assistant"] },
  { to: "/app/assistant/tasks", label: "My Tasks", icon: ListChecks, roles: ["assistant"] },
  { to: "/app/assistant/submissions", label: "My Submissions", icon: CheckCircle2, roles: ["assistant"] },
  { to: "/app/assistant/earnings", label: "Earnings", icon: Wallet, roles: ["assistant"] },
  { to: "/app/assistant/notifications", label: "Notifications", icon: Bell, roles: ["assistant"] },
  { to: "/app/assistant/series", label: "My Series", icon: BookOpen, roles: ["assistant"] },
];

export function Sidebar() {
  const { role } = useRole();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const me = currentUserByRole[role];
  const { collapsed, setCollapsed } = useSidebar();

  const isAssistant = role === "assistant";
  const visible = isAssistant
    ? ASSISTANT_NAV
    : NAV.filter((n) => n.roles.includes(role));
  const prod = isAssistant ? [] : PROD_NAV.filter((n) => n.roles.includes(role));
  const admin = isAssistant
    ? ADMIN_NAV.filter((n) => n.to === "/app/settings")
    : ADMIN_NAV.filter((n) => n.roles.includes(role));

  return (
    <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-background border-r border-border text-foreground md:flex transition-all duration-300 ease-in-out ${collapsed ? "w-[68px]" : "w-[240px]"}`}>
      <div className={`flex items-center py-5 ${collapsed ? "justify-center px-0" : "justify-between px-5"}`}>
        {!collapsed && <Logo />}
        {collapsed && <div className="font-bold text-lg leading-none tracking-tighter">MF</div>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="text-foreground/50 hover:text-foreground transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className={`flex-1 overflow-y-auto py-2 scrollbar-hide ${collapsed ? "px-2" : "px-3"}`}>
        <Section label={isAssistant ? "Worker" : "Workspace"} collapsed={collapsed} />
        {visible.map((n) => (
          <Item key={n.to} item={n} active={isActive(pathname, n.to)} collapsed={collapsed} />
        ))}
        {prod.length > 0 && (
          <>
            <Section label="Production" className="mt-4" collapsed={collapsed} />
            {prod.map((n) => (
              <Item key={n.to} item={n} active={isActive(pathname, n.to)} collapsed={collapsed} />
            ))}
          </>
        )}
        {admin.length > 0 && (
          <>
            <Section label="System" className="mt-4" collapsed={collapsed} />
            {admin.map((n) => (
              <Item key={n.to} item={n} active={isActive(pathname, n.to)} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>

      {role === "mangaka" && (
        <div className={`py-2 ${collapsed ? "px-2" : "px-4"}`}>
          {collapsed ? (
            <button className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground transition-colors" title="New Series Proposal">
              <Plus className="h-5 w-5" />
            </button>
          ) : (
            <div className="rounded-xl border border-border bg-foreground/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-foreground/70">
                  Quick Create
                </span>
                <button className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] font-medium text-foreground/80 hover:bg-foreground/5 hover:text-foreground transition-colors">
                  <BookOpen className="h-3.5 w-3.5" />
                  New Series Proposal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={`border-t border-border py-4 ${collapsed ? "px-0 flex justify-center" : "px-4"}`}>
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold">
            {me.avatar}
          </div>
          {!collapsed && (
            <div className="min-w-0 text-[12px]">
              <div className="truncate font-medium">{me.name}</div>
              <div className="truncate font-jp text-foreground/60">{me.jp}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function isActive(path: string, to: string) {
  if (to === "/app/dashboard") return path === to;
  return path === to || path.startsWith(to + "/");
}

function Section({ label, className = "", collapsed }: { label: string; className?: string; collapsed?: boolean }) {
  if (collapsed) {
    return <div className={`my-2 mx-auto h-px w-6 bg-border ${className}`} />;
  }
  return (
    <div
      className={`px-3 pb-1.5 pt-2 text-[10px] uppercase tracking-wider text-foreground/45 ${className}`}
    >
      {label}
    </div>
  );
}

function Item({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed?: boolean }) {
  if (collapsed) {
    return (
      <Link
        to={item.to}
        title={item.label}
        className={`relative my-1 mx-auto flex h-10 w-10 items-center justify-center rounded-md transition ${
          active
            ? "bg-foreground/10 text-foreground"
            : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
        }`}
      >
        {active && (
          <span className="absolute left-[-8px] top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-foreground" />
        )}
        <item.icon className="h-5 w-5" />
        {item.badge && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        )}
      </Link>
    );
  }

  return (
    <Link
      to={item.to}
      className={`relative my-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition ${
        active
          ? "bg-foreground/10 font-medium text-foreground"
          : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-foreground" />
      )}
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
