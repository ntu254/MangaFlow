import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/shared/components/auth/AuthProvider"
import { MFButton } from "@/shared/components/ui/MFButton"

interface NavItem {
  label: string
  path: string
}

const ROLE_DASHBOARD: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  MANGAKA: "/mangaka/dashboard",
  ASSISTANT: "/assistant/dashboard",
  EDITOR: "/editor/dashboard",
  BOARD: "/board/dashboard",
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Series", path: "/series" },
  { label: "Tasks", path: "/tasks" },
  { label: "Review", path: "/review" },
  { label: "Board", path: "/board" },
]

export function AppNavbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate("/login")
  }

  function roleDashboard(): string {
    return user ? ROLE_DASHBOARD[user.role] ?? "/app/dashboard" : "/app/dashboard"
  }

  return (
    <nav className="sticky top-md z-50 mx-auto mt-lg w-[96%] max-w-7xl rounded-full border border-outline-variant/30 bg-surface/80 px-xl py-md shadow-sm backdrop-blur-md transition-transform duration-200 hover:scale-[0.99]">
      <div className="flex items-center justify-between">
        <Link to={roleDashboard()} className="flex items-center gap-md">
          <span className="text-title-lg font-bold text-primary">MangaFlow</span>
        </Link>
        <div className="hidden items-center gap-lg md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="rounded-full px-lg py-sm text-label-sm font-semibold text-on-surface-variant transition-colors duration-200 hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-md">
          {user && (
            <span className="text-label-sm text-on-surface-muted">
              {user.name}
            </span>
          )}
          {user?.role === "ADMIN" && (
            <Link to="/admin">
              <MFButton variant="ghost" size="sm">Admin</MFButton>
            </Link>
          )}
          <MFButton variant="outline" size="sm" onClick={handleLogout}>Logout</MFButton>
        </div>
      </div>
    </nav>
  )
}
