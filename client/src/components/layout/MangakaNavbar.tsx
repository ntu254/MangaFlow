import { Bell, Settings, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/authStore"
import { NavLink, useNavigate } from "react-router-dom"
import logoImage from "@/assets/Logo.webp"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: 'Home', to: '/app/mangaka/dashboard' },
  { label: 'Series', to: '/app/mangaka/series' },
  { label: 'Inbox', to: '/app/mangaka/inbox' },
  { label: 'Ranking', to: '/app/mangaka/ranking' },
  { label: 'Payroll', to: '/app/mangaka/payroll' },
]

export function MangakaNavbar() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate("/login")
  }

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 shrink-0 z-10 justify-between sticky top-0">
      <div className="flex items-center gap-10 h-full">
        <div className="flex items-center gap-2">
          <img src={logoImage} alt="MangaFlow" className="w-8 h-8 object-contain" />
          <span className="text-gray-900 font-bold text-lg tracking-tight">MangaFlow</span>
        </div>

        <nav className="hidden md:flex items-center gap-4 h-full">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "px-2 h-full flex items-center text-sm font-semibold border-b-2 transition-colors",
                  isActive
                    ? "border-purple-600 text-purple-700"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="w-full max-w-lg relative hidden lg:block mx-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          type="text" 
          placeholder="Search series, chapters, or people..." 
          className="w-full pl-9 bg-gray-50/50 border-gray-200 h-9 rounded-lg focus-visible:ring-primary shadow-sm text-sm"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
            <Bell className="h-5 w-5" />
            <div className="absolute top-1.5 right-1.5 h-4 w-4 flex items-center justify-center text-[10px] bg-red-500 text-white font-bold border-2 border-white rounded-full">
              6
            </div>
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="w-px h-6 bg-gray-200 mx-3"></div>

        <button onClick={handleLogout} className="flex items-center gap-3 hover:bg-gray-50 p-1 rounded-full pr-4 transition-colors border border-transparent hover:border-gray-200">
          <div className="flex flex-col items-end pt-0.5">
            <span className="text-[13px] font-bold text-gray-900 leading-none">{user?.name || "Mika Tan"}</span>
            <span className="text-[11px] text-gray-500 mt-0.5">Mangaka</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-purple-100 overflow-hidden flex items-center justify-center text-purple-700 font-bold border border-gray-200 shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
          </div>
        </button>
      </div>
    </header>
  )
}
