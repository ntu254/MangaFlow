import { useEffect } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { cn } from "@/shared/lib/utils"
import { useAuth } from "@/shared/components/auth/AuthProvider"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFIconButton } from "@/shared/components/ui/MFIconButton"

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

interface RoleSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function RoleSidebar({ isOpen, onClose }: RoleSidebarProps) {
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
          "fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col space-y-sm border-r border-outline-variant bg-surface-container py-lg shadow-dropdown transition-transform duration-300",
          "md:static md:z-auto md:translate-x-0 md:shadow-none",
          isOpen
            ? "visible translate-x-0"
            : "invisible -translate-x-full md:visible",
        )}
      >
        <div className="flex items-center gap-md px-lg pb-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container">
            <span className="material-symbols-outlined text-on-primary-container" aria-hidden="true">brush</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-title-lg text-primary">MangaFlow</h2>
            <p className="truncate text-label-sm text-on-surface-variant">{roleLabel}</p>
          </div>
          <MFIconButton
            className="md:hidden"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </MFIconButton>
        </div>

        <nav className="flex-1 space-y-xs overflow-y-auto px-sm py-sm">
          <div className="px-md pb-xs pt-sm">
            <span className="ml-md text-[10px] font-bold uppercase tracking-widest text-outline">
              Main
            </span>
          </div>
          {visibleItems.map((item) => {
            const path = item.path === "dashboard" ? `/app/${role}/dashboard` : item.path

            return (
              <NavLink
                key={item.label}
                to={path}
                end
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "mx-md flex min-h-11 items-center gap-md rounded-full px-md py-sm",
                    "transition-colors focus-visible:outline-none focus-visible:shadow-focus",
                    isActive
                      ? "bg-primary-container font-bold text-on-primary-container"
                      : "text-on-surface-variant hover:bg-surface-container-highest",
                  )
                }
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="text-label-md">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-outline-variant px-md pt-md">
          <MFButton onClick={handleLogout} className="w-full focus-visible:shadow-focus">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              logout
            </span>
            Logout
          </MFButton>
        </div>
      </aside>
    </>
  )
}
