import { NavLink } from "react-router-dom"
import { cn } from "@/shared/lib/utils"

interface SidebarItem {
  label: string
  path: string
  icon: string
}

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: "□" },
  { label: "Series", path: "/series", icon: "📄" },
  { label: "Tasks", path: "/tasks", icon: "✓" },
  { label: "Review", path: "/review", icon: "☆" },
  { label: "Board", path: "/board", icon: "△" },
  { label: "Admin", path: "/admin", icon: "⚙" },
]

interface RoleSidebarProps {
  isOpen: boolean
  onClose?: () => void
}

export function RoleSidebar({ isOpen }: RoleSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-60 border-r border-outline-variant bg-surface-low transition-transform duration-200",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <nav className="flex flex-col gap-1 p-3">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/dashboard"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-label-md font-semibold transition-colors",
                isActive
                  ? "bg-primary-container text-primary-deep"
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
