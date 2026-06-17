import { NavLink, useNavigate, Link } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  FileText,
  CheckSquare,
  BarChart2,
  Wallet,
  Shield,
  LogOut,
  Inbox,
  PenLine,
  GalleryVerticalEnd,
  Crown,
  Sparkles,
  ChevronsUpDown,
} from "lucide-react"
import type { UserRole } from "@/types"

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  badge?: string | number
}

interface NavSection {
  label: string
  items: NavItem[]
}

const NAV: Record<UserRole, NavSection[]> = {
  ADMIN: [
    {
      label: "Workspace",
      items: [
        { label: "Overview", to: "/app/admin/dashboard", icon: <LayoutDashboard size={16} /> },
        { label: "Audit log", to: "/app/admin/audit-log", icon: <FileText size={16} /> },
      ],
    },
    {
      label: "Governance",
      items: [
        { label: "Users", to: "/app/admin/users", icon: <Users size={16} /> },
        { label: "Board members", to: "/app/admin/board-members", icon: <Shield size={16} /> },
        { label: "Task types", to: "/app/admin/task-types", icon: <Settings size={16} /> },
      ],
    },
  ],
  MANGAKA: [
    {
      label: "Studio",
      items: [
        { label: "Home", to: "/app/mangaka/dashboard", icon: <LayoutDashboard size={16} /> },
        { label: "My series", to: "/app/mangaka/series", icon: <BookOpen size={16} /> },
        { label: "Inbox", to: "/app/mangaka/inbox", icon: <Inbox size={16} />, badge: 6 },
      ],
    },
    {
      label: "Insights",
      items: [
        { label: "Ranking", to: "/app/mangaka/ranking", icon: <BarChart2 size={16} /> },
        { label: "Payroll", to: "/app/mangaka/payroll", icon: <Wallet size={16} /> },
      ],
    },
  ],
  ASSISTANT: [
    {
      label: "Workshop",
      items: [
        { label: "Overview", to: "/app/assistant/dashboard", icon: <LayoutDashboard size={16} /> },
        { label: "My tasks", to: "/app/assistant/tasks", icon: <CheckSquare size={16} />, badge: 4 },
        { label: "Earnings", to: "/app/assistant/earnings", icon: <Wallet size={16} /> },
      ],
    },
  ],
  EDITOR: [
    {
      label: "Editorial",
      items: [
        { label: "Overview", to: "/app/editor/dashboard", icon: <LayoutDashboard size={16} /> },
        { label: "Manuscripts", to: "/app/editor/manuscripts", icon: <FileText size={16} /> },
        { label: "Chapters", to: "/app/editor/chapters", icon: <GalleryVerticalEnd size={16} /> },
        { label: "Comments", to: "/app/editor/comments", icon: <PenLine size={16} />, badge: 14 },
      ],
    },
  ],
  BOARD: [
    {
      label: "Board",
      items: [
        { label: "Overview", to: "/app/board/dashboard", icon: <LayoutDashboard size={16} /> },
        { label: "Series review", to: "/app/board/series", icon: <BookOpen size={16} />, badge: 2 },
        { label: "Ranking", to: "/app/board/ranking", icon: <BarChart2 size={16} /> },
        { label: "At-risk", to: "/app/board/at-risk", icon: <Shield size={16} /> },
      ],
    },
  ],
}

const ROLE_META: Record<UserRole, { label: string; icon: React.ReactNode; tone: string }> = {
  ADMIN:     { label: "Administrator",    icon: <Shield size={11} />,                tone: "bg-slate-900 text-white" },
  MANGAKA:   { label: "Mangaka",          icon: <PenLine size={11} />,               tone: "bg-violet-100 text-violet-700" },
  ASSISTANT: { label: "Assistant",        icon: <Sparkles size={11} />,              tone: "bg-blue-100 text-blue-700" },
  EDITOR:    { label: "Tantou Editor",    icon: <GalleryVerticalEnd size={11} />,    tone: "bg-purple-100 text-purple-700" },
  BOARD:     { label: "Editorial Board",  icon: <Crown size={11} />,                 tone: "bg-orange-100 text-orange-700" },
}

export function AppSidebar() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  if (!user) return null
  const sections = NAV[user.role] ?? []
  const role = ROLE_META[user.role]

  const handleLogout = () => {
    clearAuth()
    navigate("/login")
  }

  return (
    <aside
      className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar"
      data-testid="app-sidebar"
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-border">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-500 text-white shadow-soft">
            <span className="font-bold text-lg leading-none">M</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold leading-none tracking-tight text-foreground">
              MangaFlow
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Production Hub
            </span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section.label} className="mb-6">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end
                    data-testid={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary-soft text-primary"
                          : "text-slate-600 hover:bg-slate-100 hover:text-foreground"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            "transition-colors",
                            isActive ? "text-primary" : "text-slate-500 group-hover:text-foreground"
                          )}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                        {item.badge != null && (
                          <span
                            className={cn(
                              "ml-auto inline-flex items-center justify-center rounded-md px-1.5 h-5 min-w-[20px] text-[10px] font-semibold",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "bg-slate-200 text-slate-700"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Help / Upgrade card */}
      <div className="px-3 pb-3">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-4 text-white shadow-soft">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
            <Sparkles size={12} /> Studio Assist
          </div>
          <p className="relative mt-2 text-xs leading-snug text-white/85">
            Auto-tag panels, summarize feedback, draft replies.
          </p>
          <button className="relative mt-3 inline-flex w-full items-center justify-center rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/25 transition-colors">
            Try beta
          </button>
        </div>
      </div>

      {/* User card */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-slate-100 transition-colors">
          <div className="relative">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-semibold shadow-soft">
              {(user.name || "M").charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground" data-testid="sidebar-user-name">
              {user.name ?? "Studio user"}
            </div>
            <div className="mt-0.5 flex items-center gap-1">
              <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0 text-[10px] font-medium", role.tone)}>
                {role.icon}
                {role.label}
              </span>
            </div>
          </div>
          <ChevronsUpDown size={14} className="text-muted-foreground shrink-0" />
        </div>
        <button
          onClick={handleLogout}
          data-testid="sidebar-logout-button"
          className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
