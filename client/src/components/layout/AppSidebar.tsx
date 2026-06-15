import { NavLink, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, BookOpen, Users, Settings, FileText,
  CheckSquare, BarChart2, DollarSign, Shield, LogOut, Layers
} from "lucide-react"
import type { UserRole } from "@/types"
import logoImage from "@/assets/Logo.webp"

interface NavItem { label: string; to: string; icon: React.ReactNode }

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard", to: "/app/admin/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Users", to: "/app/admin/users", icon: <Users size={18} /> },
    { label: "Board Members", to: "/app/admin/board-members", icon: <Shield size={18} /> },
    { label: "Task Types", to: "/app/admin/task-types", icon: <Settings size={18} /> },
    { label: "Audit Log", to: "/app/admin/audit-log", icon: <FileText size={18} /> },
  ],
  MANGAKA: [
    { label: "Dashboard", to: "/app/mangaka/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "My Series", to: "/app/mangaka/series", icon: <BookOpen size={18} /> },
    { label: "Payroll", to: "/app/mangaka/payroll", icon: <DollarSign size={18} /> },
  ],
  ASSISTANT: [
    { label: "Dashboard", to: "/app/assistant/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "My Tasks", to: "/app/assistant/tasks", icon: <CheckSquare size={18} /> },
    { label: "Earnings", to: "/app/assistant/earnings", icon: <DollarSign size={18} /> },
  ],
  EDITOR: [
    { label: "Dashboard", to: "/app/editor/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Manuscripts", to: "/app/editor/manuscripts", icon: <FileText size={18} /> },
    { label: "Chapters", to: "/app/editor/chapters", icon: <Layers size={18} /> },
  ],
  BOARD: [
    { label: "Dashboard", to: "/app/board/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Series Review", to: "/app/board/series", icon: <BookOpen size={18} /> },
    { label: "Ranking", to: "/app/board/ranking", icon: <BarChart2 size={18} /> },
    { label: "At-Risk", to: "/app/board/at-risk", icon: <Shield size={18} /> },
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
        {items.map((item) => (
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
        ))}
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
