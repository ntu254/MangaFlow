import { NavLink } from "react-router-dom"
import { cn } from "@/shared/lib/utils"

interface SidebarItem {
  label: string
  path: string
  icon: string
}

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", path: "/app/dashboard", icon: "□" },
  { label: "Series", path: "/app/series", icon: "📄" },
  { label: "Tasks", path: "/app/tasks", icon: "✓" },
  { label: "Review", path: "/app/review", icon: "☆" },
  { label: "Board", path: "/app/board", icon: "△" },
  { label: "Admin", path: "/app/admin", icon: "⚙" },
]

interface RoleSidebarProps {
  isOpen: boolean
  onClose?: () => void
}

export function RoleSidebar({ isOpen }: RoleSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-[88px] z-40 h-[calc(100vh-88px)] w-60 border-r border-outline-variant/30 bg-surface-low transition-transform duration-200",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <nav className="flex flex-col gap-sm p-md">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/app/dashboard"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-md rounded-lg px-md py-sm text-label-md font-semibold transition-colors",
                isActive
                  ? "bg-primary-fixed text-on-primary-fixed"
                  : "text-on-surface-muted hover:bg-surface-container hover:text-on-surface",
              )
            }
          >
            <span className="text-[16px]">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
