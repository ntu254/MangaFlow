import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Shield,
  ClipboardList,
  Send,
  type LucideIcon,
} from "lucide-react";

export type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeCount?: number;
};

type RoleSidebarProps = {
  role: string;
  items: SidebarItem[];
  workspaceLabel: string;
  dark?: boolean;
};

export function RoleSidebar({ role, items, workspaceLabel, dark }: RoleSidebarProps) {
  return (
    <aside className={cn(
      "w-64 h-screen border-r flex flex-col sticky top-0",
      dark ? "bg-slate-900 border-slate-800/80" : "bg-mf-bg-sidebar border-mf-border"
    )}>
      <div className={cn("p-4 border-b", dark ? "border-slate-800/80" : "border-mf-border")}>
        <strong className={cn("text-lg tracking-tight", dark ? "text-white" : "text-mf-primary")}>MangaFlow</strong>
        <p className={cn("text-xs mt-0.5", dark ? "text-slate-400" : "text-mf-text-muted")}>{workspaceLabel}</p>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? dark
                    ? "bg-slate-800 text-white border-l-[3px] border-mf-primary shadow-sm"
                    : "bg-mf-bg-card text-mf-primary border-l-[3px] border-mf-primary shadow-sm"
                  : dark
                    ? "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                    : "text-mf-text-secondary hover:bg-mf-bg-card/60 hover:text-mf-text"
              )
            }
          >
            <item.icon className="size-4" />
            <span className="flex-1">{item.label}</span>
            {item.badgeCount !== undefined && item.badgeCount > 0 && (
              <span className="text-[10px] font-bold bg-mf-primary text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {item.badgeCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export const sidebarConfig: Record<string, SidebarItem[]> = {
  MANGAKA: [
    { label: "Dashboard", href: "/app/mangaka/dashboard", icon: LayoutDashboard },
    { label: "My Series", href: "/app/mangaka/series", icon: BookOpen },
    { label: "Tasks", href: "/app/mangaka/tasks", icon: ClipboardList },
    { label: "Submissions", href: "/app/mangaka/submissions", icon: Send },
    { label: "Ranking", href: "/app/mangaka/ranking", icon: BarChart3 },
  ],
  ASSISTANT: [
    { label: "Dashboard", href: "/app/assistant/dashboard", icon: LayoutDashboard },
    { label: "My Tasks", href: "/app/assistant/tasks", icon: ClipboardList },
  ],
  EDITOR: [
    { label: "Dashboard", href: "/app/editor/dashboard", icon: LayoutDashboard },
    { label: "Assigned Series", href: "/app/editor/series", icon: BookOpen },
  ],
  BOARD: [
    { label: "Dashboard", href: "/app/board/dashboard", icon: LayoutDashboard },
    { label: "Ranking", href: "/app/board/ranking", icon: BarChart3 },
    { label: "Import Ranking", href: "/app/board/ranking/import", icon: BarChart3 },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/app/admin/dashboard", icon: LayoutDashboard },
    { label: "Role Review", href: "/app/admin/role-review", icon: Shield },
  ],
};
