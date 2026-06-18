import { NavLink } from "react-router-dom"
import { cn } from "@/shared/lib/utils"
import type { ContextHeaderConfig, ContextTab } from "./page-chrome"

export function ContextHeader({ header, tabs }: { header?: ContextHeaderConfig | null; tabs?: ContextTab[] }) {
  if (!header && (!tabs || tabs.length === 0)) return null

  return (
    <div className="border-b border-border bg-card">
      {header && (
        <div className="flex items-start justify-between gap-4 px-6 pt-4 pb-3">
          <div className="min-w-0">
            {header.breadcrumb && (
              <div className="mb-1 text-xs font-medium text-muted-foreground">{header.breadcrumb}</div>
            )}
            <div className="flex items-center gap-3">
              <h1 className="truncate text-xl font-bold tracking-tight text-foreground">{header.title}</h1>
              {header.status}
            </div>
          </div>
          {header.actions && <div className="flex shrink-0 items-center gap-2">{header.actions}</div>}
        </div>
      )}
      {tabs && tabs.length > 0 && <ContextTabs tabs={tabs} />}
    </div>
  )
}

export function ContextTabs({ tabs }: { tabs: ContextTab[] }) {
  return (
    <nav className="flex items-center gap-1 px-4">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              "relative flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
              isActive
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )
          }
        >
          {tab.label}
          {tab.badge != null && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-bold text-secondary-foreground">
              {tab.badge}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
