import { Link } from "react-router-dom"
import { MFButton } from "@/shared/components/ui/MFButton"

interface NavItem {
  label: string
  path: string
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Series", path: "/series" },
  { label: "Tasks", path: "/tasks" },
  { label: "Review", path: "/review" },
  { label: "Board", path: "/board" },
]

export function AppNavbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-outline-variant bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link to="/dashboard" className="text-title-lg font-bold text-primary">
          MangaFlow
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="rounded-full px-4 py-2 text-label-sm font-semibold text-on-surface-muted transition-colors hover:bg-surface-low hover:text-on-surface"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin">
            <MFButton variant="ghost" size="sm">Admin</MFButton>
          </Link>
          <Link to="/login">
            <MFButton variant="outline" size="sm">Logout</MFButton>
          </Link>
        </div>
      </div>
    </nav>
  )
}
