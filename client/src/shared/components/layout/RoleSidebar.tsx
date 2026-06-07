import { useEffect } from "react"
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
]

interface RoleSidebarProps {
  isOpen: boolean
  onClose: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function RoleSidebar({ isOpen, onClose, collapsed, onToggleCollapse }: RoleSidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const role = user?.role.toLowerCase() ?? "admin"
  const roleLabel = user?.role
    ? `${user.role.charAt(0)}${user.role.slice(1).toLowerCase()} Studio`
    : "MangaFlow Studio"
  const visibleItems = SIDEBAR_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  )

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  async function handleLogout() {
    await logout()
    onClose()
    navigate("/login")
  }

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-inverse-surface/30 backdrop-blur-sm md:hidden"
          aria-label="Close navigation"
          onClick={onClose}
        />
      ) : null}
      <aside
        id="role-sidebar"
        aria-label="Primary navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full shrink-0 flex-col border-r border-outline-variant bg-surface-container py-lg shadow-dropdown transition-all duration-300",
          "md:static md:z-auto md:shadow-none",
          isOpen
            ? "visible translate-x-0"
            : "invisible -translate-x-full md:visible md:translate-x-0",
          collapsed ? "w-20" : "w-64",
        )}
      >
        {/* Brand + Toggle */}
        <div className={cn("flex items-center px-lg pb-md", collapsed && "flex-col px-0")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container">
            <span className="material-symbols-outlined text-on-primary-container" aria-hidden="true">brush</span>
          </div>
          {!collapsed && (
            <div className="ml-3 min-w-0 flex-1">
              <h2 className="text-title-lg text-primary">MangaFlow</h2>
              <p className="truncate text-label-sm text-on-surface-variant">{roleLabel}</p>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden md:flex items-center justify-center rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-higher transition-colors",
              collapsed && "mt-2",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined text-sm">
              {collapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-xs overflow-y-auto px-sm py-sm">
          <div className={cn("px-md pb-xs pt-sm", collapsed && "text-center px-0")}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline">
              {collapsed ? "—" : "Main"}
            </span>
          </div>
          {visibleItems.map((item) => {
            const path = `/app/${role}/${item.path}`
            return (
              <NavLink
                key={item.label}
                to={path}
                end
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-md rounded-full py-sm transition-colors focus-visible:outline-none focus-visible:shadow-focus",
                    collapsed
                      ? "mx-auto w-11 justify-center px-0"
                      : "mx-md px-md",
                    isActive
                      ? "bg-primary-container font-bold text-on-primary-container"
                      : "text-on-surface-variant hover:bg-surface-container-highest",
                  )
                }
              >
                <span className="material-symbols-outlined text-xl" aria-hidden="true">
                  {item.icon}
                </span>
                {!collapsed && <span className="text-label-md">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="mt-auto border-t border-outline-variant px-md pt-md">
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-sm rounded-full bg-primary py-sm text-on-primary transition-colors hover:bg-primary/90 focus-visible:shadow-focus",
              collapsed ? "justify-center px-0" : "justify-center px-md",
            )}
            aria-label="Logout"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">logout</span>
            {!collapsed && <span className="text-label-md">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
