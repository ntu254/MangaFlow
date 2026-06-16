import { Bell, Settings, Search, ChevronDown } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { useAuthStore } from "@/features/auth/store/authStore"
import { useLocation } from "react-router-dom"

const getPageInfo = (pathname: string) => {
  if (pathname.includes('/admin/users')) {
    return { title: 'User Management', subtitle: 'Create, search, and manage user accounts.' };
  }
  if (pathname.includes('/admin/board-members')) {
    return { title: 'Board Members', subtitle: 'Manage editorial board composition and status.' };
  }
  if (pathname.includes('/admin/task-types')) {
    return { title: 'Task Types', subtitle: 'Configure production task templates.' };
  }
  if (pathname.includes('/mangaka/dashboard')) {
    return { title: 'Home', subtitle: "Your manga production command center." };
  }
  if (pathname.includes('/admin/dashboard')) {
    return { title: 'Admin Dashboard', subtitle: 'Monitor users, board governance, and health.' };
  }
  return { title: 'MangaFlow', subtitle: 'Studio Management System' };
}

export function AppNavbar() {
  const { user } = useAuthStore()
  const location = useLocation()
  const pageInfo = getPageInfo(location.pathname)

  return (
    <header className="h-16 border-b bg-background flex items-center px-6 shrink-0 z-10">
      <div className="flex-1 flex flex-col min-w-0 pr-4">
        <h1 className="text-[17px] font-bold tracking-tight text-gray-900 leading-tight truncate">{pageInfo.title}</h1>
        <p className="text-[11px] text-muted-foreground truncate">{pageInfo.subtitle}</p>
      </div>

      <div className="w-full max-w-md relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          type="text" 
          placeholder="Search users, tasks, series, or settings..." 
          className="w-full pl-9 bg-gray-50/50 border-gray-200 h-9 rounded-lg focus-visible:ring-primary shadow-sm text-sm"
        />
      </div>
      
      <div className="flex-1 flex items-center justify-end gap-2 pl-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
            <Bell className="h-5 w-5" />
            <div className="absolute top-1.5 right-1.5 h-4 w-4 flex items-center justify-center text-[10px] bg-primary text-white font-bold border-2 border-white rounded-full">
              3
            </div>
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="w-px h-6 bg-gray-200 mx-2"></div>

        <button className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded-full pr-3 transition-colors border border-transparent hover:border-gray-200">
          <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-primary font-bold">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <span className="text-sm font-medium text-gray-700">{user?.name || "Akira S."}</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </header>
  )
}