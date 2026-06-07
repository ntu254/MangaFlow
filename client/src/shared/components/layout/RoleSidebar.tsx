import { NavLink, useNavigate } from "react-router-dom"
import { cn } from "@/shared/lib/utils"
import { useAuth } from "@/shared/components/auth/AuthProvider"

export function RoleSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const role = user?.role.toLowerCase() ?? "admin"

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
          <p className="text-label-sm font-label-sm text-on-surface-variant">Studio Admin</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-xs px-sm py-sm">
        <div className="px-md pt-sm pb-xs">
          <span className="text-[10px] font-bold text-outline uppercase tracking-widest ml-md">Main</span>
        </div>
        <NavLink
          to={`/app/${role}/dashboard`}
          end
          className={({ isActive }) =>
            cn(
              "flex items-center gap-md px-md py-sm rounded-full mx-md active:scale-95 transition-transform duration-150",
              isActive
                ? "bg-primary-container text-on-primary-container font-bold"
                : "text-on-surface-variant hover:bg-surface-container-highest transition-colors",
            )
          }
        >
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
          <span className="text-label-md font-label-md">Dashboard</span>
        </NavLink>
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
