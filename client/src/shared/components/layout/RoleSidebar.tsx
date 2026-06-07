import { NavLink, useNavigate } from "react-router-dom"
import { cn } from "@/shared/lib/utils"
import { useAuth } from "@/shared/components/auth/AuthProvider"

interface SidebarItem {
  label: string
  path: string
  icon: string
  roles?: string[]
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Dashboard", path: "dashboard", icon: "dashboard" },
  {
    label: "Series",
    path: "/app/series",
    icon: "auto_stories",
    roles: ["ADMIN", "MANGAKA", "EDITOR", "BOARD"],
  },
  {
    label: "Tasks",
    path: "/app/tasks",
    icon: "assignment",
    roles: ["MANGAKA", "ASSISTANT", "EDITOR"],
  },
  {
    label: "Review",
    path: "/app/review",
    icon: "rate_review",
    roles: ["MANGAKA", "EDITOR"],
  },
  {
    label: "Board",
    path: "/app/board",
    icon: "how_to_vote",
    roles: ["BOARD"],
  },
  {
    label: "Admin",
    path: "/app/admin",
    icon: "admin_panel_settings",
    roles: ["ADMIN"],
  },
]

export function RoleSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const role = user?.role.toLowerCase() ?? "admin"
  const roleLabel = user?.role
    ? `${user.role.charAt(0)}${user.role.slice(1).toLowerCase()} Studio`
    : "MangaFlow Studio"
  const visibleItems = SIDEBAR_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  )

  async function handleLogout() {
    await logout()
    navigate("/login")
  }

  return (
    <aside className="hidden md:flex flex-col bg-surface-container border-r border-outline-variant w-64 shrink-0 h-full py-lg space-y-sm transition-all duration-300">
      <div className="px-lg pb-md flex items-center gap-md">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-on-primary-container">brush</span>
        </div>
        <div>
          <h2 className="text-title-lg font-title-lg text-primary">MangaFlow</h2>
          <p className="text-label-sm font-label-sm text-on-surface-variant">{roleLabel}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-xs px-sm py-sm">
        <div className="px-md pt-sm pb-xs">
          <span className="text-[10px] font-bold text-outline uppercase tracking-widest ml-md">Main</span>
        </div>
        {visibleItems.map((item) => {
          const path = item.path === "dashboard" ? `/app/${role}/dashboard` : item.path

          return (
            <NavLink
              key={item.label}
              to={path}
              end
              className={({ isActive }) =>
                cn(
                  "mx-md flex items-center gap-md rounded-full px-md py-sm transition-transform duration-150 active:scale-95",
                  isActive
                    ? "bg-primary-container font-bold text-on-primary-container"
                    : "text-on-surface-variant transition-colors hover:bg-surface-container-highest",
                )
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-label-md font-label-md">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="px-md mt-auto pt-md border-t border-outline-variant">
        <button
          onClick={handleLogout}
          className="w-full bg-primary text-on-primary rounded-full py-sm px-md flex items-center justify-center gap-sm hover:bg-primary-container hover:text-on-primary-container transition-colors font-label-md text-label-md shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Logout
        </button>
      </div>
    </aside>
  )
}
