import { Bell, Settings, Search, ChevronDown } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { useAuthStore } from "@/features/auth/store/authStore"

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  MANGAKA: "Mangaka",
  ASSISTANT: "Assistant",
  EDITOR: "Tantou Editor",
  BOARD: "Editorial Board",
}

/**
 * Global utility bar. Holds ONLY app-wide tools (search, notifications,
 * settings, account). Entity title/tabs belong to ContextHeader, not here.
 */
export function AppNavbar() {
  const { user } = useAuthStore()

  return (
    <header className="flex h-[var(--navbar-height)] shrink-0 items-center gap-4 border-b border-border bg-card px-6">
      <div className="relative hidden w-full max-w-md md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search series, chapters, tasks, users..."
          className="h-9 w-full rounded-lg bg-secondary/50 pl-9 text-sm"
        />
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-primary text-[10px] font-bold text-primary-foreground">
            3
          </span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
          <Settings className="h-5 w-5" />
        </Button>

        <div className="mx-2 h-6 w-px bg-border" />

        <button className="flex items-center gap-2 rounded-full border border-transparent p-1 pr-3 transition-colors hover:border-border hover:bg-secondary/50">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-bold text-primary">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="hidden text-left sm:block">
            <div className="text-sm font-medium leading-tight text-foreground">{user?.name || "User"}</div>
            <div className="text-[11px] leading-tight text-muted-foreground">{user ? ROLE_LABEL[user.role] : ""}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  )
}
