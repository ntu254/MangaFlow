import { NavLink, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, BookOpen, Users, Settings, FileText,
  CheckSquare, BarChart2, DollarSign, Shield, LogOut, Layers
} from "lucide-react"
import type { UserRole } from "@/types"
import logoImage from "@/assets/Logo.webp"

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  /** true when the destination route is not implemented yet — renders disabled with tooltip */
  comingSoon?: boolean
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard", to: "/app/admin/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Users", to: "/app/admin/users", icon: <Users size={18} /> },
    { label: "Board Members", to: "/app/admin/board-members", icon: <Shield size={18} /> },
    { label: "Task Types", to: "/app/admin/task-types", icon: <Settings size={18} /> },
    { label: "Audit Log", to: "/app/admin/audit-log", icon: <FileText size={18} />, comingSoon: true },
  ],
  MANGAKA: [
    { label: "Dashboard", to: "/app/mangaka/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "My Series", to: "/app/mangaka/series", icon: <BookOpen size={18} /> },
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

export function AppSidebar() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  if (!user) return null
  const items = NAV_ITEMS[user.role] ?? []

  const handleLogout = () => {
    clearAuth()
    navigate("/login")
  }

  return (
    <aside className="w-64 bg-white flex flex-col border-r border-gray-100 shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-100">
        <img src={logoImage} alt="MangaFlow" className="w-8 h-8 object-contain" />
        <span className="text-gray-900 font-bold text-xl tracking-tight">MangaFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) =>
          item.comingSoon ? (
            <span
              key={item.to}
              title="Coming soon"
              aria-disabled="true"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-300 cursor-not-allowed select-none"
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-300 border border-gray-200 px-1.5 py-0.5 rounded">
                Soon
              </span>
            </span>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-purple-50 text-purple-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  )
}
