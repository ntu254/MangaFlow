import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/shared/hooks/useAuth";
import { useState, useEffect } from "react";
import { apiBaseUrl } from "@/shared/api";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Shield,
  ClipboardList,
  Send,
  Coins,
  Bell,
  User,
  Settings,
  LogOut,
  Users,
  HardDrive,
  History,
  Activity,
  Layers,
  FolderOpen,
  FileImage,
  MessageSquare,
  RefreshCw,
  CheckSquare,
  ThumbsUp,
  Upload,
  AlertTriangle,
  FileText,
  Scale,
  Wallet,
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

export function RoleSidebar({ role, items: initialItems, workspaceLabel, dark }: RoleSidebarProps) {
  const { signOut, getToken } = useAuth();
  const [items, setItems] = useState<SidebarItem[]>(initialItems);

  // Sync state if initialItems change
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Dynamically check if BOARD role is BOARD_CHAIR to add Tie-break Queue
  useEffect(() => {
    if (role !== "BOARD") return;

    let active = true;
    async function checkBoardChair() {
      try {
        const token = await getToken();
        if (!token) return;

        // Fetch current user details
        const meRes = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!meRes.ok) return;
        const meBody = await meRes.json();
        const userId = meBody.data?.user?.id;
        if (!userId) return;

        // Fetch board members list
        const res = await fetch(`${apiBaseUrl}/board/members`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok && active) {
          const body = await res.json();
          if (body.success && Array.isArray(body.data)) {
            const member = body.data.find((m: any) => m.userId === userId);
            if (member && member.role === "BOARD_CHAIR") {
              setItems((prev) => {
                // Avoid duplicate additions
                if (prev.some((item) => item.label === "Tie-break Queue")) return prev;
                return [
                  ...prev,
                  { label: "Tie-break Queue", href: "/app/board/tie-breaks", icon: Scale }
                ];
              });
            }
          }
        }
      } catch (err) {
        console.warn("Failed to check board chair role:", err);
      }
    }

    void checkBoardChair();
    return () => {
      active = false;
    };
  }, [role, getToken]);

  return (
    <aside className={cn(
      "w-64 h-screen border-r flex flex-col sticky top-0",
      dark ? "bg-slate-900 border-slate-800/80 text-white" : "bg-mf-bg-sidebar border-mf-border text-mf-text"
    )}>
      {/* Header */}
      <div className={cn("p-4 border-b", dark ? "border-slate-800/80" : "border-mf-border")}>
        <strong className={cn("text-lg tracking-tight", dark ? "text-white" : "text-mf-primary")}>MangaFlow</strong>
        <p className={cn("text-xs mt-0.5", dark ? "text-slate-400" : "text-mf-text-muted")}>{workspaceLabel}</p>
      </div>

      {/* Main Navigation */}
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
              <span className="text-[10px] font-bold bg-mf-primary text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center animate-pulse">
                {item.badgeCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Area (Logout only) */}
      <div className={cn("p-3 border-t mt-auto", dark ? "border-slate-800/80" : "border-mf-border")}>
        <button
          onClick={signOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
            dark
              ? "text-slate-400 hover:bg-red-950/20 hover:text-red-400"
              : "text-mf-text-secondary hover:bg-red-50 hover:text-red-600"
          )}
        >
          <LogOut className="size-4" />
          <span className="flex-1">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export const sidebarConfig: Record<string, SidebarItem[]> = {
  ADMIN: [
    { label: "Dashboard", href: "/app/admin/dashboard", icon: LayoutDashboard },
    { label: "Users", href: "/app/admin/users", icon: Users },
    { label: "Series", href: "/app/admin/series", icon: BookOpen },
    { label: "Board Members", href: "/app/admin/board/members", icon: Users },
    { label: "Task Rates", href: "/app/admin/task-rates", icon: Coins },
    { label: "Payroll", href: "/app/admin/payroll", icon: Wallet },
    { label: "Ranking", href: "/app/admin/ranking", icon: BarChart3 },
    { label: "Storage", href: "/app/admin/storage", icon: HardDrive },
    { label: "Audit Logs", href: "/app/admin/audit-logs", icon: History },
    { label: "System Health", href: "/app/admin/system-health", icon: Activity },
  ],
  MANGAKA: [
    { label: "Dashboard", href: "/app/mangaka/dashboard", icon: LayoutDashboard },
    { label: "My Series", href: "/app/mangaka/series", icon: BookOpen },
    { label: "Manuscripts", href: "/app/mangaka/manuscripts", icon: Layers },
    { label: "Chapters", href: "/app/mangaka/chapters", icon: FolderOpen },
    { label: "Pages", href: "/app/mangaka/pages", icon: FileImage },
    { label: "Tasks", href: "/app/mangaka/tasks", icon: ClipboardList },
    { label: "Submissions", href: "/app/mangaka/submissions", icon: Send },
    { label: "Comments", href: "/app/mangaka/comments", icon: MessageSquare },
    { label: "Ranking", href: "/app/mangaka/ranking", icon: BarChart3 },
    { label: "Payroll", href: "/app/mangaka/payroll", icon: Coins },
  ],
  ASSISTANT: [
    { label: "Dashboard", href: "/app/assistant/dashboard", icon: LayoutDashboard },
    { label: "Tasks", href: "/app/assistant/tasks", icon: ClipboardList },
    { label: "Submissions", href: "/app/assistant/submissions", icon: Send },
    { label: "Comments", href: "/app/assistant/comments", icon: MessageSquare },
    { label: "Ranking", href: "/app/assistant/ranking", icon: BarChart3 },
    { label: "Payroll", href: "/app/assistant/earnings", icon: Wallet },
  ],
  EDITOR: [
    { label: "Dashboard", href: "/app/editor/dashboard", icon: LayoutDashboard },
    { label: "Assigned Series", href: "/app/editor/series", icon: BookOpen },
    { label: "Manuscripts", href: "/app/editor/manuscripts", icon: FileText },
    { label: "Chapters", href: "/app/editor/chapters", icon: FolderOpen },
    { label: "Pages", href: "/app/editor/pages", icon: FileImage },
    { label: "Submissions", href: "/app/editor/submissions", icon: Send },
    { label: "Comments", href: "/app/editor/comments", icon: MessageSquare },
    { label: "Tasks", href: "/app/editor/tasks", icon: ClipboardList },
    { label: "Ranking", href: "/app/editor/ranking", icon: BarChart3 },
    { label: "Payroll", href: "/app/editor/payroll", icon: Wallet },
  ],
  BOARD: [
    { label: "Dashboard", href: "/app/board/dashboard", icon: LayoutDashboard },
    { label: "Series Approvals", href: "/app/board/series-approvals", icon: CheckSquare },
    { label: "My Votes", href: "/app/board/votes", icon: ThumbsUp },
    { label: "Ranking", href: "/app/board/ranking", icon: BarChart3 },
    { label: "Import Ranking", href: "/app/board/ranking/import", icon: Upload },
    { label: "Publication", href: "/app/board/publication", icon: CheckSquare },
    { label: "At-Risk Series", href: "/app/board/at-risk", icon: AlertTriangle },
    { label: "Decisions", href: "/app/board/decisions", icon: History },
    { label: "Payroll", href: "/app/board/payroll", icon: Wallet },
  ],
};

