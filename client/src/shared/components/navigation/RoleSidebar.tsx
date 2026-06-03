import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Image,
  ClipboardList,
  Send,
  BarChart3,
  DollarSign,
  Bell,
  Settings,
  Users,
  Vote,
  AlertTriangle,
  History,
  Shield,
  Cog,
  HardDrive,
  ScrollText,
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
};

export function RoleSidebar({ role, items, workspaceLabel }: RoleSidebarProps) {
  return (
    <aside className="w-64 h-screen bg-mf-bg-sidebar border-r border-mf-border flex flex-col sticky top-0">
      <div className="p-4 border-b border-mf-border">
        <strong className="text-lg tracking-tight text-mf-primary">MangaFlow</strong>
        <p className="text-xs text-mf-text-muted mt-0.5">{workspaceLabel}</p>
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
                  ? "bg-mf-bg-card text-mf-primary border-l-[3px] border-mf-primary shadow-sm"
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
    { label: "Pages", href: "/app/mangaka/pages", icon: Image },
    { label: "Tasks", href: "/app/mangaka/tasks", icon: ClipboardList },
    { label: "Submissions", href: "/app/mangaka/submissions", icon: Send },
    { label: "Ranking", href: "/app/mangaka/ranking", icon: BarChart3 },
    { label: "Payroll", href: "/app/mangaka/payroll", icon: DollarSign },
    { label: "Notifications", href: "/app/mangaka/notifications", icon: Bell },
    { label: "Settings", href: "/app/mangaka/settings", icon: Settings },
  ],
  ASSISTANT: [
    { label: "Dashboard", href: "/app/assistant/dashboard", icon: LayoutDashboard },
    { label: "My Tasks", href: "/app/assistant/tasks", icon: ClipboardList },
    { label: "Submissions", href: "/app/assistant/submissions", icon: Send },
    { label: "Earnings", href: "/app/assistant/earnings", icon: DollarSign },
    { label: "Notifications", href: "/app/assistant/notifications", icon: Bell },
    { label: "Settings", href: "/app/assistant/settings", icon: Settings },
  ],
  EDITOR: [
    { label: "Dashboard", href: "/app/editor/dashboard", icon: LayoutDashboard },
    { label: "Assigned Series", href: "/app/editor/series", icon: BookOpen },
    { label: "Manuscript Review", href: "/app/editor/manuscripts", icon: FileText },
    { label: "Page Review", href: "/app/editor/pages", icon: Image },
    { label: "Comments", href: "/app/editor/comments", icon: ScrollText },
    { label: "Publication", href: "/app/editor/publication", icon: Send },
    { label: "Ranking Support", href: "/app/editor/ranking-support", icon: BarChart3 },
    { label: "Notifications", href: "/app/editor/notifications", icon: Bell },
    { label: "Settings", href: "/app/editor/settings", icon: Settings },
  ],
  BOARD: [
    { label: "Dashboard", href: "/app/board/dashboard", icon: LayoutDashboard },
    { label: "Series Approvals", href: "/app/board/series-approvals", icon: Vote },
    { label: "Ranking", href: "/app/board/ranking", icon: BarChart3 },
    { label: "Import Ranking", href: "/app/board/ranking/import", icon: BarChart3 },
    { label: "At-Risk Series", href: "/app/board/at-risk", icon: AlertTriangle },
    { label: "Decisions", href: "/app/board/decisions", icon: History },
    { label: "Notifications", href: "/app/board/notifications", icon: Bell },
    { label: "Settings", href: "/app/board/settings", icon: Settings },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/app/admin/dashboard", icon: LayoutDashboard },
    { label: "Users", href: "/app/admin/users", icon: Users },
    { label: "Board Members", href: "/app/admin/board/members", icon: Shield },
    { label: "Task Rates", href: "/app/admin/task-rates", icon: Cog },
    { label: "Audit Logs", href: "/app/admin/audit-logs", icon: ScrollText },
    { label: "Storage", href: "/app/admin/storage", icon: HardDrive },
    { label: "Settings", href: "/app/admin/settings", icon: Settings },
  ],
};
