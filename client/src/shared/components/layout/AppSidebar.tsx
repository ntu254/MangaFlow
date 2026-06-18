import { NavLink, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/authStore"
import { useUiStore } from "@/shared/stores/uiStore"
import { cn } from "@/shared/lib/utils"
import {
  LayoutDashboard, BookOpen, Users, Settings, FileText,
  CheckSquare, BarChart2, DollarSign, Shield, LogOut, Layers,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react"
import type { UserRole } from "@/shared/types"
import logoImage from "@/assets/Logo.webp"

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  /** true when the destination route is not implemented yet — renders disabled. */
  comingSoon?: boolean
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard", to: "/app/admin/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Users", to: "/app/admin/users", icon: <Users size={18} /> },
    { label: "Board Members", to: "/app/admin/board-members", icon: <Shield size={18} /> },
    { label: "Task Types", to: "/app/admin/task-types", icon: <Settings size={18} /> },
    { label: "Earnings", to: "/app/admin/earnings", icon: <DollarSign size={18} /> },
    { label: "Audit Log", to: "/app/admin/audit-logs", icon: <FileText size={18} /> },
  ],
  MANGAKA: [
    { label: "Dashboard", to: "/app/mangaka/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "My Series", to: "/app/mangaka/series", icon: <BookOpen size={18} /> },
    { label: "Reviews", to: "/app/mangaka/reviews", icon: <CheckSquare size={18} /> },
    { label: "Payroll", to: "/app/mangaka/payroll", icon: <DollarSign size={18} />, comingSoon: true },
  ],
  ASSISTANT: [
    { label: "Dashboard", to: "/app/assistant/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "My Tasks", to: "/app/assistant/tasks", icon: <CheckSquare size={18} />, comingSoon: true },
    { label: "Earnings", to: "/app/assistant/earnings", icon: <DollarSign size={18} />, comingSoon: true },
  ],
  EDITOR: [
    { label: "Dashboard", to: "/app/editor/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Manuscripts", to: "/app/editor/manuscripts", icon: <FileText size={18} /> },
    { label: "Chapters", to: "/app/editor/chapters", icon: <Layers size={18} />, comingSoon: true },
  ],
  BOARD: [
    { label: "Dashboard", to: "/app/board/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Series Review", to: "/app/board/series", icon: <BookOpen size={18} /> },
    { label: "Ranking", to: "/app/board/ranking", icon: <BarChart2 size={18} />, comingSoon: true },
    { label: "At-Risk", to: "/app/board/at-risk", icon: <Shield size={18} />, comingSoon: true },
  ],
}

export function AppSidebar({ mode }: { mode: "expanded" | "rail" }) {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  if (!user) return null
  const items = NAV_ITEMS[user.role] ?? []
  const isRail = mode === "rail"

  const handleLogout = () => {
    clearAuth()
    navigate("/login")
  }

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        isRail ? "w-[var(--sidebar-rail-width)]" : "w-[var(--sidebar-width)]"
      )}
    >
      {/* Logo + collapse toggle */}
      <div className={cn("flex h-16 items-center border-b border-sidebar-border", isRail ? "justify-center px-2" : "gap-3 px-5")}>
        <img src={logoImage} alt="MangaFlow" className="h-8 w-8 shrink-0 object-contain" />
        {!isRail && <span className="flex-1 truncate text-lg font-bold tracking-tight">MangaFlow</span>}
        <button
          onClick={toggleSidebar}
          className={cn("rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground", isRail && "hidden")}
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {isRail && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mt-2 rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen size={18} />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) =>
          item.comingSoon ? (
            <span
              key={item.to}
              title={isRail ? `${item.label} — Coming soon` : "Coming soon"}
              aria-disabled="true"
              className={cn(
                "flex cursor-not-allowed select-none items-center rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/30",
                isRail && "justify-center px-0"
              )}
            >
              {item.icon}
              {!isRail && (
                <>
                  <span className="ml-3 flex-1">{item.label}</span>
                  <span className="rounded border border-sidebar-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider">Soon</span>
                </>
              )}
            </span>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              title={isRail ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isRail && "justify-center px-0",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )
              }
            >
              {item.icon}
              {!isRail && <span className="ml-3">{item.label}</span>}
            </NavLink>
          )
        )}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={handleLogout}
          title={isRail ? "Logout" : undefined}
          className={cn(
            "flex w-full items-center rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
            isRail && "justify-center px-0"
          )}
        >
          <LogOut size={16} />
          {!isRail && <span className="ml-2">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
