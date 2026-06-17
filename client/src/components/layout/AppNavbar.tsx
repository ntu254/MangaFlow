import { Bell, Search, Sparkles, HelpCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/authStore"
import { useLocation } from "react-router-dom"

type PageMeta = {
  eyebrow: string
  title: string
}

const matchPage = (pathname: string): PageMeta => {
  const map: Array<[RegExp, PageMeta]> = [
    [/\/admin\/dashboard/,       { eyebrow: "Admin",     title: "Studio overview" }],
    [/\/admin\/users\/create/,   { eyebrow: "Admin",     title: "Invite a new member" }],
    [/\/admin\/users/,           { eyebrow: "Admin",     title: "Users" }],
    [/\/admin\/board-members/,   { eyebrow: "Admin",     title: "Editorial board" }],
    [/\/admin\/task-types/,      { eyebrow: "Admin",     title: "Task templates" }],
    [/\/admin\/audit-log/,       { eyebrow: "Admin",     title: "Audit log" }],
    [/\/mangaka\/dashboard/,     { eyebrow: "Mangaka",   title: "Home" }],
    [/\/mangaka\/series\/create/,{ eyebrow: "Mangaka",   title: "New series proposal" }],
    [/\/mangaka\/series\/\w+/,   { eyebrow: "Mangaka",   title: "Series workspace" }],
    [/\/mangaka\/series/,        { eyebrow: "Mangaka",   title: "My series" }],
    [/\/mangaka\/inbox/,         { eyebrow: "Mangaka",   title: "Inbox" }],
    [/\/mangaka\/ranking/,       { eyebrow: "Mangaka",   title: "Ranking" }],
    [/\/mangaka\/payroll/,       { eyebrow: "Mangaka",   title: "Payroll" }],
    [/\/assistant\/dashboard/,   { eyebrow: "Assistant", title: "Today's tasks" }],
    [/\/assistant\/tasks/,       { eyebrow: "Assistant", title: "My tasks" }],
    [/\/assistant\/earnings/,    { eyebrow: "Assistant", title: "Earnings" }],
    [/\/editor\/dashboard/,      { eyebrow: "Editor",    title: "Review queue" }],
    [/\/board\/dashboard/,       { eyebrow: "Board",     title: "Decision desk" }],
    [/\/board\/series/,          { eyebrow: "Board",     title: "Series review" }],
    [/\/board\/ranking/,         { eyebrow: "Board",     title: "Ranking" }],
  ]
  const match = map.find(([re]) => re.test(pathname))
  return match ? match[1] : { eyebrow: "MangaFlow", title: "Studio" }
}

export function AppNavbar() {
  const { user } = useAuthStore()
  const location = useLocation()
  const meta = matchPage(location.pathname)

  return (
    <header
      className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/85 px-4 sm:px-6 lg:px-8 backdrop-blur supports-[backdrop-filter]:bg-card/75"
      data-testid="app-navbar"
    >
      {/* Page title block */}
      <div className="min-w-0 flex-1 sm:flex-none sm:w-72">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-primary truncate" data-testid="navbar-eyebrow">
          {meta.eyebrow}
        </div>
        <h1 className="text-[15px] font-semibold leading-tight tracking-tight text-foreground truncate" data-testid="navbar-title">
          {meta.title}
        </h1>
      </div>

      {/* Search */}
      <div className="relative hidden lg:block flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search series, chapters, tasks, people…"
          data-testid="navbar-search"
          className="h-10 pl-10 pr-16 bg-secondary/60 border-transparent shadow-none placeholder:text-muted-foreground focus-visible:bg-card focus-visible:border-border"
        />
        <kbd className="kbd pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:inline-flex">
          <span>⌘</span>K
        </kbd>
      </div>

      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="soft"
          size="sm"
          className="hidden sm:inline-flex gap-1.5"
          data-testid="navbar-assistant"
        >
          <Sparkles size={14} />
          Assist
        </Button>

        <Button variant="ghost" size="icon" aria-label="Help">
          <HelpCircle size={18} className="text-muted-foreground" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          data-testid="navbar-notifications"
          className="relative"
          aria-label="Notifications"
        >
          <Bell size={18} className="text-muted-foreground" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-card" />
        </Button>

        <div className="hidden sm:flex items-center gap-2 border-l border-border pl-3 ml-1">
          <div className="relative">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-semibold shadow-soft">
              {(user?.name ?? "M").charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" aria-hidden />
          </div>
          <div className="hidden lg:flex flex-col leading-tight">
            <span className="text-[13px] font-medium text-foreground" data-testid="navbar-user-name">
              {user?.name ?? "Studio user"}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {user?.email ?? user?.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
